import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { addTemplateToToday } from "@/lib/actions/food-actions";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  let body: { templateId?: string } | undefined;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const templateId = body?.templateId;
  if (!templateId) {
    return NextResponse.json(
      { success: false, error: "Missing templateId" },
      { status: 400 }
    );
  }

  try {
    const result = await addTemplateToToday(templateId); // server action you already have
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err: any) {
    console.error("use template error:", err);
    return NextResponse.json(
      { success: false, error: err?.message ?? "Failed to use template" },
      { status: 500 }
    );
  }
}
