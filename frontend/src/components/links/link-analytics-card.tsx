"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  linkApi,
  DailyClick,
  ReferrerClick,
  MonthlyClick,
  CountryClick,
} from "@/lib/api";
import { ChartAreaInteractive } from "@/components/ui/chart-area-interactive";
import { ChartPieLabelList } from "@/components/ui/chart-pie-label-list";
import { ChartRadarDefault } from "@/components/ui/chart-radar-default";
import { ChartBarHorizontal } from "@/components/ui/chart-bar-horizontal";

interface LinkAnalyticsCardProps {
  linkId: string | null;
}

export const LinkAnalyticsCard = ({ linkId }: LinkAnalyticsCardProps) => {
  // Fetch daily clicks
  const {
    data: dailyClicks,
    isLoading: isLoadingDaily,
    isError: isErrorDaily,
  } = useQuery<DailyClick[]> ({
    queryKey: ["link-analytics-daily", linkId],
    queryFn: () => linkApi.getDailyClicks(linkId as string),
    enabled: !!linkId, // Only fetch when linkId is provided
  });

  // Fetch referrer clicks
  const {
    data: referrerClicks,
    isLoading: isLoadingReferrer,
    isError: isErrorReferrer,
  } = useQuery<ReferrerClick[]>({
    queryKey: ["link-analytics-referrer", linkId],
    queryFn: () => linkApi.getReferrerClicks(linkId as string),
    enabled: !!linkId,
  });

  // Fetch monthly clicks
  const {
    data: monthlyClicks,
    isLoading: isLoadingMonthly,
    isError: isErrorMonthly,
  } = useQuery<MonthlyClick[]>({
    queryKey: ["link-analytics-monthly", linkId],
    queryFn: () => linkApi.getMonthlyClicks(linkId as string),
    enabled: !!linkId,
  });

  // Fetch country clicks
  const {
    data: countryClicks,
    isLoading: isLoadingCountry,
    isError: isErrorCountry,
  } = useQuery<CountryClick[]>({
    queryKey: ["link-analytics-country", linkId],
    queryFn: () => linkApi.getCountryClicks(linkId as string),
    enabled: !!linkId,
  });

  const hasError = isErrorDaily || isErrorReferrer || isErrorMonthly || isErrorCountry;
  const isLoadingAny = isLoadingDaily || isLoadingReferrer || isLoadingMonthly || isLoadingCountry;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-4">
        <CardTitle>Link Analytics</CardTitle>
        <CardDescription>
          {linkId
            ? "Detailed analytics for the selected link."
            : "Select a link from the list to view its analytics."
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto">
        {!linkId ? (
          <div className="text-center text-muted-foreground py-8">
            No link selected. Click on a link to view its analytics.
          </div>
        ) : hasError ? (
          <div className="text-center text-red-500 py-8">
            Failed to load analytics data. Please try again.
          </div>
        ) : isLoadingAny ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Daily Clicks Chart */}
            <div className="flex flex-col space-y-2">
              <h3 className="font-semibold text-lg">Daily Visits</h3>
              <ChartAreaInteractive data={dailyClicks || []} />
            </div>

            {/* Referrer Clicks Chart (Pie) */}
            <div className="flex flex-col space-y-2">
              <h3 className="font-semibold text-lg">Visits by Referrer</h3>
              <ChartPieLabelList data={referrerClicks || []} />
            </div>

            {/* Monthly Clicks Chart (Radar) */}
            <div className="flex flex-col space-y-2">
              <h3 className="font-semibold text-lg">Monthly Visits</h3>
              <ChartRadarDefault data={monthlyClicks || []} />
            </div>

            {/* Country Clicks Chart (Bar) */}
            <div className="flex flex-col space-y-2">
              <h3 className="font-semibold text-lg">Top Countries</h3>
              <ChartBarHorizontal data={countryClicks || []} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 