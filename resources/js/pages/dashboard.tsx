import { useState, useEffect } from 'react';
import { SlipCard } from '@/components/slip-card';
import { SlipModal } from '@/components/create-slip-modal';
import AppLayout from '@/layouts/app-layout';
import { useSlipDragDrop } from '@/hooks/use-slip-drag-drop';
import { type BreadcrumbItem, type Slip, type Category } from '@/types';
import { Head, router } from '@inertiajs/react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
    monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

// Define the default category names
const DEFAULT_CATEGORIES = ['UNASSIMILATED', 'PROGRAM', 'CRIT', 'TOUGH', 'JUNK'];

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

    // Filter slips by category type
    const defaultCategoryIds = categories
        .filter(cat => DEFAULT_CATEGORIES.includes(cat.name))
        .map(cat => cat.id);
    
    const nonDefaultSlips = slips.filter(slip => 
        !defaultCategoryIds.includes(slip.category_id)
    ).sort((a, b) => a.order - b.order);

    // Get slips for each default category
    const getSlipsForCategory = (categoryName: string) => {
        const category = categories.find(cat => cat.name === categoryName);
        if (!category) return [];
        
        return slips
            .filter(slip => slip.category_id === category.id)
            .sort((a, b) => a.order - b.order);
    };

    // Get default categories in the correct order
    const defaultCategories = DEFAULT_CATEGORIES.map(name => 
        categories.find(cat => cat.name === name)
    ).filter(Boolean) as Category[];

    const renderSlipsList = (slipsToRender: Slip[], emptyMessage: string) => {
        if (slipsToRender.length > 0) {
            return slipsToRender.map((slip: Slip) => (
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
            ));
        }

        return (
            <div className="flex items-center justify-center min-h-[200px] border border-dashed border-sidebar-border/70 rounded-xl">
                <p className="text-muted-foreground text-sm">{emptyMessage}</p>
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 gap-6 p-4 overflow-hidden">
                {/* Left half - Non-default category slips */}
                <div className="flex-1 overflow-y-auto max-h-[calc(100vh-116px)] p-2">
                    <div className="space-y-4">
                        {/* <h2 className="text-lg font-semibold mb-4">Custom Categories</h2> */}
                        {renderSlipsList(
                            nonDefaultSlips,
                            "No slips in custom categories. All slips are in default categories or create a custom category!"
                        )}
                    </div>
                </div>
                
                {/* Right half - Default category tabs */}
                <div className="flex-1 flex flex-col overflow-y-auto max-h-[calc(100vh-116px)] p-2">
                    {/* <h2 className="text-lg font-semibold mb-4">Default Categories</h2> */}
                    <Tabs defaultValue={DEFAULT_CATEGORIES[0]} className="flex-1 flex flex-col">
                        <TabsList className="grid w-full grid-cols-5">
                            {DEFAULT_CATEGORIES.map((categoryName) => (
                                <TabsTrigger 
                                    key={categoryName} 
                                    value={categoryName}
                                    className="text-xs"
                                >
                                    {categoryName}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                        
                        {DEFAULT_CATEGORIES.map((categoryName) => {
                            const categorySlips = getSlipsForCategory(categoryName);
                            const category = categories.find(cat => cat.name === categoryName);
                            
                            return (
                                <TabsContent 
                                    key={categoryName} 
                                    value={categoryName}
                                    className="flex-1 overflow-y-auto mt-4"
                                >
                                    <div className="space-y-4">
                                        {category?.description && (
                                            <p className="text-sm text-muted-foreground italic border-l-2 border-sidebar-border pl-3">
                                                {category.description}
                                            </p>
                                        )}
                                        {renderSlipsList(
                                            categorySlips,
                                            `No slips in ${categoryName} yet.`
                                        )}
                                    </div>
                                </TabsContent>
                            );
                        })}
                    </Tabs>
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
