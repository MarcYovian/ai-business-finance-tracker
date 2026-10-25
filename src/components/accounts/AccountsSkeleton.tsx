import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const AccountsSkeleton: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-7 space-y-6 animate-pulse">
      {/* Top Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40 rounded-xl" />
          <Skeleton className="h-4 w-72 rounded-lg" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-5 rounded-2xl bg-white border border-[#EDF1EB] space-y-3">
            <Skeleton className="w-10 h-10 rounded-xl" />
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-7 w-36 rounded-lg" />
            <div className="flex items-center justify-between pt-2">
              <Skeleton className="h-4 w-28 rounded-md" />
              <Skeleton className="h-5 w-14 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Left 8 cols, Right 4 cols */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Your Accounts & 2 Bottom Widgets */}
        <div className="lg:col-span-8 space-y-5">
          <div className="p-5 rounded-2xl bg-white border border-[#EDF1EB] space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-36 rounded-lg" />
              <Skeleton className="h-7 w-56 rounded-lg" />
            </div>
            <div className="space-y-3 pt-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-5 rounded-2xl bg-white border border-[#EDF1EB] h-72">
              <Skeleton className="h-6 w-48 rounded-lg mb-4" />
              <Skeleton className="h-52 w-full rounded-xl" />
            </div>
            <div className="p-5 rounded-2xl bg-white border border-[#EDF1EB] h-72">
              <Skeleton className="h-6 w-48 rounded-lg mb-4" />
              <Skeleton className="h-52 w-full rounded-xl" />
            </div>
          </div>
        </div>

        {/* Right Column: Balance Distribution & Recent Transactions */}
        <div className="lg:col-span-4 space-y-5">
          <div className="p-5 rounded-2xl bg-white border border-[#EDF1EB] h-80">
            <Skeleton className="h-6 w-44 rounded-lg mb-4" />
            <Skeleton className="h-60 w-full rounded-xl" />
          </div>
          <div className="p-5 rounded-2xl bg-white border border-[#EDF1EB] h-96">
            <Skeleton className="h-6 w-44 rounded-lg mb-4" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
