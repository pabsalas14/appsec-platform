import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton shown while a heavy dashboard route segment loads (FASE 0 performance).
 */
export default function SegmentLoading() {
  return (
    <div className="min-h-[50vh] space-y-6 bg-dashboard-canvas p-6 text-foreground">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-9 w-64 max-w-full rounded-md bg-white/[0.08]" />
        <Skeleton className="h-4 w-[min(100%,28rem)] max-w-full rounded-md bg-white/[0.06]" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Card
            key={i}
            className="border-dashboard-border bg-dashboard-surface/80 backdrop-blur-sm"
          >
            <CardContent className="space-y-3 pt-6">
              <Skeleton className="h-4 w-24 rounded-md bg-white/[0.08]" />
              <Skeleton className="h-8 w-16 rounded-md bg-white/[0.1]" />
              <Skeleton className="h-3 w-full rounded-md bg-white/[0.05]" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Skeleton className="h-72 w-full max-w-full rounded-xl bg-white/[0.06]" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full rounded-md bg-white/[0.05]" />
        <Skeleton className="h-4 w-[95%] rounded-md bg-white/[0.05]" />
        <Skeleton className="h-4 w-[88%] rounded-md bg-white/[0.05]" />
      </div>
    </div>
  );
}
