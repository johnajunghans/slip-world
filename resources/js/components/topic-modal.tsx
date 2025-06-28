import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useForm } from '@inertiajs/react';
import { type Topic } from '@/types';

interface TopicModalProps {
    topic?: Topic | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    trigger?: React.ReactNode;
    insertOrder?: number;
}

export function TopicModal({ 
    topic, 
    isOpen, 
    onOpenChange, 
    trigger, 
    insertOrder 
}: TopicModalProps) {
    const { data, setData, post, patch, processing, errors, reset } = useForm({
        name: topic?.name || '',
        description: topic?.description || '',
        order: insertOrder || undefined,
    });

    // Update form data when topic prop or insertOrder changes
    useEffect(() => {
        if (topic) {
            setData({
                name: topic.name,
                description: topic.description || '',
                order: undefined, // Don't set order when editing
            });
        } else {
            setData({
                name: '',
                description: '',
                order: insertOrder || undefined,
            });
        }
    }, [topic, insertOrder]);

    const isEditing = !!topic;

    const handleSave = () => {
        if (isEditing) {
            patch(`/topics/${topic.id}`, {
                onSuccess: () => {
                    onOpenChange(false);
                },
            });
        } else {
            post('/topics', {
                onSuccess: () => {
                    reset();
                    setData({
                        name: '',
                        description: '',
                        order: insertOrder || undefined,
                    });
                    onOpenChange(false);
                },
            });
        }
    };

    const handleCancel = () => {
        if (isEditing) {
            setData({
                name: topic.name,
                description: topic.description || '',
                order: undefined,
            });
        } else {
            reset();
            setData({
                name: '',
                description: '',
                order: insertOrder || undefined,
            });
        }
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            {trigger && (
                <DialogTrigger asChild>
                    {trigger}
                </DialogTrigger>
            )}
            <DialogContent className="max-w-md p-0 gap-0">
                <div className="p-6">
                    <div className="mb-6">
                        <h2 className="text-lg font-semibold mb-4">
                            {isEditing ? 'Edit Topic' : 'Create New Topic'}
                        </h2>
                        
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="topic-name">Topic Name</Label>
                                <Input
                                    id="topic-name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Enter topic name..."
                                    autoFocus
                                    className="mt-1"
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive mt-1">{errors.name}</p>
                                )}
                            </div>
                            
                            <div>
                                <Label htmlFor="topic-description">Description (Optional)</Label>
                                <Textarea
                                    id="topic-description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Enter topic description..."
                                    rows={3}
                                    className="mt-1"
                                />
                                {errors.description && (
                                    <p className="text-sm text-destructive mt-1">{errors.description}</p>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={handleCancel}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={!data.name.trim() || processing}>
                            {isEditing ? 'Update Topic' : 'Create Topic'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
} 