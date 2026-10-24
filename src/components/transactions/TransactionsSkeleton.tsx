import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export function TransactionsSkeleton() {
  return (
    <div className="p-3.5 sm:p-6 lg:p-7 space-y-4 sm:space-y-6 max-w-[1600px] mx-auto">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-44 rounded-xl" />
          <Skeleton className="h-4 w-72 rounded-lg" />
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-10 w-28 rounded-xl" />
          <Skeleton className="h-10 w-36 rounded-xl" />
        </div>
      </div>

      {/* Top 3 Stat Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 sm:gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="rounded-2xl border border-[#EDF1EB] bg-white shadow-xs p-5">
            <CardContent className="p-0 flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <Skeleton className="w-12 h-12 rounded-xl" />
                <div className="space-y-1.5">
                  <Skeleton className="h-3 w-20 rounded-md" />
                  <Skeleton className="h-6 w-32 rounded-lg" />
                  <Skeleton className="h-3 w-24 rounded-md" />
                </div>
              </div>
              <Skeleton className="w-16 h-8 rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Skeleton (Table + Filter) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start">
        {/* Table Widget Skeleton */}
        <div className="lg:col-span-8 xl:col-span-9 space-y-4">
          <Card className="rounded-2xl border border-[#EDF1EB] bg-white shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between gap-4 border-b border-[#EDF1EB] pb-4">
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4].map((t) => (
                  <Skeleton key={t} className="h-8 w-16 rounded-lg" />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-40 rounded-xl" />
                <Skeleton className="h-9 w-20 rounded-xl" />
              </div>
            </div>

            <div className="space-y-3 pt-1">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 py-3 border-b border-[#EDF1EB]">
                  <Skeleton className="w-4 h-4 rounded-md" />
                  <Skeleton className="h-4 w-20 rounded-md" />
                  <Skeleton className="w-8 h-8 rounded-xl" />
                  <div className="space-y-1 flex-1">
                    <Skeleton className="h-4 w-28 rounded-md" />
                    <Skeleton className="h-3 w-16 rounded-md" />
                  </div>
                  <Skeleton className="h-6 w-24 rounded-full" />
                  <Skeleton className="h-4 w-24 rounded-md" />
                  <Skeleton className="h-4 w-20 rounded-md" />
                  <Skeleton className="w-6 h-6 rounded-md" />
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-3">
              <Skeleton className="h-4 w-40 rounded-md" />
              <div className="flex gap-1.5">
                <Skeleton className="w-7 h-7 rounded-lg" />
                <Skeleton className="w-7 h-7 rounded-lg" />
                <Skeleton className="w-7 h-7 rounded-lg" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filter Widget Skeleton (Desktop only) */}
        <div className="hidden lg:block lg:col-span-4 xl:col-span-3">
          <Card className="rounded-2xl border border-[#EDF1EB] bg-white shadow-xs p-5 space-y-4">
            <Skeleton className="h-9 w-full rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-20 rounded-md" />
              <Skeleton className="h-9 w-full rounded-xl" />
              <div className="grid grid-cols-2 gap-2">
                <Skeleton className="h-8 w-full rounded-lg" />
                <Skeleton className="h-8 w-full rounded-lg" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-28 rounded-md" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-4 w-24 rounded-md" />
              </div>
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3 w-16 rounded-md" />
              <Skeleton className="h-9 w-full rounded-xl" />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
