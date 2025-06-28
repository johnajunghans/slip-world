import { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Icon } from '@/components/icon';
import { GripVertical } from 'lucide-react';
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
}

export function SlipCard({ 
    slip, 
    className, 
    isDragging = false,
    onDragStart,
    onDragEnd 
}: SlipCardProps) {
    const ref = useRef<HTMLDivElement>(null);
    const dragHandleRef = useRef<HTMLDivElement>(null);
    const [isDraggedOver, setIsDraggedOver] = useState(false);

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

    return (
        <Card 
            ref={ref}
            className={`transition-all duration-200 ${className} ${
                isDragging ? 'opacity-50 scale-95' : ''
            } ${
                isDraggedOver ? 'ring-2 ring-primary/50 ring-offset-2' : ''
            }`}
        >
            <CardContent className="relative flex items-center min-h-[200px] p-6">
                {/* Drag Handle */}
                <div
                    ref={dragHandleRef}
                    className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing opacity-30 hover:opacity-60 transition-opacity"
                    aria-label="Drag to reorder"
                >
                    <Icon iconNode={GripVertical} className="h-5 w-5 text-muted-foreground" />
                </div>
                
                {/* Content */}
                <div className="flex-1 flex items-center justify-center pl-6">
                    <p className="text-center text-base leading-relaxed">
                        {slip.content}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
} 