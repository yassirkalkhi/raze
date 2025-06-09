<?php

namespace App\Models;
use App\Models\Message;

use Illuminate\Database\Eloquent\Model;

class Chat extends Model
{
    protected $keyType = 'string';
    public $incrementing = false;


    protected $fillable = ['id', 'user_id', 'title', 'date_created', 'last_modified','visibility'];


    public function messages()
    {
        return $this->hasMany(Message::class);
    }
    
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
