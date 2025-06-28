import { useCallback } from 'react';
import type { Slip } from '@/types';

interface UseSlipDragDropProps {
    slips: Slip[];
    onReorder?: (newSlips: Slip[]) => void;
}

export function useSlipDragDrop({ slips, onReorder }: UseSlipDragDropProps) {
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
        const newSlips = [...slips];
        const [removed] = newSlips.splice(startIndex, 1);
        newSlips.splice(endIndex, 0, removed);

        // Update the order values for all affected slips
        const updatedSlips = newSlips.map((slip, index) => ({
            ...slip,
            order: index + 1,
        }));

        // Call the optional callback for optimistic updates
        onReorder?.(updatedSlips);

        // Always use bulk reorder to ensure all affected slips get proper order numbers
        // The previous optimization for adjacent swaps was causing duplicate order numbers
        bulkReorderSlips(updatedSlips);

        return updatedSlips;
    }, [slips, onReorder, bulkReorderSlips]);

    return {
        reorderSlips,
        updateSlipOrder,
        bulkReorderSlips,
    };
} 