import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Icon } from '@/components/icon';
import { Edit3, Trash2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type Slip } from '@/types';
import {
    draggable,
    dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
import { pointerOutsideOfPreview } from '@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview';

interface SlipCardProps {
    slip: Slip;
    className?: string;
    isDragging?: boolean;
    showOrderNumber?: boolean;
    draggedSlipCategoryId?: number | null;
    onDragStart?: (slip: Slip) => void;
    onDragEnd?: () => void;
    onEdit?: (slip: Slip) => void;
    onDelete?: (slip: Slip) => void;
}

export function SlipCard({ 
    slip, 
    className, 
    isDragging = false,
    showOrderNumber = false,
    draggedSlipCategoryId = null,
    onDragStart,
    onDragEnd,
    onEdit,
    onDelete
}: SlipCardProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [isDraggedOver, setIsDraggedOver] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        const element = ref.current;
        
        if (!element) return;

        const cleanup = [
            draggable({
                element,
                getInitialData: () => ({ slip }),
                onDragStart: () => {
                    onDragStart?.(slip);
                },
                onGenerateDragPreview: ({ nativeSetDragImage }) => {
                    setCustomNativeDragPreview({
                        nativeSetDragImage,
                        getOffset: pointerOutsideOfPreview({
                            x: '16px',
                            y: '8px',
                        }),
                        render: ({ container }) => {
                            const preview = element.cloneNode(true) as HTMLElement;
                            preview.style.width = `${element.offsetWidth}px`;
                            preview.style.opacity = '0.8';
                            preview.style.transform = 'rotate(5deg)';
                            container.appendChild(preview);
                        },
                    });
                },
                onDrop: () => {
                    onDragEnd?.();
                },
            }),
        ];

        const shouldBeDropTarget = draggedSlipCategoryId === null || draggedSlipCategoryId === slip.category_id;
        
        if (shouldBeDropTarget) {
            cleanup.push(
                dropTargetForElements({
                    element,
                    getData: () => ({ slip }),
                    onDragEnter: () => setIsDraggedOver(true),
                    onDragLeave: () => setIsDraggedOver(false),
                    onDrop: () => setIsDraggedOver(false),
                })
            );
        }

        return () => {
            cleanup.forEach((fn) => fn());
        };
    }, [slip, onDragStart, onDragEnd, draggedSlipCategoryId]);

    const handleEdit = () => {
        onEdit?.(slip);
    };

    const handleDeleteClick = () => {
        if (showDeleteConfirm) {
            onDelete?.(slip);
            setShowDeleteConfirm(false);
        } else {
            setShowDeleteConfirm(true);
        }
    };

    const handleDeleteCancel = () => {
        setShowDeleteConfirm(false);
    };

    return (
        <Card 
            ref={ref}
            className={`relative transition-all duration-200 mb-0 cursor-grab active:cursor-grabbing ${className} ${
                isDragging ? 'opacity-50 scale-95' : ''
            } ${
                isDraggedOver ? 'ring-2 ring-primary/50 ring-offset-2' : ''
            }`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => {
                setIsHovered(false);
                setShowDeleteConfirm(false);
            }}
        >
            <CardContent className="flex items-center min-h-36 p-6">
                {/* Order Number - only show if showOrderNumber is true */}
                {showOrderNumber && (
                    <div className="absolute top-2 left-2">
                        <span className="text-xs text-muted-foreground/60 font-mono bg-background/80 backdrop-blur-sm px-1.5 py-0.5 rounded">
                            {slip.order}
                        </span>
                    </div>
                )}

                {/* Action Buttons */}
                <div className={`absolute top-2 right-2 flex gap-1 transition-all duration-200 ${
                    (isHovered || showDeleteConfirm) 
                        ? 'opacity-100 translate-y-0' 
                        : 'opacity-0 -translate-y-2 pointer-events-none'
                }`}>
                    {showDeleteConfirm ? (
                        <>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 bg-background/95 backdrop-blur-sm border-border/50"
                                onClick={handleDeleteCancel}
                            >
                                <Icon iconNode={X} className="h-3 w-3" />
                            </Button>
                            <Button
                                size="sm"
                                variant="destructive"
                                className="h-8 w-8 p-0"
                                onClick={handleDeleteClick}
                            >
                                <Icon iconNode={Check} className="h-3 w-3" />
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 bg-background/95 backdrop-blur-sm border-border/50"
                                onClick={handleEdit}
                            >
                                <Icon iconNode={Edit3} className="h-3 w-3" />
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                className="h-8 w-8 p-0 bg-background/95 backdrop-blur-sm border-border/50 hover:bg-destructive hover:text-destructive-foreground"
                                onClick={handleDeleteClick}
                            >
                                <Icon iconNode={Trash2} className="h-3 w-3" />
                            </Button>
                        </>
                    )}
                </div>
                
                {/* Content */}
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-center text-base leading-relaxed break-words hyphens-auto max-w-full">
                        {slip.content}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
} 