<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\interactWithModel;
use App\Http\Controllers\InteractionController;
use App\Http\Controllers\ChatsController;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('/chat/{chatId}', [ChatsController::class, 'show'])->name('chat');
    Route::post('/chats', [ChatsController::class, 'store'])->name('chats.store');
});




Route::fallback(function () {
    return Inertia::render('404');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
