<?php

namespace App\Jobs;

use App\Models\Document;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ProcessRagDocument implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

 
    public $tries = 3;


    public $backoff = 60;

    public $document;

   
    public function __construct(Document $document)
    {
        $this->document = $document;
    }

    
    public function handle(): void
    {
        try {
            $fileContents = Storage::get($this->document->path);
            if (!$fileContents) {
                throw new \Exception("File not found at path: {$this->document->path}");
            }
           
            $response = Http::asMultipart()
                ->timeout(30000) 
                ->attach(
                    'file', 
                    $fileContents,
                    $this->document->name
                )
                ->post('http://localhost:5002/file/store', [
                    'uid' => (string) $this->document->user_id,
                    'source' => $this->document->name,
                ]);

            if ($response->successful()) {
                $this->document->status = 'completed';
                $this->document->save();
                Log::info("Document processed successfully: {$this->document->id}");
            } else {
                throw new \Exception("Failed to process document {$this->document->id}: " . $response->body());
            }
        } catch (\Exception $e) {
            $this->document->status = 'failed';
            $this->document->save();
            Log::error("Exception while processing document {$this->document->id}: " . $e->getMessage());
            $this->fail($e);
        }
    }
}
