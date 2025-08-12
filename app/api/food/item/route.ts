"server-only";
import { NextResponse } from "next/server";
import { removeMealItem } from "@/lib/actions/food-actions";

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("id");
  if (!itemId) {
    return NextResponse.json(
      { success: false, error: "Missing itemId" },
      { status: 400 }
    );
  }

  const result = await removeMealItem(itemId);
  return NextResponse.json(result);
}
