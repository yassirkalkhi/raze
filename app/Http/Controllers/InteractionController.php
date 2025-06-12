<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\Chat; 
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http; 
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\StreamedResponse;  
use Illuminate\Support\Facades\Auth;


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
        $this->pythonServiceBaseUrlQuery = rtrim(config('services.python_service.query'), '/');
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
            $userMessage =  Message::create([
                'chat_id' => $messageRequest->input('chatId'),
                'content' => $messageRequest->input('prompt'),
                'role'    => $messageRequest->input('role', 'user'),
                'date'    => $messageRequest->input('date', now()->toDateString()),
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to save user message: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to save your message.'], 500);
        }

        $chatId = $userMessage->chat_id;
        $recentMessages = Message::where('chat_id', $chatId)
                                 ->where('id', '<', $userMessage->id) 
                                 ->orderBy('created_at', 'desc')
                                 ->orderBy('id', 'desc') 
                                 ->take(5) 
                                 ->get()
                                 ->reverse(); 

        $historicalContext = [];
        $lastRole = null;
        foreach ($recentMessages as $msg) {
            if ($msg->role === 'user') {
                if ($lastRole === 'user') continue; 
                $historicalContext[] = ['role' => 'user', 'content' => $msg->content];
            } elseif ($msg->role === 'assistant') {
                $historicalContext[] = ['role' => 'assistant', 'content' => $msg->content];
            } 
            $lastRole = $msg->role;
        }
        $uid = $id = Auth::id();
        $chromaResponse = Http::timeout(3000)
        ->withHeaders([
            'Content-Type' => 'application/json',
        ])
        ->post('http://localhost:5002/query', [
            'query' => $userMessage->content,
             'uid' => strval($uid),
        ]);
        Log::info("chroma response " ,$chromaResponse->json());

        $contextFromDocuments = '';
        $documentSources = [];

        if ($chromaResponse->successful()) {
            $chromaData = $chromaResponse->json();
            
            if (isset($chromaData['results']['documents']) && !empty($chromaData['results']['documents'])) {
                $documentTexts = [];
                $sources = [];
                $documents = $chromaData['results']['documents'][0] ?? [];
                $metadatas = $chromaData['results']['metadatas'][0] ?? [];
                $distances = $chromaData['results']['distances'][0] ?? [];
                
                foreach ($documents as $index => $content) {
                    if (empty($content)) continue;
                    
                    $metadata = isset($metadatas[$index]) ? $metadatas[$index] : [];
                    
                    $source = isset($metadata['source']) ? $metadata['source'] : "Document " . ($index + 1);
                    $page = isset($metadata['page']) ? $metadata['page'] : null;
                    $chunk = isset($metadata['chunk']) ? $metadata['chunk'] : null;
                    
                    $distance = isset($distances[$index]) ? $distances[$index] : null;
                    $similarity = $distance !== null ? max(0, (2 - $distance) / 2) : null;
                    
                    if ($distance !== null && $distance > 1.5) {
                        Log::info("Skipping document with low similarity - distance: {$distance}");
                        continue;
                    }
                    
                    $cleanContent = trim($content);
                    
                    $sourceRef = basename($source);
                    if ($page) {
                        $sourceRef .= " (Page {$page}";
                        if ($chunk) {
                            $sourceRef .= ", Chunk {$chunk}";
                        }
                        $sourceRef .= ")";
                    }
                    $sources[] = $sourceRef;
                    
                    $documentEntry = "**Source: {$sourceRef}**";
                    if ($similarity !== null) {
                        $documentEntry .= " (Similarity: " . number_format($similarity * 100, 1) . "%)";
                    }
                    $documentEntry .= "\n{$cleanContent}";
                    
                    $documentTexts[] = $documentEntry;
                    
                    Log::info("Added document from source: {$sourceRef}, similarity: " . ($similarity ? number_format($similarity * 100, 1) . "%" : 'N/A'));
                }
                
                if (!empty($documentTexts)) {
                    $contextFromDocuments = "=== RELEVANT KNOWLEDGE BASE ===\n\n" . 
                                        implode("\n\n---\n\n", $documentTexts) . 
                                        "\n\n=== END KNOWLEDGE BASE ===\n\n";
                    
                    $documentSources = array_unique($sources);
                    
                    Log::info('Retrieved ' . count($documentTexts) . ' relevant documents from ChromaDB');
                    Log::info('Document sources: ' . implode(', ', $documentSources));
                }
            } else {
                Log::info('No relevant documents found in ChromaDB response');
            }
        } else {
            Log::warning('ChromaDB request failed', [
                'status' => $chromaResponse->status(),
                'response' => $chromaResponse->body()
            ]);
        }

        $systemMessage = 'You are a helpful assistant. Maintain a conversational flow based on recent interactions. ';

        if (!empty($contextFromDocuments)) {
            $systemMessage .= "\n\n" . $contextFromDocuments;
            $systemMessage .= "INSTRUCTIONS:\n";
            $systemMessage .= "- Use the above knowledge base information when relevant to answer user questions\n";
            $systemMessage .= "- When referencing information from the knowledge base, its very importat !!!! to cite the source (name and page only) in the end of your response\n";
            $systemMessage .= "- If multiple sources contain relevant information, mention all applicable sources\n";
            $systemMessage .= "- If the knowledge base doesn't contain relevant information, rely on your general knowledge\n";
            $systemMessage .= "- Be natural in your citations, e.g., 'According to [Source Name]...' or 'As mentioned in [Source Name]...'\n\n";
            
            if (!empty($documentSources)) {
                $systemMessage .= "Available sources: " . implode(', ', $documentSources) . "\n\n";
            }
        }

        $messagesForAI = array_merge(
            [['role' => 'system', 'content' => $systemMessage]],
            $historicalContext,
            [['role' => 'user', 'content' => $userMessage->content]]
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
            'stream' => true,
        ]);

        if ($response->failed()) {
            Log::error('Groq API request failed', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);
            echo "Sorry i can't proccess your request right now , please try again !";
            return;
        }
        $body = $response->getBody();
        $contentBuffer = '';
        $lineBuffer = '';
        if (ob_get_level() == 0) {
            ob_start();
        }
        
        while (!$body->eof()) {
            $chunk = $body->read(256);
            
            if (empty($chunk)) {
                continue;
            }
            $lineBuffer .= $chunk;
            
            while (($pos = strpos($lineBuffer, "\n")) !== false) {
                $line = substr($lineBuffer, 0, $pos);
                $lineBuffer = substr($lineBuffer, $pos + 1);
                if (empty(trim($line))) {
                    continue;
                }
                if (str_starts_with($line, 'data: ')) {
                    $jsonData = trim(substr($line, 6));
                    if ($jsonData === '[DONE]') {
                        break 2;
                    }
                    
                    if (empty($jsonData)) {
                        continue;
                    }
                    $data = json_decode($jsonData, true);
                    if (json_last_error() !== JSON_ERROR_NONE) {
                        Log::warning('JSON decode error: ' . json_last_error_msg() . ' for data: ' . $jsonData);
                        continue;
                    }
                    // Extract content
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
           if (!empty($lineBuffer)) {
            $lines = explode("\n", $lineBuffer);
            foreach ($lines as $line) {
                if (str_starts_with($line, 'data: ')) {
                    $jsonData = trim(substr($line, 6));
                    
                    if ($jsonData === '[DONE]') {
                        break;
                    }
                    
                    if (!empty($jsonData)) {
                        $data = json_decode($jsonData, true);
                        if (json_last_error() === JSON_ERROR_NONE && isset($data['choices'][0]['delta']['content'])) {
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
        }

        if (!empty($contentBuffer)) {
            Log::info('Final assistant response buffer length: ' . strlen($contentBuffer));
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
            echo "Sorry i can't proccess your request right now , please try again !";
        }
    }
}
