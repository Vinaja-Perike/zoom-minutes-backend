
import fetch from 'node-fetch';

type TokenResponse = {
  token_type: string;
  expires_in: number;
  ext_expires_in?: number;
  access_token: string;
  scope?: string;
};

const TENANT_ID = process.env.TENANT_ID!;
const CLIENT_ID = process.env.CLIENT_ID!;
const CLIENT_SECRET = process.env.CLIENT_SECRET!;

export async function getAppAccessToken(): Promise<TokenResponse> {
  const url = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
  const body = new URLSearchParams();
  body.append('grant_type', 'client_credentials');
  body.append('client_id', CLIENT_ID);
  body.append('client_secret', CLIENT_SECRET);
  body.append('scope', 'https://graph.microsoft.com/.default'); 

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body as any,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Token request failed: ${res.status} ${res.statusText} - ${errText}`);
  }

  return (await res.json()) as TokenResponse;
}
