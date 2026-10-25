import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const BudgetSkeleton: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-7 space-y-5 max-w-[1600px] mx-auto animate-pulse">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Skeleton className="h-9 w-40 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
      </div>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-[#E7EBE4] p-3.5 sm:p-5 flex items-center gap-3 sm:gap-4">
            <Skeleton className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3.5 w-20 rounded-md" />
              <Skeleton className="h-6 w-28 rounded-md" />
              <Skeleton className="h-3 w-24 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* Left Column */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4 sm:space-y-5">
          <div className="bg-white rounded-2xl border border-[#E7EBE4] p-4 sm:p-5 space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-5 w-40 rounded-md" />
              <Skeleton className="h-7 w-20 rounded-md" />
            </div>
            <Skeleton className="h-[230px] sm:h-[270px] w-full rounded-xl" />
          </div>

          <div className="bg-white rounded-2xl border border-[#E7EBE4] p-4 sm:p-5 space-y-4">
            <Skeleton className="h-5 w-36 rounded-md" />
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4 sm:space-y-5">
          <div className="bg-white rounded-2xl border border-[#E7EBE4] p-4 sm:p-5 space-y-4">
            <Skeleton className="h-5 w-36 rounded-md" />
            <div className="h-[180px] flex items-center justify-center">
              <Skeleton className="w-36 h-36 rounded-full" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E7EBE4] p-5 space-y-3">
            <Skeleton className="h-5 w-40 rounded-md" />
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-9 w-full rounded-lg" />
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-[#E7EBE4] p-5 space-y-3">
            <Skeleton className="h-5 w-36 rounded-md" />
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
