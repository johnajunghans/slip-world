<?php

namespace App\Http\Controllers;

use App\Models\Slip;
use App\Models\Topic;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ItemOrderController extends Controller
{
    /**
     * Recalculate and update orders for all items in the main category
     */
    public function recalculateMainCategoryOrder(Request $request)
    {
        $user = Auth::user();
        $mainCategory = $user->categories()->where('name', 'MAIN')->first();
        
        if (!$mainCategory) {
            return response()->json(['error' => 'Main category not found'], 404);
        }

        DB::transaction(function () use ($user, $mainCategory) {
            // Get all slips and topics in main category, sorted by current order
            $slips = $user->slips()
                ->where('category_id', $mainCategory->id)
                ->orderBy('order')
                ->get();
            
            $topics = $user->topics()
                ->orderBy('order')
                ->get();

            // Combine and sort by current order
            $allItems = collect();
            
            foreach ($slips as $slip) {
                $allItems->push([
                    'type' => 'slip',
                    'id' => $slip->id,
                    'order' => $slip->order,
                    'model' => $slip
                ]);
            }
            
            foreach ($topics as $topic) {
                $allItems->push([
                    'type' => 'topic',
                    'id' => $topic->id,
                    'order' => $topic->order,
                    'model' => $topic
                ]);
            }

            // Sort by current order
            $sortedItems = $allItems->sortBy('order')->values();

            // Reassign sequential orders (0-based)
            foreach ($sortedItems as $index => $item) {
                $item['model']->update(['order' => $index]);
            }
        });

        return response()->json(['message' => 'Orders recalculated successfully']);
    }

    /**
     * Insert item at specific position and recalculate all orders
     */
    public function insertAtPosition(Request $request)
    {
        $request->validate([
            'type' => 'required|in:slip,topic',
            'id' => 'required|integer',
            'position' => 'required|integer|min:0',
        ]);

        $user = Auth::user();
        $mainCategory = $user->categories()->where('name', 'MAIN')->first();

        if (!$mainCategory) {
            return response()->json(['error' => 'Main category not found'], 404);
        }

        DB::transaction(function () use ($request, $user, $mainCategory) {
            // Get the item to move
            if ($request->type === 'slip') {
                $item = $user->slips()->findOrFail($request->id);
                // For slips moving to main category, update category_id
                $item->update(['category_id' => $mainCategory->id]);
            } else {
                $item = $user->topics()->findOrFail($request->id);
            }

            // Temporarily set a very high order to avoid conflicts
            $item->update(['order' => 99999]);

            // Get all other items in correct order
            $allItems = $this->getAllMainCategoryItems($user, $mainCategory->id, $item->id, $request->type);

            // Insert item at specified position
            $allItems->splice($request->position, 0, [[
                'type' => $request->type,
                'model' => $item
            ]]);

            // Update all orders sequentially
            foreach ($allItems as $index => $itemData) {
                $itemData['model']->update(['order' => $index]);
            }
        });

        return response()->json(['message' => 'Item positioned successfully']);
    }

    private function getAllMainCategoryItems($user, $mainCategoryId, $excludeId = null, $excludeType = null)
    {
        $items = collect();

        // Get slips (excluding the one being moved if it's a slip)
        $slipsQuery = $user->slips()->where('category_id', $mainCategoryId);
        if ($excludeType === 'slip' && $excludeId) {
            $slipsQuery->where('id', '!=', $excludeId);
        }
        $slips = $slipsQuery->orderBy('order')->get();

        // Get topics (excluding the one being moved if it's a topic)
        $topicsQuery = $user->topics();
        if ($excludeType === 'topic' && $excludeId) {
            $topicsQuery->where('id', '!=', $excludeId);
        }
        $topics = $topicsQuery->orderBy('order')->get();

        // Combine items
        foreach ($slips as $slip) {
            $items->push(['type' => 'slip', 'order' => $slip->order, 'model' => $slip]);
        }

        foreach ($topics as $topic) {
            $items->push(['type' => 'topic', 'order' => $topic->order, 'model' => $topic]);
        }

        return $items->sortBy('order')->values();
    }
} 