<?php

namespace App\Http\Controllers;

use App\Models\Document;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use App\Jobs\ProcessRagDocument;

class RagUploadController extends Controller
{
    private function getUserRagPath($type = '')
    {
        $basePath = 'rag_files/' . Auth::id();
        return $type ? "{$basePath}/{$type}" : $basePath;
    }

  
    public function create()
    {
        $user = Auth::user();
        $documents = $user->documents()->orderBy('created_at', 'desc')->get();
        
        $totalStorage = $documents->sum('size');

        return Inertia::render('RagUpload', [
            'documents' => $documents->map(function ($doc) {
                return [
                    'id' => $doc->id,
                    'name' => $doc->name,
                    'path' => $doc->path,
                    'size' => $doc->size,
                    'last_modified' => $doc->created_at->timestamp,
                    'type' => $doc->type,
                    'status' => $doc->status,
                ];
            }),
            'stats' => [
                'total_documents' => $documents->count(),
                'total_storage' => $totalStorage,
            ]
        ]);
    }

   
    public function store(Request $request)
    {
        $request->validate([
            'file' => 'required|file|mimes:txt,pdf,docx,png,jpg,jpeg|max:10240',
        ]);
        
        $file = $request->file('file');
        $user = Auth::user();
        $type = $file->getClientOriginalExtension();
        
        $path = $file->store($this->getUserRagPath($type));

        $document = Document::create([
            'user_id' => $user->id,
            'name' => $file->getClientOriginalName(),
            'path' => $path,
            'type' => $type,
            'size' => $file->getSize(),
            'status' => 'processing',
        ]);

        ProcessRagDocument::dispatch($document);

        return redirect()->route('rag.create')->with('success', 'File is being processed.');
    }

    public function destroy(Request $request)
    {
        $request->validate([
            'path' => 'required|string',
        ]);

        $path = $request->input('path');
        $user = Auth::user();

        $document = $user->documents()->where('path', $path)->firstOrFail();

       
        if (strpos($document->path, 'rag_files/' . $user->id) !== 0) {
            Log::warning('Attempted to delete a file outside the authorized directory.', [
                'user_id' => $user->id,
                'path' => $path,
            ]);
            return redirect()->back()->with('error', 'Unauthorized action.');
        }

        if (Storage::exists($document->path)) {
            Storage::delete($document->path);
        }

        $document->delete();

        return redirect()->route('rag.create')->with('success', 'File deleted successfully.');
    }
} 