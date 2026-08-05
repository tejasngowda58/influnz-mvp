import { prisma } from "@/lib/prisma";
import { decryptSecret, encryptSecret } from "@/lib/crypto";
import { refreshLongLivedToken } from "@/lib/instagram";

const REFRESH_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

interface RefreshableProfile {
  id: string;
  instagramAccessToken: string | null;
  instagramTokenExpiresAt: Date | null;
}

/**
 * Called opportunistically on dashboard load. This stack has no scheduled job
 * runner, so token refresh happens lazily instead of on a proper cron.
 */
export async function maybeRefreshInstagramToken(profile: RefreshableProfile): Promise<void> {
  if (!profile.instagramAccessToken || !profile.instagramTokenExpiresAt) {
    return;
  }
  if (profile.instagramTokenExpiresAt.getTime() - Date.now() > REFRESH_WINDOW_MS) {
    return;
  }

  try {
    const currentToken = decryptSecret(profile.instagramAccessToken);
    const { accessToken, expiresInSeconds } = await refreshLongLivedToken(currentToken);
    await prisma.creatorProfile.update({
      where: { id: profile.id },
      data: {
        instagramAccessToken: encryptSecret(accessToken),
        instagramTokenExpiresAt: new Date(Date.now() + expiresInSeconds * 1000),
      },
    });
  } catch (err) {
    console.error("Instagram token refresh failed, clearing connection", err);
    await prisma.creatorProfile.update({
      where: { id: profile.id },
      data: { instagramAccessToken: null, instagramTokenExpiresAt: null, instagramConnectedAt: null },
    });
  }
}
