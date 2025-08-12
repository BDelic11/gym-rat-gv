"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Trophy, Flame } from "lucide-react";
import React from "react";

type Props = {
  proteinYesterday: number;
  targetProtein: number;
  netYesterday: number;
  targetCalories: number;
  hitProteinYesterday: boolean;
  hitCaloriesYesterday: boolean;
  currentStreak: number;
  bestStreak: number;
  praise: string;
};

export function AchievementsCard(props: Props) {
  const {
    proteinYesterday,
    targetProtein,
    netYesterday,
    targetCalories,
    hitProteinYesterday,
    hitCaloriesYesterday,
    currentStreak,
    bestStreak,
    praise,
  } = props;

  const Row = ({
    ok,
    label,
    detail,
  }: {
    ok: boolean;
    label: string;
    detail?: string;
  }) => (
    <div className="flex items-center justify-between rounded-md border p-3">
      <div className="flex items-center gap-2">
        {ok ? (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500" />
        )}
        <span className="text-sm">{label}</span>
      </div>
      {detail && (
        <span className="text-xs text-muted-foreground">{detail}</span>
      )}
    </div>
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          Yesterday & Streaks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Row
          ok={hitProteinYesterday}
          label="Protein target hit"
          detail={`${proteinYesterday} / ${targetProtein} g`}
        />
        <Row
          ok={hitCaloriesYesterday}
          label="Stayed under calories"
          detail={`${netYesterday} / ${targetCalories} kcal`}
        />

        <div className="flex items-center justify-between rounded-md bg-muted p-3">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4" />
            <div className="text-sm">
              <div className="font-medium">Current streak</div>
              <div className="text-xs text-muted-foreground">
                Best (30d): {bestStreak} days
              </div>
            </div>
          </div>
          <Badge variant="secondary">{currentStreak} days</Badge>
        </div>

        <div className="text-sm text-muted-foreground">{praise}</div>
      </CardContent>
    </Card>
  );
}
