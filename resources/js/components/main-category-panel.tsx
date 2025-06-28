import { useRef, useEffect } from 'react';
import { SlipCard } from '@/components/slip-card';
import { TopicCard } from '@/components/topic-card';
import { InsertItemLine } from '@/components/insert-item-line';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { type Slip, type Category, type Topic } from '@/types';

interface MainCategoryPanelProps {
    category: Category;
    items: (Slip | Topic)[];
    draggedSlip: Slip | null;
    draggedTopic: Topic | null;
    dragOverCategory: string | null;
    onDragStart: (slip: Slip) => void;
    onTopicDragStart: (topic: Topic) => void;
    onDragEnd: () => void;
    onEdit: (slip: Slip) => void;
    onDelete: (slip: Slip) => void;
    onTopicEdit: (topic: Topic) => void;
    onTopicDelete: (topic: Topic) => void;
    onItemCreated: () => void;
    onDragOverCategory: (category: string | null) => void;
    categories: Category[];
}

export function MainCategoryPanel({
    category,
    items,
    draggedSlip,
    draggedTopic,
    dragOverCategory,
    onDragStart,
    onTopicDragStart,
    onDragEnd,
    onEdit,
    onDelete,
    onTopicEdit,
    onTopicDelete,
    onItemCreated,
    onDragOverCategory,
    categories,
}: MainCategoryPanelProps) {
    const ref = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        // Only make category droppable if:
        // 1. No item is being dragged, OR
        // 2. The dragged slip is from a different category
        const shouldBeDropTarget = 
            (!draggedSlip && !draggedTopic) || // No drag in progress
            (draggedSlip && draggedSlip.category_id !== category.id); // Slip from different category
        
        if (!shouldBeDropTarget) return;

        const cleanup = dropTargetForElements({
            element,
            getData: () => ({ categoryId: category.id, categoryName: category.name }),
            onDragEnter: () => onDragOverCategory(category.name),
            onDragLeave: () => onDragOverCategory(null),
            onDrop: () => onDragOverCategory(null),
        });

        return cleanup;
    }, [category, draggedSlip, draggedTopic, onDragOverCategory]);

    const renderMainItemsList = (itemsToRender: (Slip | Topic)[], emptyMessage: string) => {
        if (itemsToRender.length > 0) {
            const elements: React.ReactNode[] = [];
            
            // Add items with insert lines between them
            itemsToRender.forEach((item: Slip | Topic, index: number) => {
                // Add insert line before each item (this covers the first position and between items)
                elements.push(
                    <InsertItemLine
                        key={`insert-${index}`}
                        categories={categories}
                        categoryId={category.id}
                        insertOrder={item.order}
                        onItemCreated={onItemCreated}
                    />
                );

                // Check if item is a slip or topic by checking for 'content' property
                const isSlip = 'content' in item;
                
                if (isSlip) {
                    const slip = item as Slip;
                    elements.push(
                        <SlipCard 
                            key={`slip-${slip.id}`} 
                            slip={slip}
                            className="w-full"
                            showOrderNumber={true} // Always show order numbers in main category
                            isDragging={draggedSlip?.id === slip.id}
                            draggedSlipCategoryId={draggedSlip?.category_id || null}
                            onDragStart={onDragStart}
                            onDragEnd={onDragEnd}
                            onEdit={onEdit}
                            onDelete={onDelete}
                        />
                    );
                } else {
                    const topic = item as Topic;
                    elements.push(
                        <TopicCard 
                            key={`topic-${topic.id}`} 
                            topic={topic}
                            className="w-full"
                            isDragging={draggedTopic?.id === topic.id}
                            draggedSlipCategoryId={draggedSlip?.category_id || null}
                            draggedTopicId={draggedTopic?.id || null}
                            onDragStart={onTopicDragStart}
                            onDragEnd={onDragEnd}
                            onEdit={onTopicEdit}
                            onDelete={onTopicDelete}
                        />
                    );
                }
            });

            // Add final insert line after the last item
            const lastItem = itemsToRender[itemsToRender.length - 1];
            elements.push(
                <InsertItemLine
                    key={`insert-final`}
                    categories={categories}
                    categoryId={category.id}
                    insertOrder={lastItem.order + 1}
                    onItemCreated={onItemCreated}
                />
            );

            return elements;
        }

        // Even when empty, show an insert line for the first item
        return (
            <div className="space-y-4">
                <InsertItemLine
                    key="insert-first"
                    categories={categories}
                    categoryId={category.id}
                    insertOrder={1}
                    onItemCreated={onItemCreated}
                />
                <div className="flex items-center justify-center min-h-[200px] border border-dashed border-sidebar-border/70 rounded-xl">
                    <p className="text-muted-foreground text-sm text-center px-2">{emptyMessage}</p>
                </div>
            </div>
        );
    };

    return (
        <div 
            ref={ref}
            className={`flex flex-col h-full rounded-lg ${
                dragOverCategory === category.name 
                    ? 'ring-2 ring-primary/50 ring-offset-2 bg-primary/5' 
                    : ''
            } transition-all duration-200`}
        >
            <div className="mb-4">
                {category.description && (
                    <p className="text-sm text-muted-foreground italic border-l-2 border-sidebar-border pl-3">
                        {category.description}
                    </p>
                )}
            </div>
            <div className="flex-1 overflow-y-auto space-y-4">
                {renderMainItemsList(
                    items,
                    `No items in ${category.name} yet.`
                )}
            </div>
        </div>
    );
} 