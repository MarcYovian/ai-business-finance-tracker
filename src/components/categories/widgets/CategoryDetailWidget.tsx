'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Pencil,
  BarChart2,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Layers,
  Calendar,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { SelectedCategoryAnalytics, CategoryWithAnalytics } from '../types';
import { getCategoryIcon, SUBCATEGORY_PALETTE } from '../constants';
import { formatCurrency } from '@/lib/currency';
import { format } from 'date-fns';

interface CategoryDetailWidgetProps {
  analytics: SelectedCategoryAnalytics;
  onEditCategory: (category: CategoryWithAnalytics) => void;
}

export const CategoryDetailWidget: React.FC<CategoryDetailWidgetProps> = ({
  analytics,
  onEditCategory,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'subcategories' | 'recent'>('overview');
  const [subchartMode, setSubchartMode] = useState<'stacked' | 'grouped'>('stacked');

  const {
    category,
    subcategories,
    totalSpentThisMonth,
    percentageChange,
    transactionsThisMonthCount,
    monthlyTrend,
    subcategoriesMonthlyTrend,
    recentTransactions,
  } = analytics;

  if (!category) {
    return (
      <Card className="rounded-2xl border border-[#EDF1EB] bg-white shadow-xs p-6 text-center text-[#8B968D]">
        <Layers className="h-10 w-10 mx-auto mb-2 text-[#C8D1CA]" />
        <p className="text-[14px]">Select a category from the list to view details.</p>
      </Card>
    );
  }

  const CategoryIcon = getCategoryIcon(category.icon);
  const isIncome = category.type === 'income';
  const isPositiveChange = percentageChange >= 0;

  // Chart data formatting for Y-axis (e.g. 500K, 1M, 2M)
  const formatYAxis = (cents: number) => {
    const val = cents / 100;
    if (val >= 1000000) return `${(val / 1000000).toFixed(val % 1000000 === 0 ? 0 : 1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`;
    return `${val}`;
  };

  return (
    <Card className="rounded-2xl border border-[#EDF1EB] bg-white shadow-xs">
      <CardHeader className="p-3.5 sm:p-5 pb-3">
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
            {/* Category Icon */}
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: category.color ? `${category.color}1F` : isIncome ? '#EDF8E8' : '#FFF7ED',
                color: category.color || (isIncome ? '#529E42' : '#EA580C'),
              }}
            >
              <CategoryIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h3 className="text-[16px] sm:text-[17px] font-bold text-[#161F18] leading-tight truncate">
                  {category.name}
                </h3>
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-medium shrink-0 ${
                    isIncome
                      ? 'bg-[#EDF8E8] text-[#529E42]'
                      : 'bg-[#FEECEC] text-[#DE4436]'
                  }`}
                >
                  {isIncome ? 'Income' : 'Expense'}
                </span>
              </div>

              <p className="text-[11px] sm:text-[12px] text-[#737E75] mt-1 leading-relaxed line-clamp-2 sm:line-clamp-none max-w-sm">
                {category.description || 'No description provided for this category.'}
              </p>
            </div>
          </div>

          {/* Edit Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEditCategory(category)}
            className="h-8 w-8 p-0 text-[#8B968D] hover:text-[#161F18] rounded-lg shrink-0"
          >
            <Pencil className="w-4 h-4" />
          </Button>
        </div>

        {/* Tabs Bar with overflow horizontal scroll on mobile */}
        <div className="pt-3 border-b border-[#EDF1EB] overflow-x-auto scrollbar-none">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as 'overview' | 'subcategories' | 'recent')}
            className="w-full"
          >
            <TabsList className="bg-transparent p-0 h-auto gap-3 sm:gap-4 flex whitespace-nowrap min-w-max">
              <TabsTrigger
                value="overview"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#161F18] data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:font-semibold text-xs sm:text-[13px] px-1 pb-2 pt-0 text-[#737E75] data-[state=active]:text-[#161F18]"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="subcategories"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#161F18] data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:font-semibold text-xs sm:text-[13px] px-1 pb-2 pt-0 text-[#737E75] data-[state=active]:text-[#161F18]"
              >
                Subcategories ({subcategories.length})
              </TabsTrigger>
              <TabsTrigger
                value="recent"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#161F18] data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:font-semibold text-xs sm:text-[13px] px-1 pb-2 pt-0 text-[#737E75] data-[state=active]:text-[#161F18]"
              >
                Recent Transactions
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent className="p-3.5 sm:p-5 pt-3">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* 2 Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Total Spent / Earned This Month */}
              <div className="p-3.5 rounded-xl border border-[#EDF1EB] bg-[#FAFBF9]">
                <span className="text-[11px] font-medium text-[#737E75] block leading-tight">
                  {isIncome ? 'Total Earned (This Month)' : 'Total Spent (This Month)'}
                </span>
                <div className="text-[18px] sm:text-[20px] font-bold text-[#161F18] my-1 leading-tight">
                  {formatCurrency(totalSpentThisMonth)}
                </div>
                <div className="flex items-center gap-1 text-[11px] font-medium">
                  {isPositiveChange ? (
                    <ArrowUpRight className="w-3.5 h-3.5 text-[#529E42]" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5 text-[#DE4436]" />
                  )}
                  <span className={isPositiveChange ? 'text-[#529E42]' : 'text-[#DE4436]'}>
                    {Math.abs(percentageChange)}%
                  </span>
                  <span className="text-[#8B968D] font-normal">from last month</span>
                </div>
              </div>

              {/* Transactions Count */}
              <div className="p-3.5 rounded-xl border border-[#EDF1EB] bg-[#FAFBF9] flex items-center justify-between">
                <div>
                  <div className="text-[20px] sm:text-[22px] font-bold text-[#161F18] leading-tight">
                    {transactionsThisMonthCount}
                  </div>
                  <span className="text-[12px] font-medium text-[#737E75]">
                    Transactions
                  </span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#FEF2F2] text-[#EF4444] flex items-center justify-center">
                  <BarChart2 className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Monthly Trend Bar Chart */}
            <div className="pt-2">
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrend} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <XAxis
                      dataKey="label"
                      stroke="#8B968D"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#EDF1EB' }}
                    />
                    <YAxis
                      stroke="#8B968D"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={formatYAxis}
                    />
                    <Tooltip
                      cursor={{ fill: '#F6F8F5' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white border border-[#E2E8DF] p-2.5 rounded-xl shadow-md text-[12px]">
                              <p className="font-semibold text-[#161F18]">{data.label}</p>
                              <p className="text-[#529E42] font-bold mt-0.5">
                                {formatCurrency(data.amount)}
                              </p>
                              <p className="text-[#737E75] text-[11px]">
                                {data.transactionCount} transactions
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar
                      dataKey="amount"
                      fill="#CBE8BA"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={32}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SUBCATEGORIES - Monthly Chart per Subcategory & Tooltip */}
        {activeTab === 'subcategories' && (
          <div className="space-y-4">
            {subcategories.length === 0 ? (
              <p className="text-[13px] text-[#8B968D] py-6 text-center">
                No subcategories added to this category yet.
              </p>
            ) : (
              <>
                {/* Chart Header & Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
                  <div>
                    <span className="text-[12px] font-semibold text-[#161F18] block">
                      Tren Bulanan per Subkategori
                    </span>
                    <span className="text-[11px] text-[#737E75]">
                      Arahkan kursor pada bar untuk melihat rincian per subkategori
                    </span>
                  </div>

                  {/* Mode Toggle: Stacked vs Grouped */}
                  <div className="flex items-center gap-1 bg-[#F4F6F2] p-1 rounded-xl self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setSubchartMode('stacked')}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                        subchartMode === 'stacked'
                          ? 'bg-white text-[#161F18] shadow-xs'
                          : 'text-[#6E7B71] hover:text-[#161F18]'
                      }`}
                    >
                      Stacked
                    </button>
                    <button
                      type="button"
                      onClick={() => setSubchartMode('grouped')}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                        subchartMode === 'grouped'
                          ? 'bg-white text-[#161F18] shadow-xs'
                          : 'text-[#6E7B71] hover:text-[#161F18]'
                      }`}
                    >
                      Grouped
                    </button>
                  </div>
                </div>

                {/* Multi-Subcategory Bar Chart */}
                <div className="h-48 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={subcategoriesMonthlyTrend}
                      margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                    >
                      <XAxis
                        dataKey="label"
                        stroke="#8B968D"
                        fontSize={11}
                        tickLine={false}
                        axisLine={{ stroke: '#EDF1EB' }}
                      />
                      <YAxis
                        stroke="#8B968D"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={formatYAxis}
                      />
                      <Tooltip
                        cursor={{ fill: '#F6F8F5' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const row = payload[0].payload;
                            return (
                              <div className="bg-white border border-[#E2E8DF] p-3 rounded-xl shadow-lg text-[12px] min-w-[210px] space-y-2 z-50">
                                <div className="flex items-center justify-between border-b border-[#EDF1EB] pb-1.5">
                                  <span className="font-bold text-[#161F18]">
                                    {row.monthName || row.label}
                                  </span>
                                  <span className="text-[11px] font-bold text-[#529E42] bg-[#EDF8E8] px-1.5 py-0.5 rounded">
                                    {formatCurrency(row.total)}
                                  </span>
                                </div>

                                <div className="space-y-1.5">
                                  {subcategories.map((sub, idx) => {
                                    const color =
                                      sub.color || SUBCATEGORY_PALETTE[idx % SUBCATEGORY_PALETTE.length];
                                    const amount = Number(row[sub.id]) || 0;
                                    const count = Number(row[`${sub.id}_count`]) || 0;

                                    return (
                                      <div
                                        key={sub.id}
                                        className="flex items-center justify-between gap-3 text-[11px]"
                                      >
                                        <div className="flex items-center gap-1.5 min-w-0">
                                          <span
                                            className="w-2.5 h-2.5 rounded-full shrink-0"
                                            style={{ backgroundColor: color }}
                                          />
                                          <span className="text-[#364238] font-medium truncate max-w-[110px]">
                                            {sub.name}
                                          </span>
                                        </div>
                                        <div className="text-right shrink-0">
                                          <span className="font-semibold text-[#161F18] block">
                                            {formatCurrency(amount)}
                                          </span>
                                          <span className="text-[10px] text-[#8B968D]">
                                            {count} transaksi
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />

                      {/* Render a Bar for each subcategory */}
                      {subcategories.map((sub, idx) => {
                        const color =
                          sub.color || SUBCATEGORY_PALETTE[idx % SUBCATEGORY_PALETTE.length];

                        return (
                          <Bar
                            key={sub.id}
                            dataKey={sub.id}
                            name={sub.name}
                            fill={color}
                            stackId={subchartMode === 'stacked' ? 'subcategories' : undefined}
                            radius={
                              subchartMode === 'stacked'
                                ? idx === subcategories.length - 1
                                  ? [4, 4, 0, 0]
                                  : [0, 0, 0, 0]
                                : [4, 4, 0, 0]
                            }
                            maxBarSize={subchartMode === 'stacked' ? 32 : 18}
                          />
                        );
                      })}
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Subcategories Legend & Summary Chips */}
                <div className="pt-2 border-t border-[#EDF1EB]">
                  <div className="flex items-center gap-2 flex-wrap">
                    {subcategories.map((sub, idx) => {
                      const color =
                        sub.color || SUBCATEGORY_PALETTE[idx % SUBCATEGORY_PALETTE.length];

                      return (
                        <div
                          key={sub.id}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-[#EDF1EB] bg-[#FAFBF9] text-[11px]"
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: color }}
                          />
                          <span className="font-medium text-[#161F18]">{sub.name}</span>
                          <span className="text-[#8B968D] ml-0.5 font-semibold">
                            ({formatCurrency(sub.totalAmount)})
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 3: RECENT TRANSACTIONS */}
        {activeTab === 'recent' && (
          <div className="space-y-2">
            {recentTransactions.length === 0 ? (
              <p className="text-[13px] text-[#8B968D] py-6 text-center">
                No transactions recorded for this category yet.
              </p>
            ) : (
              recentTransactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-[#EDF1EB] bg-[#FAFBF9]"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-white border border-[#E2E8DF] flex items-center justify-center shrink-0 text-[#737E75]">
                      <Receipt className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[13px] font-medium text-[#161F18] block truncate leading-tight">
                        {tx.description}
                      </span>
                      <span className="text-[11px] text-[#8B968D] block leading-tight mt-0.5">
                        {tx.transactionDate ? format(new Date(tx.transactionDate), 'dd MMM yyyy') : '-'}
                      </span>
                    </div>
                  </div>

                  <span
                    className={`text-[13px] font-semibold shrink-0 ml-2 ${
                      tx.type === 'income' ? 'text-[#529E42]' : 'text-[#DE4436]'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}
                    {formatCurrency(tx.amount)}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
