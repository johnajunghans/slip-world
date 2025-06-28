import { SlipCard } from '@/components/slip-card';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Slip, type Category } from '@/types';
import { Head, usePage } from '@inertiajs/react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
];



interface DashboardProps {
    slips: Slip[];
    categories: Category[];
}

export default function Dashboard({ slips, categories }: DashboardProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 gap-6 p-4 overflow-hidden">
                {/* Left half - Vertical carousel of slip cards */}
                <div className="flex-1 overflow-y-auto">
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold mb-4">Your Slips</h2>
                        {slips.length > 0 ? (
                            slips.map((slip) => (
                                <SlipCard 
                                    key={slip.id} 
                                    slip={slip}
                                    className="w-full"
                                />
                            ))
                        ) : (
                            <div className="flex items-center justify-center min-h-[400px] border border-dashed border-sidebar-border/70 rounded-xl">
                                <p className="text-muted-foreground">No slips yet. Create your first slip to get started!</p>
                            </div>
                        )}
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
