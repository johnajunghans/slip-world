import { useState, useEffect } from 'react';
import { SlipCard } from '@/components/slip-card';
import { SlipModal } from '@/components/create-slip-modal';
import AppLayout from '@/layouts/app-layout';
import { useSlipDragDrop } from '@/hooks/use-slip-drag-drop';
import { type BreadcrumbItem, type Slip, type Category } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import {
    monitorForElements,
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
}

export default function Dashboard({ slips: initialSlips, categories }: DashboardProps) {
    const [slips, setSlips] = useState(initialSlips);
    const [draggedSlip, setDraggedSlip] = useState<Slip | null>(null);
    const [editingSlip, setEditingSlip] = useState<Slip | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
    
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

    // Get MAIN category slips
    const mainSlips = getSlipsForCategory(MAIN_CATEGORY);

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

    const renderCategoryColumn = (categoryName: string) => {
        const category = categories.find(cat => cat.name === categoryName);
        const categorySlips = getSlipsForCategory(categoryName);
        const isCollapsed = collapsedCategories[categoryName];

        if (!category) return null;

        return (
            <div key={categoryName} className="flex flex-col h-full">
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
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 overflow-hidden">
                <ResizablePanelGroup direction="horizontal" className="p-4 gap-4">
                    {/* Left panel - MAIN category */}
                    <ResizablePanel defaultSize={40} minSize={25} className="flex flex-col">
                        <div className="mb-4">
                            {/* <h2 className="text-lg font-semibold mb-2">{MAIN_CATEGORY}</h2> */}
                            {categories.find(cat => cat.name === MAIN_CATEGORY)?.description && (
                                <p className="text-sm text-muted-foreground italic border-l-2 border-sidebar-border pl-3 mb-4">
                                    {categories.find(cat => cat.name === MAIN_CATEGORY)?.description}
                                </p>
                            )}
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-4">
                            {renderSlipsList(
                                mainSlips,
                                `No slips in ${MAIN_CATEGORY} yet.`
                            )}
                        </div>
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
