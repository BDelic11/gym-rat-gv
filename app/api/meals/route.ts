"server-only";

import { NextResponse } from "next/server";
import { getMeals } from "@/lib/actions/food-actions";

export async function GET() {
  const result = await getMeals();
  return NextResponse.json(result);
}
