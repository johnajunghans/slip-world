import { useState, useEffect, useRef } from 'react';
import { SlipCard } from '@/components/slip-card';
import { TopicCard } from '@/components/topic-card';
import { SlipModal } from '@/components/create-slip-modal';
import { TopicModal } from '@/components/topic-modal';
import { InsertItemLine } from '@/components/insert-item-line';
import AppLayout from '@/layouts/app-layout';
import { useSlipDragDrop } from '@/hooks/use-slip-drag-drop';
import { type BreadcrumbItem, type Slip, type Category, type Topic } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
    monitorForElements,
    dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';

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
    const [editingSlip, setEditingSlip] = useState<Slip | null>(null);
    const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isTopicEditModalOpen, setIsTopicEditModalOpen] = useState(false);
    const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
    const [dragOverCategory, setDragOverCategory] = useState<string | null>(null);
    
    const { reorderSlips } = useSlipDragDrop({
        slips,
        onReorder: setSlips,
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

    useEffect(() => {
        return monitorForElements({
            onDrop({ source, location }) {
                if (!location.current.dropTargets.length) return;

                const sourceSlip = source.data.slip as Slip;
                const sourceData = source.data;

                // Look through all drop targets to find the most specific one
                // Category containers will be deeper in the hierarchy than slip cards
                let categoryTarget = null;
                let slipTarget = null;

                for (const target of location.current.dropTargets) {
                    if (target.data.categoryId) {
                        categoryTarget = target;
                    } else if (target.data.slip) {
                        slipTarget = target;
                    }
                }

                // Prefer category target if available (direct category drop)
                if (categoryTarget) {
                    const targetCategoryId = categoryTarget.data.categoryId as number;
                    
                    // Only allow topics in MAIN category (though topics aren't currently shown)
                    if (sourceData.topic && targetCategoryId !== categories.find(cat => cat.name === MAIN_CATEGORY)?.id) {
                        console.log('Topics can only be placed in MAIN category');
                        setDraggedSlip(null);
                        setDragOverCategory(null);
                        return;
                    }

                    // Update slip category if it's different
                    if (sourceSlip.category_id !== targetCategoryId) {
                        updateSlipCategory(sourceSlip.id, targetCategoryId);
                    }
                    
                    setDraggedSlip(null);
                    setDragOverCategory(null);
                    return;
                }

                // Handle slip-to-slip drops
                if (slipTarget) {
                    const destinationSlip = slipTarget.data.slip as Slip;
                    if (sourceSlip.id === destinationSlip.id) return;

                    // If slips are in different categories, move to target category
                    if (sourceSlip.category_id !== destinationSlip.category_id) {
                        updateSlipCategory(sourceSlip.id, destinationSlip.category_id);
                        setDraggedSlip(null);
                        setDragOverCategory(null);
                        return;
                    }

                    // Handle reordering within the same category
                    const sourceIndex = slips.findIndex(slip => slip.id === sourceSlip.id);
                    const destinationIndex = slips.findIndex(slip => slip.id === destinationSlip.id);

                    if (sourceIndex === -1 || destinationIndex === -1) return;

                    reorderSlips(sourceIndex, destinationIndex);
                    setDraggedSlip(null);
                    setDragOverCategory(null);
                }
            },
        });
    }, [slips, reorderSlips, categories, updateSlipCategory]);

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

    const handleDragEnd = () => {
        setDraggedSlip(null);
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
                // Remove the slip from local state immediately for better UX
                setSlips(prevSlips => prevSlips.filter(s => s.id !== slip.id));
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
                // Remove the topic from local state immediately for better UX
                setTopics(prevTopics => prevTopics.filter(t => t.id !== topic.id));
            },
            onError: (errors) => {
                console.error('Failed to delete topic:', errors);
                // You could show a toast notification here
            }
        });
    };

    const toggleCategoryCollapse = (categoryName: string) => {
        setCollapsedCategories(prev => ({
            ...prev,
            [categoryName]: !prev[categoryName]
        }));
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

    // Get MAIN category slips and topics
    const mainSlips = getSlipsForCategory(MAIN_CATEGORY);
    const mainTopics = topics.sort((a, b) => a.order - b.order);
    const mainCategory = categories.find(cat => cat.name === MAIN_CATEGORY);

    // Combine slips and topics for main category, sorted by order
    const mainItems = [...mainSlips, ...mainTopics].sort((a, b) => a.order - b.order);

    const handleItemCreated = () => {
        // Refresh the page to get updated slips and topics
        router.reload({ only: ['slips', 'topics'] });
    };

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
                <p className="text-muted-foreground text-sm text-center px-2">{emptyMessage}</p>
            </div>
        );
    };

    const renderMainItemsList = (itemsToRender: (Slip | Topic)[], emptyMessage: string) => {
        if (itemsToRender.length > 0) {
            const elements: React.ReactNode[] = [];
            
            // Add insert line at the beginning (order 1)
            if (mainCategory) {
                elements.push(
                    <InsertItemLine
                        key="insert-0"
                        categories={categories}
                        categoryId={mainCategory.id}
                        insertOrder={1}
                        onItemCreated={handleItemCreated}
                    />
                );
            }

            // Add items with insert lines between them
            itemsToRender.forEach((item: Slip | Topic, index: number) => {
                // Check if item is a slip or topic by checking for 'content' property
                const isSlip = 'content' in item;
                
                if (isSlip) {
                    const slip = item as Slip;
                    elements.push(
                        <SlipCard 
                            key={`slip-${slip.id}`} 
                            slip={slip}
                            className="w-full"
                            isDragging={draggedSlip?.id === slip.id}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    );
                } else {
                    const topic = item as Topic;
                    elements.push(
                        <TopicCard 
                            key={`topic-${topic.id}`} 
                            topic={topic}
                            className="w-full"
                            onEdit={handleTopicEdit}
                            onDelete={handleTopicDelete}
                        />
                    );
                }

                // Add insert line after each item
                if (mainCategory) {
                    elements.push(
                        <InsertItemLine
                            key={`insert-${item.id}`}
                            categories={categories}
                            categoryId={mainCategory.id}
                            insertOrder={item.order + 1}
                            onItemCreated={handleItemCreated}
                        />
                    );
                }
            });

            return elements;
        }

        // Even when empty, show an insert line for the first item
        if (mainCategory) {
            return (
                <div className="space-y-4">
                    <InsertItemLine
                        key="insert-first"
                        categories={categories}
                        categoryId={mainCategory.id}
                        insertOrder={1}
                        onItemCreated={handleItemCreated}
                    />
                    <div className="flex items-center justify-center min-h-[200px] border border-dashed border-sidebar-border/70 rounded-xl">
                        <p className="text-muted-foreground text-sm text-center px-2">{emptyMessage}</p>
                    </div>
                </div>
            );
        }

        return (
            <div className="flex items-center justify-center min-h-[200px] border border-dashed border-sidebar-border/70 rounded-xl">
                <p className="text-muted-foreground text-sm text-center px-2">{emptyMessage}</p>
            </div>
        );
    };

    // Droppable category container component
    const DroppableCategoryContainer = ({ 
        categoryName, 
        children, 
        className = "" 
    }: { 
        categoryName: string; 
        children: React.ReactNode; 
        className?: string;
    }) => {
        const ref = useRef<HTMLDivElement>(null);
        const category = categories.find(cat => cat.name === categoryName);
        
        useEffect(() => {
            const element = ref.current;
            if (!element || !category) return;

            const cleanup = dropTargetForElements({
                element,
                getData: () => ({ categoryId: category.id, categoryName }),
                onDragEnter: () => setDragOverCategory(categoryName),
                onDragLeave: () => setDragOverCategory(null),
                onDrop: () => setDragOverCategory(null),
            });

            return cleanup;
        }, [category, categoryName]);

        if (!category) return <div className={className}>{children}</div>;

        return (
            <div 
                ref={ref}
                className={`${className} ${
                    dragOverCategory === categoryName 
                        ? 'ring-2 ring-primary/50 ring-offset-2 bg-primary/5' 
                        : ''
                } transition-all duration-200`}
            >
                {children}
            </div>
        );
    };

    const renderCategoryColumn = (categoryName: string) => {
        const category = categories.find(cat => cat.name === categoryName);
        const categorySlips = getSlipsForCategory(categoryName);
        const isCollapsed = collapsedCategories[categoryName];

        if (!category) return null;

        return (
            <DroppableCategoryContainer 
                key={categoryName} 
                categoryName={categoryName}
                className="flex flex-col h-full rounded-lg"
            >
                <Collapsible
                    open={!isCollapsed}
                    onOpenChange={() => toggleCategoryCollapse(categoryName)}
                    className="flex flex-col h-full"
                >
                    <CollapsibleTrigger className="flex items-center justify-between p-3 text-left bg-sidebar-accent/50 hover:bg-sidebar-accent rounded-lg transition-colors mb-3 shrink-0">
                        <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm truncate">{categoryName}</h3>
                            <div className="flex items-center justify-between mt-1">
                                <span className="text-xs text-muted-foreground">
                                    {categorySlips.length} slip{categorySlips.length !== 1 ? 's' : ''}
                                </span>
                                {isCollapsed ? (
                                    <ChevronRight className="h-3 w-3" />
                                ) : (
                                    <ChevronDown className="h-3 w-3" />
                                )}
                            </div>
                        </div>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="flex-1 flex flex-col min-h-0">
                        <div className="flex-1 overflow-y-auto space-y-3">
                            {category.description && (
                                <p className="text-xs text-muted-foreground italic border-l-2 border-sidebar-border pl-2 mb-3">
                                    {category.description}
                                </p>
                            )}
                            {renderSlipsList(
                                categorySlips,
                                `No slips in ${categoryName} yet.`
                            )}
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </DroppableCategoryContainer>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 overflow-hidden">
                <ResizablePanelGroup direction="horizontal" className="p-4 gap-4">
                    {/* Left panel - MAIN category */}
                    <ResizablePanel defaultSize={40} minSize={25} className="flex flex-col px-2">
                        <DroppableCategoryContainer 
                            categoryName={MAIN_CATEGORY}
                            className="flex flex-col h-full rounded-lg"
                        >
                            <div className="mb-4">
                                {/* <h2 className="text-lg font-semibold mb-2">{MAIN_CATEGORY}</h2> */}
                                {categories.find(cat => cat.name === MAIN_CATEGORY)?.description && (
                                    <p className="text-sm text-muted-foreground italic border-l-2 border-sidebar-border pl-3">
                                        {categories.find(cat => cat.name === MAIN_CATEGORY)?.description}
                                    </p>
                                )}
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-4">
                                {renderMainItemsList(
                                    mainItems,
                                    `No items in ${MAIN_CATEGORY} yet.`
                                )}
                            </div>
                        </DroppableCategoryContainer>
                    </ResizablePanel>

                    <ResizableHandle withHandle />

                    {/* Right panel - Other categories in columns */}
                    <ResizablePanel defaultSize={60} minSize={35} className="flex flex-col max-h-[calc(100vh-116px)] overflow-y-auto">
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {/* Category columns */}
                            <div className="flex-1 flex gap-3 overflow-hidden">
                                {OTHER_DEFAULT_CATEGORIES.map(categoryName => (
                                    <div 
                                        key={categoryName} 
                                        className={`flex-1 min-w-0 ${collapsedCategories[categoryName] ? 'max-w-[120px]' : ''}`}
                                    >
                                        {renderCategoryColumn(categoryName)}
                                    </div>
                                ))}
                            </div>

                            {/* Custom categories section */}
                            {nonDefaultSlips.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-sidebar-border">
                                    <h3 className="font-semibold mb-3">Custom Categories</h3>
                                    <div className="space-y-3 max-h-32 overflow-y-auto">
                                        {renderSlipsList(
                                            nonDefaultSlips,
                                            "No slips in custom categories."
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
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
