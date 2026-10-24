import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const CategoriesSkeleton: React.FC = () => {
  return (
    <div className="p-3.5 sm:p-6 lg:p-7 space-y-4 sm:space-y-6 max-w-[1600px] mx-auto animate-pulse">
      {/* Top Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="space-y-2">
          <Skeleton className="h-7 sm:h-8 w-44 rounded-xl" />
          <Skeleton className="h-3.5 sm:h-4 w-60 sm:w-80 rounded-lg" />
        </div>
        <Skeleton className="h-9 sm:h-10 w-full sm:w-36 rounded-xl" />
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-3.5 sm:p-4 rounded-2xl bg-white border border-[#EDF1EB] flex items-center gap-3 sm:gap-3.5">
            <Skeleton className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl shrink-0" />
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-3 w-20 sm:w-24 rounded-md" />
              <Skeleton className="h-6 sm:h-7 w-16 rounded-md" />
              <Skeleton className="h-3 w-28 sm:w-32 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid: Left 7 cols, Right 5 cols */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
        {/* Left Column: All Categories Table */}
        <div className="lg:col-span-7 space-y-4">
          <div className="p-5 rounded-2xl bg-white border border-[#EDF1EB] space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-36 rounded-lg" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-28 rounded-xl" />
                <Skeleton className="h-9 w-40 rounded-xl" />
              </div>
            </div>
            <div className="space-y-3 pt-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Detail & Subcategories Widgets */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-5 rounded-2xl bg-white border border-[#EDF1EB] space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-xl" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-32 rounded-md" />
                <Skeleton className="h-3 w-48 rounded-md" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Skeleton className="h-20 w-full rounded-xl" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </div>
            <Skeleton className="h-44 w-full rounded-xl" />
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#EDF1EB] space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-6 w-32 rounded-lg" />
              <Skeleton className="h-8 w-32 rounded-xl" />
            </div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
