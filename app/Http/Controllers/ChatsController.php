<?php

namespace App\Http\Controllers;
use App\Models\Chat;
use App\Models\Message;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;

class ChatsController extends Controller
{
    public function index()
    {
        $chats = Chat::all();
        return response()->json($chats);
    }

    public function show($chatId)
    {
        $chat = Chat::findOrFail($chatId);
        $messages = Message::where('chat_id', $chatId)->get();
        return Inertia::render('Chat', ['chatId' => $chatId, 'chat' => $chat, 'messages' => $messages]);
    }
    
    public function store()
    {
        
        $chat = Chat::create([
            'id' => Str::uuid(),
            'title' => now()->format('m/d').' - New Chat' ,
            'user_id' => Auth::id(),
            'visibility' => 'private',
        ]);
        
        return redirect()->route('chat', ['chatId' => $chat->id]);
    }
}



