import { useCallback } from 'react';
import type { Slip } from '@/types';

interface UseSlipDragDropProps {
    slips: Slip[];
    onReorder?: (newSlips: Slip[]) => void;
    categoryId?: number;
}

export function useSlipDragDrop({ slips, onReorder, categoryId }: UseSlipDragDropProps) {
    const updateSlipOrder = useCallback(async (slipId: number, newOrder: number) => {
        try {
            // Use fetch for JSON API calls to avoid Inertia response issues
            const response = await fetch(`/slips/${slipId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    order: newOrder,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Failed to update slip order:', error);
        }
    }, []);

    const bulkReorderSlips = useCallback(async (reorderedSlips: Slip[]) => {
        try {
            // Use fetch for JSON API calls to avoid Inertia response issues
            const response = await fetch('/slips/reorder', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    slips: reorderedSlips.map(slip => ({
                        id: slip.id,
                        order: slip.order,
                    })),
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        } catch (error) {
            console.error('Failed to bulk reorder slips:', error);
        }
    }, []);

    const reorderSlips = useCallback((startIndex: number, endIndex: number) => {
        let slipsToReorder = slips;
        if (categoryId) {
            slipsToReorder = slips.filter(slip => slip.category_id === categoryId);
        }

        // Create a copy and reorder
        const newSlips = [...slipsToReorder];
        const [removed] = newSlips.splice(startIndex, 1);
        newSlips.splice(endIndex, 0, removed);

        // Update orders to be 0-based sequential
        const updatedSlips = newSlips.map((slip, index) => ({
            ...slip,
            order: index, // 0-based ordering to match unified system
        }));

        // Update the full slips array
        const allSlipsUpdated = slips.map(slip => {
            if (categoryId && slip.category_id !== categoryId) {
                return slip; // Keep slips from other categories unchanged
            }
            const updatedSlip = updatedSlips.find(updated => updated.id === slip.id);
            return updatedSlip || slip;
        });

        // Update local state immediately for better UX
        onReorder?.(allSlipsUpdated);

        // Send update to backend
        bulkReorderSlips(updatedSlips);

        return allSlipsUpdated;
    }, [slips, onReorder, bulkReorderSlips, categoryId]);

    return {
        reorderSlips,
        updateSlipOrder,
        bulkReorderSlips,
    };
} 