<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\Attachment;
use App\Models\Chat; 
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http; 
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\StreamedResponse;  

class InteractionController extends Controller
{
    private $groqApiKey;
    private $groqBaseUrl;
    private $groqModel;
    private $pythonServiceBaseUrl; 
    private const MAX_RECURSION_DEPTH = 5; 

    public function __construct()
    {
        $this->groqApiKey = config('services.groq.api_key');
        $this->groqBaseUrl = rtrim(config('services.groq.base_url'), '/');
        $this->groqModel = config('services.groq.model', 'mixtral-8x7b-32768');
        $this->pythonServiceBaseUrl = rtrim(config('services.python_service.base_url'), '/');
    }

    public function handleInteraction(Request $request)
    {
        $validator = Validator::make($request->json()->all(), [
            'chatId' => 'required', 
            'prompt' => 'required|string',
            'role' => 'nullable|string',
        ]);
       
        if ($validator->fails()) {
            return response()->json(['error' => 'Invalid request.'], 422);
        }

        try {
            $messageRequest = new Request($request->json()->all());
            $userMessage = $this->saveMessageWithAttachments($messageRequest);
        } catch (\Exception $e) {
            Log::error('Failed to save user message: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to save your message.'], 500);
        }

        $chatId = $userMessage->chat_id;
        $recentMessages = Message::where('chat_id', $chatId)
                                 ->where('id', '<', $userMessage->id) 
                                 ->orderBy('created_at', 'desc')
                                 ->orderBy('id', 'desc') 
                                 ->take(20) 
                                 ->get()
                                 ->reverse(); 

        $historicalContext = [];
        $lastRole = null;
        foreach ($recentMessages as $msg) {
            if ($msg->role === 'user') {
                if ($lastRole === 'user') continue; 
                $historicalContext[] = ['role' => 'user', 'content' => $this->formatUserPromptWithFileInfo($msg)];
            } elseif ($msg->role === 'assistant') {
                $historicalContext[] = ['role' => 'assistant', 'content' => $msg->content];
            } elseif ($msg->role === 'tool') { 
                 $historicalContext[] = [
                    'role' => 'tool',
                    'tool_call_id' => $msg->tool_call_id, 
                    'name' => $msg->name, 
                    'content' => $msg->content,
                ];
            }
            $lastRole = $msg->role;
        }
        
        $messagesForAI = array_merge(
            [['role' => 'system', 'content' => 'You are a helpful assistant. Maintain a conversational flow based on recent interactions.']],
            $historicalContext,
            [['role' => 'user', 'content' => $this->formatUserPromptWithFileInfo($userMessage)]]
        );
   
        Log::info('Messages for AI: '. json_encode($messagesForAI));
        
        return response()->stream(function () use ($messagesForAI, $request, $userMessage) {
            $this->streamAIResponse($messagesForAI, $userMessage->chat_id);
        }, 200, [
            'Content-Type' => 'text/plain',
            'Cache-Control' => 'no-cache',
            'X-Accel-Buffering' => 'no',
        ]);
    }

    private function saveMessageWithAttachments(Request $request): Message
    {
        return DB::transaction(function () use ($request) {
            $message = Message::create([
                'chat_id' => $request->input('chatId'),
                'content' => $request->input('prompt'),
                'role'    => $request->input('role', 'user'),
                'date'    => $request->input('date', now()->toDateString()),
            ]);
            $words = explode(' ', $message->content);
            $title = implode(' ', array_slice($words, 0, 3));
            Chat::findOrFail($request->input('chatId'))->update(['title' => $title]);

            if ($request->hasFile('files')) {
                foreach ($request->file('files') as $file) {
                    try {
                        $originalName = $file->getClientOriginalName();
                        $safeOriginalName = preg_replace("/[^a-zA-Z0-9_.-]/", "_", $originalName);
                        if (empty($safeOriginalName)) {
                            $safeOriginalName = 'file_' . time() . '.' . $file->guessExtension();
                        }

                        $filePath = $file->storeAs("public/attachments/{$message->id}", $safeOriginalName);
                        Attachment::create([
                            'message_id' => $message->id,
                            'type'       => $file->getClientMimeType(),
                            'content'    => Storage::url($filePath),
                        ]);
                    } catch (\Exception $e) {
                        Log::error("Failed to store attachment for message {$message->id}: " . $e->getMessage() . " File: " . ($file->getClientOriginalName() ?? 'unknown'));
                      
                    }
                }
            }
            $message->load('attachments');
            return $message;
        });
    }

    private function formatUserPromptWithFileInfo(Message $userMessage): string
    {
        $prompt = $userMessage->content;
        if ($userMessage->attachments && $userMessage->attachments->count() > 0) {
            $fileNames = $userMessage->attachments->map(function ($attachment) {
                return basename($attachment->content);
            })->implode(', ');
            $prompt = "User has uploaded the following files: [{$fileNames}].\nUser's message: {$prompt}";
        }
        return $prompt;
    }

    private function streamAIResponse($messagesForAI, $chatId)
    {
        set_time_limit(0);

        try {
            $response = Http::timeout(600)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $this->groqApiKey,
                    'Content-Type' => 'application/json',
                ])
                ->withOptions(['stream' => true])
                ->post($this->groqBaseUrl, [
                    'model' => env('MODEL'),
                    'messages' => $messagesForAI,
                    'temperature' => 0.7,
                    'max_tokens' => 2000,
                    'stream' => true,
                ]);

            if ($response->failed()) {
                Log::error('Groq API request failed', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                echo "The AI service failed to process the request.";
                return;
            }
            
            $body = $response->getBody();
            $contentBuffer = '';
            
            while (!$body->eof()) {
                $chunk = $body->read(8192); // Read a larger chunk
                
                // Manually parse the SSE events from the chunk
                $lines = explode("\n", $chunk);
                foreach($lines as $line) {
                    if (str_starts_with($line, 'data: ')) {
                        $jsonData = trim(substr($line, 6));
                        
                        if ($jsonData === '[DONE]') {
                            break 2;
                        }
                        
                        $data = json_decode($jsonData, true);
                        if (isset($data['choices'][0]['delta']['content'])) {
                            $contentChunk = $data['choices'][0]['delta']['content'];
                            if (!empty($contentChunk)) {
                                $contentBuffer .= $contentChunk;
                                echo $contentChunk;
                                if (ob_get_level() > 0) {
                                    ob_flush();
                                }
                                flush();
                            }
                        }
                    }
                }
            }

            if (!empty($contentBuffer)) {
                Log::info('Final assistant response buffer: ' . $contentBuffer);
                try {
                    Message::create([
                        'chat_id' => $chatId,
                        'content' => $contentBuffer,
                        'role' => 'assistant',
                        'date' => now()->toDateString(),
                    ]);
                    Log::info('Assistant response saved successfully');
                } catch (\Throwable $th) {
                    Log::error('Failed to save final response', ['error' => $th->getMessage()]);
                }
            }

        } catch (\Exception $e) {
            Log::error('Stream error: ' . $e->getMessage());
            echo "An error occurred while processing your request.";
        }
    }
}
