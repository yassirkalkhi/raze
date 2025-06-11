<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\interactWithModel;
use App\Http\Controllers\InteractionController;
use App\Http\Controllers\ChatsController;
use App\Http\Controllers\Settings\PasswordController;
use App\Http\Controllers\Settings\ProfileController;
use App\Http\Controllers\MessageController;
use App\Http\Controllers\RagUploadController;
use App\Http\Controllers\DocumentAccessController;
use Illuminate\Support\Facades\Storage;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('/chat/{chatId}', [ChatsController::class, 'show'])->name('chat');
    Route::post('/chats', [ChatsController::class, 'store'])->name('chats.store');

    Route::get('/messages/{chat}', [MessageController::class, 'index'])->name('messages.index');
    Route::post('/messages', [MessageController::class, 'store'])->name('messages.store');

    Route::get('/rag-upload', [RagUploadController::class, 'create'])->name('rag.create');
    Route::post('/rag-upload', [RagUploadController::class, 'store'])->name('rag.store');
    Route::delete('/rag-upload', [RagUploadController::class, 'destroy'])->name('rag.destroy');

    Route::get('/documents/{document:uuid}', [DocumentAccessController::class, 'show'])->name('documents.view');

    Route::prefix('settings')->as('settings.')->group(function () {
        Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    });
});

Route::fallback(function () {
    return Inertia::render('404');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
