import { SlipCard } from '@/components/slip-card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Slip } from '@/types';
import { Head } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];

// Mock slip data for testing
const mockSlips: Slip[] = [
    {
        id: 1,
        content: "The best way to predict the future is to create it.",
        order: 1,
        category_id: 1,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
        category: {
            id: 1,
            user_id: 1,
            name: "Inspiration",
            description: "Motivational quotes",
            created_at: "2025-01-01T00:00:00Z",
            updated_at: "2025-01-01T00:00:00Z",
        }
    },
    {
        id: 2,
        content: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
        order: 2,
        category_id: 1,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
    },
    {
        id: 3,
        content: "The only impossible journey is the one you never begin.",
        order: 3,
        category_id: 2,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
    },
    {
        id: 4,
        content: "In the middle of difficulty lies opportunity.",
        order: 4,
        category_id: 2,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
    },
    {
        id: 5,
        content: "It does not matter how slowly you go as long as you do not stop.",
        order: 5,
        category_id: 1,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
    },
    {
        id: 6,
        content: "Everything you've ever wanted is on the other side of fear.",
        order: 6,
        category_id: 3,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
    },
    {
        id: 7,
        content: "Believe you can and you're halfway there.",
        order: 7,
        category_id: 3,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
    },
    {
        id: 8,
        content: "The future belongs to those who believe in the beauty of their dreams.",
        order: 8,
        category_id: 1,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
    },
    {
        id: 9,
        content: "It is during our darkest moments that we must focus to see the light.",
        order: 9,
        category_id: 2,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
    },
    {
        id: 10,
        content: "The way to get started is to quit talking and begin doing.",
        order: 10,
        category_id: 3,
        created_at: "2025-01-01T00:00:00Z",
        updated_at: "2025-01-01T00:00:00Z",
    },
];

export default function Dashboard() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 gap-6 p-4 overflow-hidden">
                {/* Left half - Vertical carousel of slip cards */}
                <div className="flex-1 overflow-y-auto">
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold mb-4">Your Slips</h2>
                        {mockSlips.map((slip) => (
                            <SlipCard 
                                key={slip.id} 
                                slip={slip}
                                className="w-full"
                            />
                        ))}
                    </div>
                </div>
                
                {/* Right half - Available for future content */}
                <div className="flex-1 flex items-center justify-center border border-dashed border-sidebar-border/70 rounded-xl">
                    <p className="text-muted-foreground">Right panel content goes here</p>
                </div>
            </div>
        </AppLayout>
    );
}
