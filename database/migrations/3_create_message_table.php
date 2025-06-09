<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('messages',function (Blueprint $table){
            $table->id();
            $table->uuid('chat_id');
            $table->foreign('chat_id')->references('id')->on('chats')->onDelete('cascade');
            $table->longText('content');
            $table->string('role');
            $table->date('date');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('messages');
    }
};
