<?php
use App\Http\Controllers\InteractionController;
use Illuminate\Support\Facades\Route;

Route::post('/interaction', [InteractionController::class, 'handleInteraction'])->name('stream');