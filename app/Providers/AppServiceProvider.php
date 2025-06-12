<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Inertia\Inertia;
use App\Models\Chat;
use Illuminate\Support\Facades\Auth;

class AppServiceProvider extends ServiceProvider
{
   
    public function register(): void
    {
        //
    }

  
    public function boot(): void
    {
        Inertia::share([
            'auth' => function () {
                return [
                    'user' => Auth::user() ? [
                        'id' => Auth::user()->id,
                        'name' => Auth::user()->name,
                        'email' => Auth::user()->email,
                    ] : null,
                ];
            },
            'chats' => function () {
                if (Auth::check()) {
                    return Chat::where('user_id', Auth::id())
                        ->orderBy('updated_at', 'desc')
                        ->get();
                }
                return [];
            },
        ]);
    }
}
