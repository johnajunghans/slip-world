<?php

namespace App\Listeners;

use App\Models\Category;
use Illuminate\Auth\Events\Registered;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class CreateDefaultCategories
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(Registered $event): void
    {
        $user = $event->user;

        // Check if categories already exist for this user to prevent duplicates
        if ($user->categories()->count() > 0) {
            return;
        }

        $defaultCategories = [
            [
                'name' => 'MAIN',
                'description' => 'Primary sequence of slips.',
            ],
            [
                'name' => 'UNASSIMILATED',
                'description' => 'Contains new ideas that interrupts what one does',
            ],
            [
                'name' => 'PROGRAM',
                'description' => 'Instructions for what to do with the rest of the slips',
            ],
            [
                'name' => 'CRIT',
                'description' => 'For days when a foul mood strikes and everything in the current system seems bad',
            ],
            [
                'name' => 'TOUGH',
                'description' => 'Contains slips that seem to say something of importance but don\'t fit into any current topic',
            ],
            [
                'name' => 'JUNK',
                'description' => 'For slips that seemed high value at one point but now seem awful',
            ],
        ];

        foreach ($defaultCategories as $categoryData) {
            Category::create([
                'user_id' => $user->id,
                'name' => $categoryData['name'],
                'description' => $categoryData['description'],
            ]);
        }
    }
} 