"server-only";

import { NextResponse } from "next/server";
import { saveMeal } from "@/lib/actions/food-actions";

export async function POST(req: Request) {
  const meal = await req.json();
  const result = await saveMeal(meal);
  return NextResponse.json(result);
}
