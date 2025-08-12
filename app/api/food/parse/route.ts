"server-only";

import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { parseFoodText } from "@/lib/actions/food-actions";

const BodySchema = z.object({
  text: z.string().min(1, "text is required"),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK", "MID_MEAL"]),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid request body",
        details: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const { text, mealType } = parsed.data;

  try {
    // Pozovi postojeću logiku koja zove OpenAI i validira Zodom
    const result = await parseFoodText(text, mealType);

    // Ako tvoja server action vraća { success, meal?, error? }:
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err: any) {
    console.error("parse route error:", err);
    return NextResponse.json(
      { success: false, error: err?.message ?? "Parse failed" },
      { status: 500 }
    );
  }
}
