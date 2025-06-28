import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Icon } from '@/components/icon';
import { GripVertical, Edit3, Trash2, X, Check } from 'lucide-react';
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
    onDragStart?: (slip: Slip) => void;
    onDragEnd?: () => void;
    onEdit?: (slip: Slip) => void;
    onDelete?: (slip: Slip) => void;
}

export function SlipCard({ 
    slip, 
    className, 
    isDragging = false,
    onDragStart,
    onDragEnd,
    onEdit,
    onDelete
}: SlipCardProps) {
    const ref = useRef<HTMLDivElement>(null);
    const dragHandleRef = useRef<HTMLDivElement>(null);
    const [isDraggedOver, setIsDraggedOver] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        const element = ref.current;
        const dragHandle = dragHandleRef.current;
        
        if (!element || !dragHandle) return;

        const cleanup = [
            draggable({
                element: dragHandle,
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
            dropTargetForElements({
                element,
                getData: () => ({ slip }),
                onDragEnter: () => setIsDraggedOver(true),
                onDragLeave: () => setIsDraggedOver(false),
                onDrop: () => setIsDraggedOver(false),
            }),
        ];

        return () => {
            cleanup.forEach((fn) => fn());
        };
    }, [slip, onDragStart, onDragEnd]);

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
            className={`relative transition-all duration-200 ${className} ${
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
                {/* Drag Handle */}
                <div
                    ref={dragHandleRef}
                    className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing opacity-30 hover:opacity-60 transition-opacity"
                    aria-label="Drag to reorder"
                >
                    <Icon iconNode={GripVertical} className="h-5 w-5 text-muted-foreground" />
                </div>
                
                {/* Action Buttons */}
                {(isHovered || showDeleteConfirm) && (
                    <div className="absolute top-2 right-2 flex gap-1">
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
                )}
                
                {/* Content */}
                <div className="flex-1 flex items-center justify-center pl-6">
                    <p className="text-center text-base leading-relaxed break-words hyphens-auto max-w-full">
                        {slip.content}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
} 