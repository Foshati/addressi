"use client"

import { Label, Pie, PieChart } from "recharts"
import * as React from "react"
import { TrendingUp } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { ReferrerClick } from "@/lib/api"

export const description = "A pie chart with label list"

const chartConfig = {
  count: {
    label: "Clicks",
  },
} satisfies ChartConfig

interface ChartPieLabelListProps {
  data: ReferrerClick[]
}

export function ChartPieLabelList({ data }: ChartPieLabelListProps) {
  const totalClicks = data.reduce((acc, curr) => acc + curr.count, 0)

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-2">
        <CardTitle>Visits by Referrer</CardTitle>
        <CardDescription>How users are finding your link</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square h-[250px]"
        >
          <PieChart>
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Pie
              data={data}
              dataKey="count"
              nameKey="referrer"
              innerRadius={60}
              strokeWidth={5}
              startAngle={90}
              endAngle={450}
              className="[&_path]:fill-foreground"
            >
              <Label
                content={({ cx, cy, viewBox }) => {
                  if (typeof cx === "number" && typeof cy === "number" && viewBox) {
                    return (
                      <text
                        x={cx}
                        y={cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={cx}
                          y={cy}
                          className="fill-foreground text-3xl font-bold"
                        >
                          {totalClicks.toLocaleString()}
                        </tspan>
                        <tspan
                          x={cx}
                          y={cy + 24}
                          className="fill-muted-foreground"
                        >
                          Total Clicks
                        </tspan>
                      </text>
                    )
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 leading-none font-medium">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing total visitors for the last 6 months
        </div>
      </CardFooter>
    </Card>
  )
}
