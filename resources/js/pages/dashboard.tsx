import { useState, useEffect } from 'react';
import { SlipCard } from '@/components/slip-card';
import { SlipModal } from '@/components/create-slip-modal';
import AppLayout from '@/layouts/app-layout';
import { useSlipDragDrop } from '@/hooks/use-slip-drag-drop';
import { type BreadcrumbItem, type Slip, type Category } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

interface DashboardProps {
    slips: Slip[];
    categories: Category[];
}

export default function Dashboard({ slips: initialSlips, categories }: DashboardProps) {
    const [slips, setSlips] = useState(initialSlips);
    const [draggedSlip, setDraggedSlip] = useState<Slip | null>(null);
    const [editingSlip, setEditingSlip] = useState<Slip | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    
    const { reorderSlips } = useSlipDragDrop({
        slips,
        onReorder: setSlips,
    });

    useEffect(() => {
        return monitorForElements({
            onDrop({ source, location }) {
                const destination = location.current.dropTargets[0];
                if (!destination) return;

                const sourceSlip = source.data.slip as Slip;
                const destinationSlip = destination.data.slip as Slip;

                if (sourceSlip.id === destinationSlip.id) return;

                const sourceIndex = slips.findIndex(slip => slip.id === sourceSlip.id);
                const destinationIndex = slips.findIndex(slip => slip.id === destinationSlip.id);

                if (sourceIndex === -1 || destinationIndex === -1) return;

                reorderSlips(sourceIndex, destinationIndex);
                setDraggedSlip(null);
            },
        });
    }, [slips, reorderSlips]);

    // Update local state when props change (e.g., after server updates)
    useEffect(() => {
        setSlips(initialSlips);
    }, [initialSlips]);

    const handleDragStart = (slip: Slip) => {
        setDraggedSlip(slip);
    };

    const handleDragEnd = () => {
        setDraggedSlip(null);
    };

    const handleEdit = (slip: Slip) => {
        setEditingSlip(slip);
        setIsEditModalOpen(true);
    };

    const handleEditModalClose = () => {
        setIsEditModalOpen(false);
        setEditingSlip(null);
    };

    const handleDelete = (slip: Slip) => {
        router.delete(`/slips/${slip.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                // Remove the slip from local state immediately for better UX
                setSlips(prevSlips => prevSlips.filter(s => s.id !== slip.id));
            },
            onError: (errors) => {
                console.error('Failed to delete slip:', errors);
                // You could show a toast notification here
            }
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 gap-6 p-4 overflow-hidden">
                {/* Left half - Vertical carousel of slip cards */}
                <div className="flex-1 overflow-y-auto max-h-[calc(100vh-116px)] px-2">
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold mb-4">Your Slips</h2>
                        {slips.length > 0 ? (
                            slips.sort((a, b) => a.order - b.order).map((slip: Slip) => (
                                <SlipCard 
                                    key={slip.id} 
                                    slip={slip}
                                    className="w-full"
                                    isDragging={draggedSlip?.id === slip.id}
                                    onDragStart={handleDragStart}
                                    onDragEnd={handleDragEnd}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />
                            ))
                        ) : (
                            <div className="flex items-center justify-center min-h-[400px] border border-dashed border-sidebar-border/70 rounded-xl">
                                <p className="text-muted-foreground">No slips yet. Create your first slip to get started!</p>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Right half - Available for future content */}
                <div className="flex-1 flex items-center justify-center border border-dashed border-sidebar-border/70 rounded-xl">
                    <p className="text-muted-foreground">Right panel content goes here</p>
                </div>
            </div>

            {/* Edit Modal */}
            <SlipModal
                categories={categories}
                slip={editingSlip}
                isOpen={isEditModalOpen}
                onOpenChange={handleEditModalClose}
            />
        </AppLayout>
    );
}
