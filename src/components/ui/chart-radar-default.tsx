"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  PolarRadiusAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { MonthlyClick } from "@/lib/api";

export const description = "A default Radar chart.";

const chartConfig = {
  count: {
    label: "Clicks",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

interface ChartRadarDefaultProps {
  data: MonthlyClick[];
}

export function ChartRadarDefault({ data }: ChartRadarDefaultProps) {
  const formatMonth = (monthString: string) => {
    if (!monthString) return "";
    const [year, monthNum] = monthString.split("-");
    const date = new Date(parseInt(year), parseInt(monthNum) - 1);
    return date.toLocaleString("en-US", { month: "short", year: "2-digit" });
  };

  return (
    <Card>
      <CardHeader className="items-center pb-4">
        <CardTitle>Monthly Visits</CardTitle>
        <CardDescription>Visits per month</CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square h-[250px]"
        >
          <RadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey="month" tickFormatter={formatMonth} />
            <PolarRadiusAxis />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <Radar
              dataKey="count"
              fill="var(--color-count)"
              fillOpacity={0.6}
              stroke="var(--color-count)"
              strokeWidth={2}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
