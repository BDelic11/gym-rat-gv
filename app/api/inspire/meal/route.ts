import { NextResponse } from "next/server";
import { z } from "zod";
import { generateMealInspiration } from "@/lib/actions/inspire-actions";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

const Body = z.object({
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
  include: z.string().optional(),
  exclude: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  let data: unknown;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON" },
      { status: 400 }
    );
  }

  const parsed = Body.safeParse(data);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid body",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  try {
    const meal = await generateMealInspiration(parsed.data);
    return NextResponse.json({ success: true, meal });
  } catch (e: any) {
    console.error("inspire/meal error", e);
    return NextResponse.json(
      { success: false, error: e?.message || "Failed" },
      { status: 500 }
    );
  }
}
