<?php

use App\Http\Controllers\SlipController;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        $user = Auth::user();
        $slips = $user->slips()
            ->with('category')
            ->orderBy('order')
            ->get();
        $categories = $user->categories()
            ->orderBy('name')
            ->get();
            
        return Inertia::render('dashboard', [
            'slips' => $slips,
            'categories' => $categories
        ]);
    })->name('dashboard');

    // Slip routes
    Route::resource('slips', SlipController::class);
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
