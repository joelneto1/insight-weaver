import { cn } from "@/lib/utils";

interface SkeletonCardProps {
    className?: string;
    lines?: number;
}

function Shimmer({ className }: { className?: string }) {
    return (
        <div className={cn("animate-pulse rounded-md bg-muted/60", className)} />
    );
}

export function SkeletonStatCard() {
    return (
        <div className="bg-card border border-border/50 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between">
                <Shimmer className="h-3 w-20" />
                <Shimmer className="h-10 w-10 rounded-xl" />
            </div>
            <Shimmer className="h-8 w-16" />
            <Shimmer className="h-3 w-24" />
        </div>
    );
}

export function SkeletonChannelCard() {
    return (
        <div className="bg-card border border-border/50 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-3">
                <Shimmer className="w-10 h-10 rounded-full" />
                <div className="space-y-2 flex-1">
                    <Shimmer className="h-4 w-24" />
                    <Shimmer className="h-3 w-16" />
                </div>
            </div>
            <div className="flex justify-between items-end">
                <div className="space-y-1">
                    <Shimmer className="h-7 w-12" />
                    <Shimmer className="h-2 w-16" />
                </div>
                <Shimmer className="h-6 w-20 rounded-full" />
            </div>
        </div>
    );
}

export function SkeletonListItem() {
    return (
        <div className="flex items-center gap-4 py-3">
            <Shimmer className="w-9 h-9 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
                <Shimmer className="h-4 w-3/4" />
                <Shimmer className="h-3 w-1/2" />
            </div>
            <div className="space-y-1">
                <Shimmer className="h-3 w-16 ml-auto" />
                <Shimmer className="h-5 w-14 rounded-full ml-auto" />
            </div>
        </div>
    );
}

export function SkeletonChart() {
    return (
        <div className="bg-card border border-border/50 rounded-xl p-6 space-y-4">
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <Shimmer className="h-5 w-40" />
                    <Shimmer className="h-3 w-56" />
                </div>
            </div>
            <Shimmer className="h-[220px] w-full rounded-lg" />
        </div>
    );
}

export default function SkeletonCard({ className, lines = 3 }: SkeletonCardProps) {
    return (
        <div className={cn("bg-card border border-border/50 rounded-xl p-5 space-y-3", className)}>
            {Array.from({ length: lines }).map((_, i) => (
                <Shimmer key={i} className={cn("h-4", i === 0 ? "w-3/4" : i === 1 ? "w-1/2" : "w-full")} />
            ))}
        </div>
    );
}
