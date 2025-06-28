<?php

use App\Http\Controllers\SlipController;
use App\Http\Controllers\TopicController;
use App\Http\Controllers\ItemOrderController;
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
        $topics = $user->topics()
            ->orderBy('order')
            ->get();
            
        return Inertia::render('dashboard', [
            'slips' => $slips,
            'categories' => $categories,
            'topics' => $topics
        ]);
    })->name('dashboard');

    // Slip routes
    Route::patch('slips/reorder', [SlipController::class, 'reorder'])->name('slips.reorder');
    Route::resource('slips', SlipController::class);
    
    // Topic routes
    Route::patch('topics/reorder', [TopicController::class, 'reorder'])->name('topics.reorder');
    Route::resource('topics', TopicController::class);

    // Unified order management
    Route::post('api/items/recalculate-order', [ItemOrderController::class, 'recalculateMainCategoryOrder']);
    Route::post('api/items/insert-at-position', [ItemOrderController::class, 'insertAtPosition']);
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
