import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseSignedRequest } from "@/lib/meta-signed-request";
import { CLEARED_INSTAGRAM_FIELDS } from "@/lib/instagram";

/**
 * Called by Meta when a user revokes the app's access to their Instagram
 * account from Instagram/Facebook's own settings (not our UI). Required
 * before Meta App Review will accept a submission.
 */
export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const signedRequest = formData.get("signed_request")?.toString();

  if (!signedRequest) {
    return NextResponse.json({ error: "Missing signed_request" }, { status: 400 });
  }

  const data = parseSignedRequest(signedRequest, process.env.INSTAGRAM_APP_SECRET ?? "");
  if (!data?.user_id) {
    return NextResponse.json({ error: "Invalid signed_request" }, { status: 400 });
  }

  await prisma.creatorProfile.updateMany({
    where: { instagramUserId: String(data.user_id) },
    data: CLEARED_INSTAGRAM_FIELDS,
  });

  return NextResponse.json({ success: true });
}
