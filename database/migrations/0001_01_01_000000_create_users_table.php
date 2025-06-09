<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;


  
return new class extends Migration
{
    /**
     * Run the migrations.
     */

    private $gradientOptions  = [
        "from-purple-300 to-purple-500",
        "from-pink-300 to-pink-500",
        "from-yellow-300 to-yellow-500",
        "from-green-300 to-green-500",
        "from-blue-300 to-blue-500",
        "from-indigo-300 to-indigo-500",
        "from-orange-300 to-orange-500",
        "from-teal-300 to-teal-500",
        "from-cyan-300 to-cyan-500",
      ];
    public function up(): void
    {

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('avatar')->default($this->gradientOptions[rand(0, count($this->gradientOptions) - 1)]);
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->rememberToken();
            $table->timestamps();
        });

        Schema::create('password_reset_tokens', function (Blueprint $table) {
            $table->string('email')->primary();
            $table->string('token');
            $table->timestamp('created_at')->nullable();
        });

        Schema::create('sessions', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->foreignId('user_id')->nullable()->index();
            $table->string('ip_address', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->longText('payload');
            $table->integer('last_activity')->index();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
