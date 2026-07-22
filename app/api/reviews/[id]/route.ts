import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

/** PATCH /api/reviews/:id — approve / hide a review. */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const reviewId = Number(id);
    if (!Number.isInteger(reviewId))
      return NextResponse.json({ error: "Bad id" }, { status: 400 });

    const body = await req.json().catch(() => null);
    const status = body?.status;
    if (status !== "approved" && status !== "hidden") {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const review = await prisma.review.update({
      where: { id: reviewId },
      data: { status },
    });
    return NextResponse.json({ review });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to update review" },
      { status: 500 },
    );
  }
}
