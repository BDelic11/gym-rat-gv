"server-only";

import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { deleteMealTemplate } from "@/lib/actions/food-actions";

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getCurrentUser();
  if (!user)
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );

  if (!params?.id) {
    return NextResponse.json(
      { success: false, error: "Missing id" },
      { status: 400 }
    );
  }

  const res = await deleteMealTemplate(params.id);
  return NextResponse.json(res, { status: res.success ? 200 : 400 });
}
