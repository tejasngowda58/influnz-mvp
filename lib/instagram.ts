const AUTHORIZE_URL = "https://www.instagram.com/oauth/authorize";
const TOKEN_URL = "https://api.instagram.com/oauth/access_token";
const GRAPH_BASE = "https://graph.instagram.com";
const GRAPH_VERSION = "v21.0";

export const INSTAGRAM_SCOPE = "instagram_business_basic";

/** Full reset of a creator's Instagram connection — used by disconnect, deauthorize, and data-deletion. */
export const CLEARED_INSTAGRAM_FIELDS = {
  instagramHandle: null,
  followerCount: null,
  instagramUserId: null,
  instagramProfilePictureUrl: null,
  instagramAccessToken: null,
  instagramTokenExpiresAt: null,
  instagramConnectedAt: null,
} as const;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

export function getInstagramAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: requireEnv("INSTAGRAM_APP_ID"),
    redirect_uri: requireEnv("INSTAGRAM_REDIRECT_URI"),
    response_type: "code",
    scope: INSTAGRAM_SCOPE,
    state,
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

interface ShortLivedTokenResult {
  accessToken: string;
  instagramUserId: string;
}

export async function exchangeCodeForShortLivedToken(code: string): Promise<ShortLivedTokenResult> {
  const body = new URLSearchParams({
    client_id: requireEnv("INSTAGRAM_APP_ID"),
    client_secret: requireEnv("INSTAGRAM_APP_SECRET"),
    grant_type: "authorization_code",
    redirect_uri: requireEnv("INSTAGRAM_REDIRECT_URI"),
    code,
  });

  const response = await fetch(TOKEN_URL, { method: "POST", body });
  if (!response.ok) {
    throw new Error(`Instagram code exchange failed: ${await response.text()}`);
  }
  const data = await response.json();
  return { accessToken: data.access_token, instagramUserId: String(data.user_id) };
}

interface LongLivedTokenResult {
  accessToken: string;
  expiresInSeconds: number;
}

export async function exchangeForLongLivedToken(shortLivedToken: string): Promise<LongLivedTokenResult> {
  const params = new URLSearchParams({
    grant_type: "ig_exchange_token",
    client_secret: requireEnv("INSTAGRAM_APP_SECRET"),
    access_token: shortLivedToken,
  });

  const response = await fetch(`${GRAPH_BASE}/access_token?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Instagram long-lived token exchange failed: ${await response.text()}`);
  }
  const data = await response.json();
  return { accessToken: data.access_token, expiresInSeconds: data.expires_in };
}

export async function refreshLongLivedToken(accessToken: string): Promise<LongLivedTokenResult> {
  const params = new URLSearchParams({
    grant_type: "ig_refresh_token",
    access_token: accessToken,
  });

  const response = await fetch(`${GRAPH_BASE}/refresh_access_token?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Instagram token refresh failed: ${await response.text()}`);
  }
  const data = await response.json();
  return { accessToken: data.access_token, expiresInSeconds: data.expires_in };
}

export interface InstagramProfile {
  id: string;
  username: string;
  accountType: string;
  followersCount: number | null;
  profilePictureUrl: string | null;
}

export async function fetchInstagramProfile(accessToken: string): Promise<InstagramProfile> {
  const fields = "id,username,account_type,followers_count,profile_picture_url";
  const response = await fetch(
    `${GRAPH_BASE}/${GRAPH_VERSION}/me?fields=${fields}&access_token=${accessToken}`,
  );
  if (!response.ok) {
    throw new Error(`Fetching Instagram profile failed: ${await response.text()}`);
  }
  const data = await response.json();
  return {
    id: data.id,
    username: data.username,
    accountType: data.account_type,
    followersCount: data.followers_count ?? null,
    profilePictureUrl: data.profile_picture_url ?? null,
  };
}
