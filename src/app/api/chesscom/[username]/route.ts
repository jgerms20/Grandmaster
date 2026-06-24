import { NextResponse } from "next/server";
import { fetchChessProfile } from "@/lib/chesscom";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const info = await fetchChessProfile(username);
  return NextResponse.json(info, {
    headers: {
      // Cache at the edge; players' ratings don't move minute to minute.
      "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400",
    },
  });
}
