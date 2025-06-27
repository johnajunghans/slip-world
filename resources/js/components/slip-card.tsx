import { Card, CardContent } from '@/components/ui/card';
import { type Slip } from '@/types';

interface SlipCardProps {
    slip: Slip;
    className?: string;
}

export function SlipCard({ slip, className }: SlipCardProps) {
    return (
        <Card className={className}>
            <CardContent className="flex items-center justify-center min-h-[200px] p-6">
                <p className="text-center text-base leading-relaxed">
                    {slip.content}
                </p>
            </CardContent>
        </Card>
    );
} 