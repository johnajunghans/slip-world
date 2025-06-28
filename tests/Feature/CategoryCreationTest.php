<?php

use App\Models\User;
use Illuminate\Auth\Events\Registered;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('default categories are created when user registers', function () {
    // Create a user
    $user = User::factory()->create();

    // Fire the Registered event
    event(new Registered($user));

    // Assert that 6 categories were created
    expect($user->categories()->count())->toBe(6);

    // Assert that all expected categories exist
    $expectedCategories = ['MAIN', 'UNASSIMILATED', 'PROGRAM', 'CRIT', 'TOUGH', 'JUNK'];
    $createdCategoryNames = $user->categories()->pluck('name')->toArray();

    foreach ($expectedCategories as $expectedCategory) {
        expect($createdCategoryNames)->toContain($expectedCategory);
    }
});

test('categories have correct descriptions', function () {
    $user = User::factory()->create();
    event(new Registered($user));

    $categories = $user->categories()->get()->keyBy('name');

    expect($categories['MAIN']->description)->toBe('Primary sequence of slips.');
    expect($categories['UNASSIMILATED']->description)->toBe('Contains new ideas that interrupts what one does');
    expect($categories['PROGRAM']->description)->toBe('Instructions for what to do with the rest of the slips');
    expect($categories['CRIT']->description)->toBe('For days when a foul mood strikes and everything in the current system seems bad');
    expect($categories['TOUGH']->description)->toBe('Contains slips that seem to say something of importance but don\'t fit into any current topic');
    expect($categories['JUNK']->description)->toBe('For slips that seemed high value at one point but now seem awful');
});

test('duplicate categories are not created', function () {
    $user = User::factory()->create();

    // Fire the event twice
    event(new Registered($user));
    event(new Registered($user));

    // Should still only have 6 categories
    expect($user->categories()->count())->toBe(6);
});

test('user category and slip relationships work correctly', function () {
    $user = User::factory()->create();
    event(new Registered($user));

    $category = $user->categories()->first();

    // Create a slip
    $slip = $user->slips()->create([
        'content' => 'Test slip content',
        'order' => 1,
        'category_id' => $category->id,
    ]);

    // Test relationships
    expect($slip->user->id)->toBe($user->id);
    expect($slip->category->id)->toBe($category->id);
    expect($category->slips()->count())->toBe(1);
    expect($user->slips()->count())->toBe(1);
}); 