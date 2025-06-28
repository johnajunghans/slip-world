import { useState } from 'react';
import { Plus, FileText, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SlipModal } from '@/components/create-slip-modal';
import { TopicModal } from '@/components/topic-modal';
import { type Category } from '@/types';

interface InsertItemLineProps {
    categories: Category[];
    categoryId: number;
    insertOrder: number;
    onItemCreated?: () => void;
}

export function InsertItemLine({ 
    categories, 
    categoryId, 
    insertOrder, 
    onItemCreated 
}: InsertItemLineProps) {
    const [isHovered, setIsHovered] = useState(false);
    const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
    const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleSlipModalClose = () => {
        setIsSlipModalOpen(false);
        onItemCreated?.();
    };

    const handleTopicModalClose = () => {
        setIsTopicModalOpen(false);
        onItemCreated?.();
    };

    const handleCreateSlip = () => {
        setIsDropdownOpen(false);
        setIsSlipModalOpen(true);
    };

    const handleCreateTopic = () => {
        setIsDropdownOpen(false);
        setIsTopicModalOpen(true);
    };

    return (
        <div
            className={`group relative h-3 flex items-center mb-0 mx-2 transition-all duration-200 ${isHovered || isDropdownOpen ? 'py-5' : 'py-3'}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Thin line */}
            <div className={`flex-1 h-px transition-all duration-200 ${
                isHovered || isDropdownOpen ? 'bg-primary/40' : 'bg-transparent'
            }`} />
            
            {/* Plus button with dropdown */}
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                <DropdownMenuTrigger asChild>
                    <Button
                        size="sm"
                        variant="ghost"
                        className={`h-6 w-6 p-0 ml-2 transition-all duration-200 ${
                            isHovered || isDropdownOpen
                                ? 'opacity-100 scale-100 bg-primary/10 hover:bg-primary/20' 
                                : 'opacity-0 scale-75 pointer-events-none'
                        }`}
                    >
                        <Plus className="h-3 w-3" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={handleCreateSlip} className="gap-2">
                        <FileText className="h-4 w-4" />
                        Create Slip
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleCreateTopic} className="gap-2">
                        <Hash className="h-4 w-4" />
                        Create Topic
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            {/* Modals for creating slip and topic */}
            <SlipModal
                categories={categories}
                isOpen={isSlipModalOpen}
                onOpenChange={handleSlipModalClose}
                categoryId={categoryId}
                insertOrder={insertOrder}
            />
            
            <TopicModal
                isOpen={isTopicModalOpen}
                onOpenChange={handleTopicModalClose}
                insertOrder={insertOrder}
            />
        </div>
    );
}

// Keep the old component name for backwards compatibility
export function InsertSlipLine(props: InsertItemLineProps) {
    return <InsertItemLine {...props} />;
} 