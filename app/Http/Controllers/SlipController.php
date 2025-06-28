<?php

namespace App\Http\Controllers;

use App\Models\Slip;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class SlipController extends Controller
{
    use AuthorizesRequests;
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $slips = Auth::user()->slips()
            ->with('category')
            ->orderBy('order')
            ->get();

        return response()->json($slips);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request): RedirectResponse
    {
        $user = Auth::user();
        
        $request->validate([
            'content' => 'required|string|max:1000',
            'category_id' => [
                'required',
                'exists:categories,id',
                function ($attribute, $value, $fail) use ($user) {
                    if (!$user->categories()->where('id', $value)->exists()) {
                        $fail('The selected category does not belong to you.');
                    }
                },
            ],
            'order' => 'nullable|integer|min:0',
        ]);

        DB::transaction(function () use ($request, $user) {
            $category = $user->categories()->findOrFail($request->category_id);
            
            if ($category->name === 'MAIN') {
                // For main category, use unified order management
                $this->insertInMainCategory($user, $request);
            } else {
                // For other categories, use existing logic
                $this->insertInOtherCategory($user, $request);
            }
        });

        return redirect()->back()->with('success', 'Slip created successfully!');
    }

    private function insertInMainCategory($user, $request)
    {
        $insertPosition = $request->order ?? $this->getNextMainCategoryPosition($user);
        
        // Create the slip with temporary high order
        $slip = $user->slips()->create([
            'content' => $request->content,
            'category_id' => $request->category_id,
            'order' => 99999,
        ]);

        // Use the unified order management to place it correctly
        app(ItemOrderController::class)->insertAtPosition(new \Illuminate\Http\Request([
            'type' => 'slip',
            'id' => $slip->id,
            'position' => $insertPosition,
        ]));
    }

    private function getNextMainCategoryPosition($user)
    {
        $mainCategory = $user->categories()->where('name', 'MAIN')->first();
        $maxSlipOrder = $user->slips()->where('category_id', $mainCategory->id)->max('order') ?? -1;
        $maxTopicOrder = $user->topics()->max('order') ?? -1;
        
        return max($maxSlipOrder, $maxTopicOrder) + 1;
    }

    private function insertInOtherCategory($user, $request)
    {
        // Existing logic for non-main categories
        $insertOrder = $request->order;
        
        if ($insertOrder !== null) {
            $user->slips()
                ->where('category_id', $request->category_id)
                ->where('order', '>=', $insertOrder)
                ->increment('order');
        } else {
            $insertOrder = $user->slips()
                ->where('category_id', $request->category_id)
                ->max('order') + 1;
        }

        $user->slips()->create([
            'content' => $request->content,
            'category_id' => $request->category_id,
            'order' => $insertOrder,
        ]);
    }

    /**
     * Display the specified resource.
     */
    public function show(Slip $slip)
    {
        $this->authorize('view', $slip);
        
        $slip->load('category');
        
        return response()->json($slip);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Slip $slip)
    {
        $this->authorize('update', $slip);

        $user = Auth::user();

        $request->validate([
            'content' => 'sometimes|required|string|max:1000',
            'category_id' => [
                'nullable',
                'exists:categories,id',
                function ($attribute, $value, $fail) use ($user) {
                    if ($value && !$user->categories()->where('id', $value)->exists()) {
                        $fail('The selected category does not belong to you.');
                    }
                },
            ],
            'order' => 'nullable|integer|min:0',
        ]);

        $slip->update($request->only(['content', 'category_id', 'order']));
        $slip->load('category');

        // Return appropriate response based on request type
        if ($request->wantsJson()) {
            return response()->json($slip);
        }

        return redirect()->back()->with('success', 'Slip updated successfully!');
    }

    /**
     * Reorder slips in bulk.
     */
    public function reorder(Request $request)
    {
        $user = Auth::user();
        
        $request->validate([
            'slips' => 'required|array',
            'slips.*.id' => 'required|integer|exists:slips,id',
            'slips.*.order' => 'required|integer|min:0',
        ]);

        DB::transaction(function () use ($request, $user) {
            foreach ($request->slips as $slipData) {
                $slip = $user->slips()->findOrFail($slipData['id']);
                $slip->update(['order' => $slipData['order']]);
            }
        });

        // Return appropriate response based on request type
        if ($request->wantsJson()) {
            return response()->json(['message' => 'Slips reordered successfully']);
        }

        return redirect()->back()->with('success', 'Slips reordered successfully!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Slip $slip)
    {
        $this->authorize('delete', $slip);
        
        $user = Auth::user();
        $mainCategory = $user->categories()->where('name', 'MAIN')->first();
        
        DB::transaction(function () use ($slip, $user, $mainCategory) {
            $slipOrder = $slip->order;
            $categoryId = $slip->category_id;
            
            // Delete the slip
            $slip->delete();
            
            if ($mainCategory && $categoryId === $mainCategory->id) {
                // For main category, recalculate all orders using unified system
                app(ItemOrderController::class)->recalculateMainCategoryOrder(request());
            } else {
                // For other categories, decrement order of subsequent slips
                $user->slips()
                    ->where('category_id', $categoryId)
                    ->where('order', '>', $slipOrder)
                    ->decrement('order');
            }
        });

        // Return appropriate response based on request type
        if (request()->wantsJson()) {
            return response()->json(null, 204);
        }

        return redirect()->back()->with('success', 'Slip deleted successfully!');
    }
}
