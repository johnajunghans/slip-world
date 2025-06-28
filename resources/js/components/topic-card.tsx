import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Icon } from '@/components/icon';
import { Edit3, Trash2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type Topic } from '@/types';
import {
    draggable,
    dropTargetForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';
import { pointerOutsideOfPreview } from '@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview';

interface TopicCardProps {
    topic: Topic;
    className?: string;
    isDragging?: boolean;
    draggedSlipCategoryId?: number | null;
    draggedTopicId?: number | null;
    onDragStart?: (topic: Topic) => void;
    onDragEnd?: () => void;
    onEdit?: (topic: Topic) => void;
    onDelete?: (topic: Topic) => void;
}

export function TopicCard({ 
    topic, 
    className, 
    isDragging = false,
    draggedSlipCategoryId = null,
    draggedTopicId = null,
    onDragStart,
    onDragEnd,
    onEdit,
    onDelete
}: TopicCardProps) {
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
                getInitialData: () => ({ topic }),
                onDragStart: () => {
                    onDragStart?.(topic);
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

        const shouldBeDropTarget = 
            (draggedSlipCategoryId === null && draggedTopicId === null) ||
            (draggedSlipCategoryId !== null) ||
            (draggedTopicId !== null && draggedTopicId !== topic.id);
        
        if (shouldBeDropTarget) {
            cleanup.push(
                dropTargetForElements({
                    element,
                    getData: () => ({ topic }),
                    onDragEnter: () => setIsDraggedOver(true),
                    onDragLeave: () => setIsDraggedOver(false),
                    onDrop: () => setIsDraggedOver(false),
                })
            );
        }

        return () => {
            cleanup.forEach((fn) => fn());
        };
    }, [topic, onDragStart, onDragEnd, draggedSlipCategoryId, draggedTopicId]);

    const handleEdit = () => {
        onEdit?.(topic);
    };

    const handleDeleteClick = () => {
        if (showDeleteConfirm) {
            onDelete?.(topic);
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
            className={`relative transition-all duration-200 bg-primary/5 border-primary/20 cursor-grab active:cursor-grabbing ${className} ${
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
                {/* Order Number */}
                <div className="absolute top-2 left-2">
                    <span className="text-xs text-primary/60 font-mono bg-primary/10 backdrop-blur-sm px-1.5 py-0.5 rounded">
                        {topic.order}
                    </span>
                </div>

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
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                    <h3 className="text-xl font-semibold text-primary mb-2 break-words hyphens-auto max-w-full">
                        {topic.name}
                    </h3>
                    {topic.description && (
                        <p className="text-sm text-muted-foreground leading-relaxed break-words hyphens-auto max-w-full">
                            {topic.description}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
} 