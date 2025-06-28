<?php

use App\Models\User;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

test('new users get default categories when registering through web', function () {
    $response = $this->post('/register', [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));

    // Get the created user
    $user = User::where('email', 'test@example.com')->first();
    
    // Assert that 5 categories were created
    expect($user->categories()->count())->toBe(5);

    // Assert that all expected categories exist with correct names
    $expectedCategories = ['UNASSIMILATED', 'PROGRAM', 'CRIT', 'TOUGH', 'JUNK'];
    $createdCategoryNames = $user->categories()->pluck('name')->toArray();

    foreach ($expectedCategories as $expectedCategory) {
        expect($createdCategoryNames)->toContain($expectedCategory);
    }
}); 