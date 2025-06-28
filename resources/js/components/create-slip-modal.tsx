import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { useForm } from '@inertiajs/react';
import { type Category } from '@/types';

interface CreateSlipModalProps {
    categories: Category[];
}

export function CreateSlipModal({ categories }: CreateSlipModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    
    // Find the default UNASSIMILATED category
    const defaultCategory = categories.find(cat => cat.name === 'UNASSIMILATED');
    
    const { data, setData, post, processing, errors, reset } = useForm({
        content: '',
        category_id: defaultCategory?.id || '',
    });

    const handleSave = () => {
        post('/slips', {
            onSuccess: () => {
                reset('content');
                setData('category_id', defaultCategory?.id || '');
                setIsOpen(false);
            },
        });
    };

    const handleCancel = () => {
        reset('content');
        setData('category_id', defaultCategory?.id || '');
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    Create Slip
                    <Plus className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md p-0 gap-0">
                <div className="p-6">
                    <div className="mb-4">
                        <Select
                            value={data.category_id.toString()}
                            onValueChange={(value) => setData('category_id', parseInt(value))}
                        >
                            <SelectTrigger className="w-48">
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((category) => (
                                    <SelectItem key={category.id} value={category.id.toString()}>
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Card className="border-0 shadow-none">
                        <CardContent className="flex items-center justify-center min-h-[200px] p-6 relative">
                            <Textarea
                                value={data.content}
                                onChange={(e) => setData('content', e.target.value)}
                                placeholder="Write your slip content here..."
                                className="text-center text-base leading-relaxed border-none shadow-none resize-none bg-transparent focus-visible:ring-0 focus-visible:border-0 placeholder:text-muted-foreground/50 w-full overflow-hidden"
                                autoFocus
                                rows={6}
                            />
                        </CardContent>
                    </Card>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button variant="outline" onClick={handleCancel}>
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={!data.content.trim() || processing}>
                            Save Slip
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
} 