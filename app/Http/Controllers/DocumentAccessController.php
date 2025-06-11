<?php

namespace App\Http\Controllers;

use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class DocumentAccessController extends Controller
{
    /**
     * Display the specified resource.
     *
     * @param \Illuminate\Http\Request $request
     * @param string $uuid
     * @return \Symfony\Component\HttpFoundation\StreamedResponse|\Illuminate\Http\Response
     */
    public function show(Request $request, string $uuid)
    {
        $document = Document::findOrFail($uuid);

        $apiKey = $request->header('X-API-Key');
        $secretKey = config('services.document_access.secret');

        if (!$secretKey || $apiKey !== $secretKey) {
            abort(403, 'Unauthorized');
        }

        return Storage::response($document->path);
    }
}
