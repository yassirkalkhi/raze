<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Message extends Model
{
    use HasFactory;

    protected $fillable = [
        'chat_id',
        'content',
        'role',
        'date',
    ];

    public function chat(): BelongsTo
    {
        return $this->belongsTo(Chat::class);
    }
    
  
}
