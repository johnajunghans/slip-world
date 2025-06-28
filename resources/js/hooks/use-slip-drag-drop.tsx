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

        const newSlips = [...slipsToReorder];
        const [removed] = newSlips.splice(startIndex, 1);
        newSlips.splice(endIndex, 0, removed);

        const updatedSlips = newSlips.map((slip, index) => ({
            ...slip,
            order: index + 1,
        }));

        const allSlipsUpdated = slips.map(slip => {
            if (categoryId && slip.category_id !== categoryId) {
                return slip;
            }
            const updatedSlip = updatedSlips.find(updated => updated.id === slip.id);
            return updatedSlip || slip;
        });

        onReorder?.(allSlipsUpdated);

        bulkReorderSlips(updatedSlips);

        return allSlipsUpdated;
    }, [slips, onReorder, bulkReorderSlips, categoryId]);

    return {
        reorderSlips,
        updateSlipOrder,
        bulkReorderSlips,
    };
} 