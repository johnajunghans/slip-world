import { useState, useRef, useEffect } from 'react';
import { SlipCard } from '@/components/slip-card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { type Slip, type Category } from '@/types';

interface CategoryColumnsPanelProps {
    categories: Category[];
    categoryNames: string[];
    slips: Slip[];
    draggedSlip: Slip | null;
    draggedTopic: any | null; // Topic type
    dragOverCategory: string | null;
    nonDefaultSlips: Slip[];
    onDragStart: (slip: Slip) => void;
    onDragEnd: () => void;
    onEdit: (slip: Slip) => void;
    onDelete: (slip: Slip) => void;
    onDragOverCategory: (category: string | null) => void;
}

export function CategoryColumnsPanel({
    categories,
    categoryNames,
    slips,
    draggedSlip,
    draggedTopic,
    dragOverCategory,
    nonDefaultSlips,
    onDragStart,
    onDragEnd,
    onEdit,
    onDelete,
    onDragOverCategory,
}: CategoryColumnsPanelProps) {
    const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

    const toggleCategoryCollapse = (categoryName: string) => {
        setCollapsedCategories(prev => ({
            ...prev,
            [categoryName]: !prev[categoryName]
        }));
    };

    // Get slips for each category
    const getSlipsForCategory = (categoryName: string) => {
        const category = categories.find(cat => cat.name === categoryName);
        if (!category) return [];
        
        return slips
            .filter(slip => slip.category_id === category.id)
            .sort((a, b) => a.order - b.order);
    };

    const renderSlipsList = (slipsToRender: Slip[], emptyMessage: string, categoryName?: string) => {
        if (slipsToRender.length > 0) {
            return slipsToRender.map((slip: Slip) => (
                <SlipCard 
                    key={slip.id} 
                    slip={slip}
                    className="w-full"
                    showOrderNumber={categoryName === 'MAIN'}
                    isDragging={draggedSlip?.id === slip.id}
                    draggedSlipCategoryId={draggedSlip?.category_id || null}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                    onEdit={onEdit}
                    onDelete={onDelete}
                />
            ));
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

            // For topics, they can only be in MAIN category, so other categories should not be droppable
            if (draggedTopic && category.name !== 'MAIN') return;
            
            // Only make category droppable if:
            // 1. No item is being dragged, OR
            // 2. The dragged slip is from a different category
            const shouldBeDropTarget = 
                (!draggedSlip && !draggedTopic) || // No drag in progress
                (draggedSlip && draggedSlip.category_id !== category.id); // Slip from different category
            
            if (!shouldBeDropTarget) return;

            const cleanup = dropTargetForElements({
                element,
                getData: () => ({ categoryId: category.id, categoryName }),
                onDragEnter: () => onDragOverCategory(categoryName),
                onDragLeave: () => onDragOverCategory(null),
                onDrop: () => onDragOverCategory(null),
            });

            return cleanup;
        }, [category, categoryName, draggedSlip, draggedTopic]);

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
                                `No slips in ${categoryName} yet.`,
                                categoryName
                            )}
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </DroppableCategoryContainer>
        );
    };

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Category columns */}
            <div className="flex-1 flex gap-3 overflow-hidden">
                {categoryNames.map(categoryName => (
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
    );
} 