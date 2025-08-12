"use client";

import { Card } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function WeightChart({
  data,
}: {
  data: { date: string; weight: number }[];
}) {
  if (!data.length) {
    return (
      <Card className="p-6 mt-6">
        <p className="text-sm text-muted-foreground">No weight history yet.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6 mt-6">
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis className="mt-2" dataKey="date" />
            <YAxis
              domain={["auto", "auto"]}
              padding={{ top: 20, bottom: 40 }}
            />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#facc15"
              strokeWidth={2}
              dot
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
