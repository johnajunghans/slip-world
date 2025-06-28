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
        ]);

        // Get the next order number
        $nextOrder = $user->slips()->max('order') + 1;

        $slip = $user->slips()->create([
            'content' => $request->content,
            'category_id' => $request->category_id,
            'order' => $nextOrder,
        ]);

        return redirect()->back()->with('success', 'Slip created successfully!');
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

        $request->validate([
            'content' => 'sometimes|required|string|max:1000',
            'category_id' => 'nullable|exists:categories,id',
            'order' => 'nullable|integer|min:1',
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
            'slips.*.order' => 'required|integer|min:1',
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
        
        $slip->delete();

        return response()->json(null, 204);
    }
}
