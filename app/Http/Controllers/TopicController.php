<?php

namespace App\Http\Controllers;

use App\Models\Topic;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class TopicController extends Controller
{
    use AuthorizesRequests;

    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $topics = Auth::user()->topics()
            ->orderBy('order')
            ->get();

        return response()->json($topics);
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
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:500',
            'order' => 'nullable|integer|min:0',
        ]);

        DB::transaction(function () use ($request, $user) {
            $insertOrder = $request->order;
            
            if ($insertOrder) {
                // Insert at specific position - increment order of existing topics
                $user->topics()
                    ->where('order', '>=', $insertOrder)
                    ->increment('order');
            } else {
                // Append to end - get the next order number
                $insertOrder = $user->topics()->max('order') + 1;
            }

            $user->topics()->create([
                'name' => $request->name,
                'description' => $request->description,
                'order' => $insertOrder,
            ]);
        });

        return redirect()->back()->with('success', 'Topic created successfully!');
    }

    /**
     * Display the specified resource.
     */
    public function show(Topic $topic)
    {
        $this->authorize('view', $topic);
        
        return response()->json($topic);
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
    public function update(Request $request, Topic $topic)
    {
        $this->authorize('update', $topic);

        $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string|max:500',
            'order' => 'nullable|integer|min:0',
        ]);

        $topic->update($request->only(['name', 'description', 'order']));

        // Return appropriate response based on request type
        if ($request->wantsJson()) {
            return response()->json($topic);
        }

        return redirect()->back()->with('success', 'Topic updated successfully!');
    }

    /**
     * Reorder topics in bulk.
     */
    public function reorder(Request $request)
    {
        $user = Auth::user();
        
        $request->validate([
            'topics' => 'required|array',
            'topics.*.id' => 'required|integer|exists:topics,id',
            'topics.*.order' => 'required|integer|min:0',
        ]);

        DB::transaction(function () use ($request, $user) {
            foreach ($request->topics as $topicData) {
                $topic = $user->topics()->findOrFail($topicData['id']);
                $topic->update(['order' => $topicData['order']]);
            }
        });

        // Return appropriate response based on request type
        if ($request->wantsJson()) {
            return response()->json(['message' => 'Topics reordered successfully']);
        }

        return redirect()->back()->with('success', 'Topics reordered successfully!');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Topic $topic)
    {
        $this->authorize('delete', $topic);
        
        DB::transaction(function () use ($topic) {
            // Delete the topic
            $topic->delete();
            
            // Topics are always in main category, so recalculate all orders using unified system
            app(\App\Http\Controllers\ItemOrderController::class)->recalculateMainCategoryOrder(request());
        });

        // Return appropriate response based on request type
        if (request()->wantsJson()) {
            return response()->json(null, 204);
        }

        return redirect()->back()->with('success', 'Topic deleted successfully!');
    }
}
