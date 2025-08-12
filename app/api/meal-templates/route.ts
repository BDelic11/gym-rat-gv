import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  listMealTemplates,
  saveMealTemplate,
} from "@/lib/actions/food-actions";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );

  const { searchParams } = new URL(req.url);
  const type = (searchParams.get("type") || "LUNCH") as any;

  const res = await listMealTemplates(type);
  return NextResponse.json(res, { status: res.success ? 200 : 400 });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );

  const { meal, name } = await req.json();
  const res = await saveMealTemplate(meal, name);
  return NextResponse.json(res, { status: res.success ? 200 : 400 });
}
