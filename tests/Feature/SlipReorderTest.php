<?php

use App\Models\Category;
use App\Models\Slip;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('authenticated user can reorder their slips', function () {
    $user = User::factory()->create();
    $category = Category::factory()->create(['user_id' => $user->id]);

    // Create slips with specific order
    $slip1 = Slip::factory()->create([
        'user_id' => $user->id,
        'category_id' => $category->id,
        'content' => 'First slip',
        'order' => 1,
    ]);
    
    $slip2 = Slip::factory()->create([
        'user_id' => $user->id,
        'category_id' => $category->id,
        'content' => 'Second slip',
        'order' => 2,
    ]);
    
    $slip3 = Slip::factory()->create([
        'user_id' => $user->id,
        'category_id' => $category->id,
        'content' => 'Third slip',
        'order' => 3,
    ]);

    // Reorder slips using bulk reorder endpoint
    $response = $this->actingAs($user)
        ->withHeaders(['Accept' => 'application/json'])
        ->patch('/slips/reorder', [
            'slips' => [
                ['id' => $slip2->id, 'order' => 1],
                ['id' => $slip3->id, 'order' => 2],
                ['id' => $slip1->id, 'order' => 3],
            ],
        ]);

    $response->assertOk();
    $response->assertJson(['message' => 'Slips reordered successfully']);

    // Verify the order was updated in the database
    $slip1->refresh();
    $slip2->refresh();
    $slip3->refresh();

    expect($slip2->order)->toBe(1);
    expect($slip3->order)->toBe(2);
    expect($slip1->order)->toBe(3);
});

test('authenticated user can update individual slip order', function () {
    $user = User::factory()->create();
    $category = Category::factory()->create(['user_id' => $user->id]);

    $slip = Slip::factory()->create([
        'user_id' => $user->id,
        'category_id' => $category->id,
        'content' => 'Test slip',
        'order' => 1,
    ]);

    $response = $this->actingAs($user)
        ->withHeaders(['Accept' => 'application/json'])
        ->patch("/slips/{$slip->id}", [
            'order' => 5,
        ]);

    $response->assertOk();
    $response->assertJsonStructure(['id', 'content', 'order', 'category_id']);
    
    $slip->refresh();
    expect($slip->order)->toBe(5);
});

test('user cannot reorder slips that do not belong to them', function () {
    $user1 = User::factory()->create();
    $user2 = User::factory()->create();
    
    $category1 = Category::factory()->create(['user_id' => $user1->id]);
    $category2 = Category::factory()->create(['user_id' => $user2->id]);

    $slip1 = Slip::factory()->create([
        'user_id' => $user1->id,
        'category_id' => $category1->id,
        'order' => 1,
    ]);
    
    $slip2 = Slip::factory()->create([
        'user_id' => $user2->id,
        'category_id' => $category2->id,
        'order' => 1,
    ]);

    // User1 tries to reorder User2's slip
    $response = $this->actingAs($user1)->patch('/slips/reorder', [
        'slips' => [
            ['id' => $slip2->id, 'order' => 2],
        ],
    ]);

    $response->assertNotFound();
});

test('bulk reorder validates slip IDs exist', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->patch('/slips/reorder', [
        'slips' => [
            ['id' => 999999, 'order' => 1], // Non-existent slip ID
        ],
    ]);

    $response->assertSessionHasErrors(['slips.0.id']);
});

test('bulk reorder validates required fields', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->patch('/slips/reorder', [
        'slips' => [
            ['id' => 1], // Missing order
        ],
    ]);

    $response->assertSessionHasErrors(['slips.0.order']);

    $response = $this->actingAs($user)->patch('/slips/reorder', [
        'slips' => [
            ['order' => 1], // Missing id
        ],
    ]);

    $response->assertSessionHasErrors(['slips.0.id']);
}); 