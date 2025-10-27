import { OAuth2Client } from "google-auth-library";

let oauth2Client: OAuth2Client | null = null;

function getOAuth2Client(): OAuth2Client {
  if (oauth2Client) return oauth2Client; // reuse singleton [web:3]
  const clientId = process.env.GOOGLE_CLIENT_ID || "";
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || ""; // must match GCP config [web:2][web:8]

  if (!clientId || !clientSecret) {
    throw new Error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET"); // basic guard [web:2]
  }

  oauth2Client = new OAuth2Client(clientId, clientSecret, redirectUri); // standard ctor [web:1][web:3]
  return oauth2Client;
}

export async function loadUserRefreshToken(): Promise<string> {
  const token = process.env.GOOGLE_REFRESH_TOKEN;
  if (!token) throw new Error("Missing GOOGLE_REFRESH_TOKEN environment variable"); // guard [web:5]
  return token; // unchanged signature [web:5]
}

export async function getAccessTokenFromRefresh(): Promise<{
  accessToken: string;
  expiresIn?: number;
  tokenType?: string;
  scope?: string;
}> {
  const refreshToken = await loadUserRefreshToken(); // read RT from env [web:5]
  const client = getOAuth2Client(); // get singleton [web:3]

  // Only set the refresh_token so library handles mint/refresh automatically. [web:3][web:7]
  client.setCredentials({ refresh_token: refreshToken }); // attach RT [web:5][web:7]

  try {
    // getAccessToken will mint a fresh access token using the refresh token. [web:1][web:3]
    const r = await client.getAccessToken(); // may return string or {token} depending on version [web:4]
    console.log("Google OAuth getAccessToken response:", r); // debug log [web:4]
    const accessToken =
      typeof r === "string" ? r : (r?.token ?? (r as any)?.credentials?.access_token);
      console.log("Extracted access token:", accessToken); // debug log [web:4]
    if (!accessToken) throw new Error("No access token in response"); // guard [web:4]
    console.log("Obtained access token successfully"); // debug log [web:4]

    // Credentials on the client should now include expiry_date, token_type, scope. [web:4]
    const creds = client.credentials;
    console.log("OAuth2Client credentials after token fetch:", creds); // debug log [web:4]
    const expiresIn =
      typeof creds.expiry_date === "number"
        ? Math.max(0, Math.floor((creds.expiry_date - Date.now()) / 1000))
        : undefined; // seconds until expiry [web:4]
        console.log("Calculated expiresIn (seconds):", expiresIn); // debug log [web:4]
    const tokenType = creds.token_type ?? undefined;
    // typically "Bearer" [web:4]
    const scope = creds.scope; // granted scopes string [web:8]

    return { accessToken, expiresIn, tokenType, scope }; // normalized format [web:3][web:4]
  } catch (e: any) {
    // Common causes: revoked/expired RT, testing mode 7‑day expiry, password change for Gmail scopes, quota limits. [web:5]
    const msg = e?.message || "Refresh failed"; // normalize [web:5]
    throw new Error(`Token refresh error: ${msg}`); // propagate [web:5]
  }
}

export const getAuthToken = async (): Promise<string> => {
  const { accessToken } = await getAccessTokenFromRefresh(); // single source of truth [web:3]
  return accessToken; // bearer token string [web:1]
};
