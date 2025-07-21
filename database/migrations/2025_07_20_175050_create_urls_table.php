<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('urls', function (Blueprint $table) {
            $table->id();
            $table->text('original_url');
            $table->string('short_code', 10)->unique();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');
            $table->integer('clicks')->default(0);
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            
            $table->index(['short_code']);
            $table->index(['user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('urls');
    }
};
