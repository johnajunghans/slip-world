import { useState, useEffect } from 'react';
import { SlipModal } from '@/components/create-slip-modal';
import { TopicModal } from '@/components/topic-modal';
import { MainCategoryPanel } from '@/components/main-category-panel';
import { CategoryColumnsPanel } from '@/components/category-columns-panel';
import AppLayout from '@/layouts/app-layout';
import { useSlipDragDrop } from '@/hooks/use-slip-drag-drop';
import { type BreadcrumbItem, type Slip, type Category, type Topic } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { useUnifiedOrder } from '@/hooks/use-unified-order';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

// Define the default category names - MAIN is separate, others are collapsible
const MAIN_CATEGORY = 'MAIN';
const OTHER_DEFAULT_CATEGORIES = ['UNASSIMILATED', 'PROGRAM', 'CRIT', 'TOUGH', 'JUNK'];
const ALL_DEFAULT_CATEGORIES = [MAIN_CATEGORY, ...OTHER_DEFAULT_CATEGORIES];

interface DashboardProps {
    slips: Slip[];
    categories: Category[];
    topics: Topic[];
}

export default function Dashboard({ slips: initialSlips, categories, topics: initialTopics }: DashboardProps) {
    const [slips, setSlips] = useState(initialSlips);
    const [topics, setTopics] = useState(initialTopics);
    const [draggedSlip, setDraggedSlip] = useState<Slip | null>(null);
    const [draggedTopic, setDraggedTopic] = useState<Topic | null>(null);
    const [editingSlip, setEditingSlip] = useState<Slip | null>(null);
    const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isTopicEditModalOpen, setIsTopicEditModalOpen] = useState(false);
    const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);
    
    // Get main category for drag drop hook
    const mainCategory = categories.find(cat => cat.name === MAIN_CATEGORY);
    
    // Use drag drop hook for main category (where order matters)
    const { reorderSlips: reorderMainSlips } = useSlipDragDrop({
        slips,
        onReorder: setSlips,
        categoryId: mainCategory?.id,
    });

    // Use drag drop hook for other categories (order doesn't matter, but still need for cross-category moves)
    const { reorderSlips: reorderOtherSlips } = useSlipDragDrop({
        slips,
        onReorder: setSlips,
    });

    // Use unified order management
    const { 
        combinedItems, 
        isReordering, 
        moveItemToPosition 
    } = useUnifiedOrder({
        slips,
        topics,
        mainCategoryId: mainCategory?.id || 0,
        onSlipsChange: setSlips,
        onTopicsChange: setTopics,
    });

    // Update slip category and place it at the top of the target category
    const updateSlipCategory = async (slipId: number, newCategoryId: number) => {
        try {
            // Get slips in the target category to calculate new order
            const targetCategorySlips = slips.filter(slip => slip.category_id === newCategoryId);
            const newOrder = 1; // Always place at the top

            const response = await fetch(`/slips/${slipId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    category_id: newCategoryId,
                    order: newOrder,
                }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const updatedSlip = await response.json();
            
            // Update local state - move slip to new category at the top
            setSlips(prevSlips => {
                return prevSlips.map(slip => {
                    if (slip.id === slipId) {
                        // Update the moved slip
                        return { ...slip, category_id: newCategoryId, order: newOrder };
                    } else if (slip.category_id === newCategoryId && slip.order >= newOrder) {
                        // Increment order for existing slips in target category
                        return { ...slip, order: slip.order + 1 };
                    }
                    return slip;
                });
            });
        } catch (error) {
            console.error('Failed to update slip category:', error);
        }
    };

    // Update local state when props change (e.g., after server updates)
    useEffect(() => {
        setSlips(initialSlips);
    }, [initialSlips]);

    useEffect(() => {
        setTopics(initialTopics);
    }, [initialTopics]);

    const handleDragStart = (slip: Slip) => {
        setDraggedSlip(slip);
    };

    const handleTopicDragStart = (topic: Topic) => {
        setDraggedTopic(topic);
    };

    const handleDragEnd = () => {
        setDraggedSlip(null);
        setDraggedTopic(null);
        setDragOverCategory(null);
    };

    const handleEdit = (slip: Slip) => {
        setEditingSlip(slip);
        setIsEditModalOpen(true);
    };

    const handleEditModalClose = () => {
        setIsEditModalOpen(false);
        setEditingSlip(null);
    };

    const handleTopicEdit = (topic: Topic) => {
        setEditingTopic(topic);
        setIsTopicEditModalOpen(true);
    };

    const handleTopicEditModalClose = () => {
        setIsTopicEditModalOpen(false);
        setEditingTopic(null);
    };

    const handleDelete = (slip: Slip) => {
        router.delete(`/slips/${slip.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                // Backend handles order recalculation, so just refresh the data
                router.reload({ only: ['slips', 'topics'] });
            },
            onError: (errors) => {
                console.error('Failed to delete slip:', errors);
                // You could show a toast notification here
            }
        });
    };

    const handleTopicDelete = (topic: Topic) => {
        router.delete(`/topics/${topic.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                // Backend handles order recalculation, so just refresh the data
                router.reload({ only: ['slips', 'topics'] });
            },
            onError: (errors) => {
                console.error('Failed to delete topic:', errors);
                // You could show a toast notification here
            }
        });
    };

    // Filter slips by category type
    const defaultCategoryIds = categories
        .filter(cat => ALL_DEFAULT_CATEGORIES.includes(cat.name))
        .map(cat => cat.id);
    
    const nonDefaultSlips = slips.filter(slip => 
        !defaultCategoryIds.includes(slip.category_id)
    ).sort((a, b) => a.order - b.order);

    // Get slips for each category
    const getSlipsForCategory = (categoryName: string) => {
        const category = categories.find(cat => cat.name === categoryName);
        if (!category) return [];
        
        return slips
            .filter(slip => slip.category_id === category.id)
            .sort((a, b) => a.order - b.order);
    };

    // Handle drag and drop
    useEffect(() => {
        return monitorForElements({
            onDrop({ source, location }) {
                if (!location.current.dropTargets.length) return;

                const sourceSlip = source.data.slip as Slip;
                const sourceTopic = source.data.topic as Topic;
                const sourceData = source.data;

                // Look through all drop targets to find the most specific one
                let categoryTarget = null;
                let slipTarget = null;
                let topicTarget = null;

                for (const target of location.current.dropTargets) {
                    if (target.data.categoryId) {
                        categoryTarget = target;
                    } else if (target.data.slip) {
                        slipTarget = target;
                    } else if (target.data.topic) {
                        topicTarget = target;
                    }
                }

                // Prefer category target if available (direct category drop)
                if (categoryTarget) {
                    const targetCategoryId = categoryTarget.data.categoryId as number;
                    const targetCategoryName = categoryTarget.data.categoryName as string;
                    
                    // Topics can only be placed in MAIN category
                    if (sourceTopic && targetCategoryId !== mainCategory?.id) {
                        console.log('Topics can only be placed in MAIN category');
                        setDraggedSlip(null);
                        setDraggedTopic(null);
                        setDragOverCategory(null);
                        return;
                    }

                    // For moves TO main category, use unified system
                    if (targetCategoryName === 'MAIN') {
                        if (sourceSlip) {
                            // Get current position in main category to place at end
                            const mainCategoryItems = combinedItems.length;
                            const isMovingToMain = sourceSlip.category_id !== mainCategory?.id;
                            moveItemToPosition(sourceSlip, mainCategoryItems, isMovingToMain);
                        } else if (sourceTopic) {
                            // Topics are already in main category, this shouldn't happen
                            console.log('Topic already in main category');
                        }
                    } else {
                        // For moves to other categories, use existing logic (slips only)
                        if (sourceSlip && sourceSlip.category_id !== targetCategoryId) {
                            updateSlipCategory(sourceSlip.id, targetCategoryId);
                        }
                    }
                    
                    setDraggedSlip(null);
                    setDraggedTopic(null);
                    setDragOverCategory(null);
                    return;
                }

                // Handle item-to-item drops (slip-to-slip, topic-to-topic, slip-to-topic, topic-to-slip)
                if (slipTarget || topicTarget) {
                    const targetSlip = slipTarget?.data.slip as Slip;
                    const targetTopic = topicTarget?.data.topic as Topic;
                    const targetItem = targetSlip || targetTopic;
                    const sourceItem = sourceSlip || sourceTopic;

                    if (!sourceItem || !targetItem) return;
                    if (sourceItem.id === targetItem.id) return;

                    // Determine if this involves the main category
                    // Only use unified system if BOTH items are in main category OR involve topics
                    const isMainCategoryOperation = 
                        sourceTopic || targetTopic || // Any topic operation uses unified system
                        (sourceSlip && targetSlip && 
                         sourceSlip.category_id === mainCategory?.id && 
                         targetSlip.category_id === mainCategory?.id); // Both slips in main category

                    if (isMainCategoryOperation) {
                        // Use unified order system for main category operations
                        const targetPosition = combinedItems.findIndex(item => item.id === targetItem.id);
                        if (targetPosition !== -1) {
                            // For cross-category moves to main, use unified system directly
                            if (sourceSlip && mainCategory && sourceSlip.category_id !== mainCategory.id) {
                                // Move slip to main category and position it in one operation
                                moveItemToPosition(sourceSlip, targetPosition, true);
                            } else {
                                // Same category reordering in main, or topic operations
                                moveItemToPosition(sourceItem, targetPosition);
                            }
                        }
                    } else {
                        // Handle non-main category operations with existing logic
                        if (sourceSlip && targetSlip) {
                            // For slips: handle cross-category moves
                            if (sourceSlip.category_id !== targetSlip.category_id) {
                                updateSlipCategory(sourceSlip.id, targetSlip.category_id);
                            } else {
                                // Same category reordering for non-main categories
                                const categorySlips = slips.filter(slip => slip.category_id === sourceSlip.category_id);
                                const sourceIndex = categorySlips.findIndex(slip => slip.id === sourceSlip.id);
                                const destinationIndex = categorySlips.findIndex(slip => slip.id === targetSlip.id);

                                if (sourceIndex !== -1 && destinationIndex !== -1) {
                                    reorderOtherSlips(sourceIndex, destinationIndex);
                                }
                            }
                        }
                    }

                    setDraggedSlip(null);
                    setDraggedTopic(null);
                    setDragOverCategory(null);
                }
            },
        });
    }, [slips, topics, combinedItems, moveItemToPosition, updateSlipCategory, mainCategory?.id, reorderOtherSlips]);

    const handleItemCreated = () => {
        // Refresh the page to get updated slips and topics
        router.reload({ only: ['slips', 'topics'] });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 overflow-hidden">
                <ResizablePanelGroup direction="horizontal" className="p-4 gap-4">
                    {/* Left panel - MAIN category */}
                    <ResizablePanel defaultSize={40} minSize={25} className="flex flex-col px-2">
                        {mainCategory && (
                            <MainCategoryPanel
                                category={mainCategory}
                                items={combinedItems}
                                draggedSlip={draggedSlip}
                                draggedTopic={draggedTopic}
                                dragOverCategory={dragOverCategory}
                                onDragStart={handleDragStart}
                                onTopicDragStart={handleTopicDragStart}
                                onDragEnd={handleDragEnd}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onTopicEdit={handleTopicEdit}
                                onTopicDelete={handleTopicDelete}
                                onItemCreated={handleItemCreated}
                                onDragOverCategory={setDragOverCategory}
                                categories={categories}
                            />
                        )}
                    </ResizablePanel>

                    <ResizableHandle withHandle />

                    {/* Right panel - Other categories in columns */}
                    <ResizablePanel defaultSize={60} minSize={35} className="flex flex-col max-h-[calc(100vh-116px)] overflow-y-auto">
                        <CategoryColumnsPanel
                            categories={categories}
                            categoryNames={OTHER_DEFAULT_CATEGORIES}
                            slips={slips}
                            draggedSlip={draggedSlip}
                            draggedTopic={draggedTopic}
                            dragOverCategory={dragOverCategory}
                            nonDefaultSlips={nonDefaultSlips}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onDragOverCategory={setDragOverCategory}
                        />
                    </ResizablePanel>
                </ResizablePanelGroup>
            </div>

            {/* Edit Modals */}
            <SlipModal
                categories={categories}
                slip={editingSlip}
                isOpen={isEditModalOpen}
                onOpenChange={handleEditModalClose}
            />
            
            <TopicModal
                topic={editingTopic}
                isOpen={isTopicEditModalOpen}
                onOpenChange={handleTopicEditModalClose}
            />
        </AppLayout>
    );
}
