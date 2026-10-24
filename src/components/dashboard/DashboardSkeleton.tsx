import { Layout } from '@/components/Layout';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardSkeleton() {
  return (
    <Layout>
      <div className="p-4 sm:p-6 lg:p-7 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 space-y-5">
            <Skeleton className="h-[280px] w-full rounded-2xl bg-white/70" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Skeleton className="h-[140px] w-full rounded-2xl bg-white/70" />
              <Skeleton className="h-[140px] w-full rounded-2xl bg-white/70" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <Skeleton className="h-[240px] w-full rounded-2xl bg-white/70" />
              <Skeleton className="h-[240px] w-full rounded-2xl bg-white/70" />
              <Skeleton className="h-[240px] w-full rounded-2xl bg-white/70" />
            </div>
          </div>
          <div className="lg:col-span-4 space-y-5">
            <Skeleton className="h-[360px] w-full rounded-2xl bg-white/70" />
            <Skeleton className="h-[420px] w-full rounded-2xl bg-white/70" />
          </div>
        </div>
      </div>
    </Layout>
  );
}
