<?php

namespace App\Http\Controllers;

use App\Models\Message;
use App\Models\Chat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MessageController extends Controller
{
    public function index()
    {
        $messages = Message::all()->sortByDesc('created_at');
        return response()->json($messages);
    }

   
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'chat_id' => 'required', 
            'content' => 'required|string',
            'role' => 'required|string|max:255',
            'date' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $message = Message::create([
            'chat_id' => $request->chat_id,
            'content' => $request->content,
            'role' => $request->role,
            'date' => $request->date,
        ]);
        $words = explode(' ', $request->content);
        $title = implode(' ', array_slice($words, 0, 3));
        $chat = Chat::find($request->chat_id)->update(['title' => $title]);
        Log::info('Chat updated: ' . $chat->id);
        return response()->json($message, 201);
    }

    public function show(Message $message)
    {
        return response()->json($message);
    }

    public function edit(Message $message)
    {
        return response()->json(['message' => 'Form for editing message ID: ' . $message->id]);
    }

    public function update(Request $request, Message $message)
    {
        $validator = Validator::make($request->all(), [
            'chat_id' => 'sometimes|required|exists:chats,id',
            'content' => 'sometimes|required|string',
            'role' => 'sometimes|required|string|max:255',
            'date' => 'sometimes|required|date',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $message->update($request->only(['chat_id', 'content', 'role', 'date']));

        return response()->json($message);
    }

    public function destroy(Message $message)
    {
        $message->delete();
        return response()->json(null, 204);
    }
}