<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

 
    protected $fillable = [
        'name',
        'email',
        'password',
        'avatar',
    ];

   
    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function chats()
    {
        return $this->hasMany(Chat::class);
    }

  
    public function documents()
    {
        return $this->hasMany(Document::class);
    }
}
