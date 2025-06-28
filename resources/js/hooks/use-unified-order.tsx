import { useState, useCallback } from 'react';
import { type Slip, type Topic } from '@/types';

type Item = Slip | Topic;
type ItemType = 'slip' | 'topic';

interface UseUnifiedOrderProps {
    slips: Slip[];
    topics: Topic[];
    mainCategoryId: number;
    onSlipsChange: (slips: Slip[]) => void;
    onTopicsChange: (topics: Topic[]) => void;
}

export function useUnifiedOrder({ 
    slips, 
    topics, 
    mainCategoryId,
    onSlipsChange, 
    onTopicsChange 
}: UseUnifiedOrderProps) {
    
    const [isReordering, setIsReordering] = useState(false);

    // Get combined items sorted by order (only from main category)
    const getCombinedItems = useCallback((): (Item & { type: ItemType })[] => {
        const mainCategorySlips = slips.filter(slip => slip.category_id === mainCategoryId);

        const combinedItems: (Item & { type: ItemType })[] = [
            ...mainCategorySlips.map(slip => ({ ...slip, type: 'slip' as ItemType })),
            ...topics.map(topic => ({ ...topic, type: 'topic' as ItemType }))
        ];

        return combinedItems.sort((a, b) => a.order - b.order);
    }, [slips, topics, mainCategoryId]);

    // Recalculate all orders to be sequential (0, 1, 2, 3...)
    const recalculateOrders = useCallback(async () => {
        setIsReordering(true);
        
        try {
            const response = await fetch('/api/items/recalculate-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to recalculate orders');
            }

            // Refresh data from server
            window.location.reload(); // Or use a more elegant refresh method
            
        } catch (error) {
            console.error('Failed to recalculate orders:', error);
        } finally {
            setIsReordering(false);
        }
    }, []);

    // Move item to specific position
    const moveItemToPosition = useCallback(async (
        item: Item, 
        newPosition: number,
        isMovingToMain = false // New parameter to indicate cross-category move to main
    ) => {
        // Guard: Only handle items that are in main category, topics, or being moved to main
        const itemType = 'content' in item ? 'slip' : 'topic';
        if (itemType === 'slip' && (item as Slip).category_id !== mainCategoryId && !isMovingToMain) {
            return;
        }
        
        setIsReordering(true);
        
        try {
            const response = await fetch('/api/items/insert-at-position', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    type: itemType,
                    id: item.id,
                    position: newPosition,
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to move item');
            }

            // Update local state optimistically
            await updateLocalState(item, newPosition, isMovingToMain);
            
        } catch (error) {
            console.error('Failed to move item:', error);
        } finally {
            setIsReordering(false);
        }
    }, [slips, topics, onSlipsChange, onTopicsChange, mainCategoryId]);

    const updateLocalState = useCallback(async (item: Item, newPosition: number, isMovingToMain = false) => {
        const combinedItems = getCombinedItems();
        const itemType = 'content' in item ? 'slip' : 'topic';
        
        // If moving a slip to main category, update its category_id
        let updatedItem = item;
        if (isMovingToMain && itemType === 'slip') {
            updatedItem = { ...item, category_id: mainCategoryId } as Item;
        }
        
        // Remove item from current position
        const filteredItems = combinedItems.filter(i => 
            !(i.id === item.id && (
                (itemType === 'slip' && 'content' in i) || 
                (itemType === 'topic' && 'name' in i)
            ))
        );
        
        // Insert at new position
        filteredItems.splice(newPosition, 0, { ...updatedItem, type: itemType });
        
        // Update orders to be sequential
        const updatedItems = filteredItems.map((item, index) => ({
            ...item,
            order: index
        }));
        
        // Separate slips and topics for state updates
        const updatedSlips = updatedItems
            .filter(item => item.type === 'slip')
            .map(item => ({ ...item, type: undefined })) as Slip[];
            
        const updatedTopics = updatedItems
            .filter(item => item.type === 'topic')
            .map(item => ({ ...item, type: undefined })) as Topic[];
        
        // Update state - preserve non-main category slips, but remove the moved slip if it was moved to main
        const otherSlips = slips.filter(slip => 
            slip.category_id !== mainCategoryId && 
            !(isMovingToMain && slip.id === item.id)
        );
        
        onSlipsChange([
            ...otherSlips,
            ...updatedSlips
        ]);
        onTopicsChange(updatedTopics);
    }, [slips, topics, onSlipsChange, onTopicsChange, getCombinedItems, mainCategoryId]);

    return {
        combinedItems: getCombinedItems(),
        isReordering,
        recalculateOrders,
        moveItemToPosition,
    };
} 