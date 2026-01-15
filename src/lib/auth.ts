import { BrowserOAuthClient } from "@atproto/oauth-client-browser";
import { Agent } from "@atproto/api";

let oauthClient: BrowserOAuthClient | null = null;

export async function getOAuthClient(): Promise<BrowserOAuthClient> {
  if (oauthClient) return oauthClient;

  if (typeof window === "undefined") {
    throw new Error("OAuth client can only be used in browser");
  }

  const origin = window.location.origin;

  // Always use client-metadata.json - update it for your environment
  // For local dev with ngrok: update public/client-metadata.json with your ngrok URL
  // For production: update with your production URL
  oauthClient = await BrowserOAuthClient.load({
    clientId: `${origin}/client-metadata.json`,
    handleResolver: "https://bsky.social",
  });

  return oauthClient;
}

export async function login(handle: string): Promise<void> {
  const client = await getOAuthClient();

  // Normalize handle - remove @ if present
  const normalizedHandle = handle.startsWith("@") ? handle.slice(1) : handle;

  await client.signIn(normalizedHandle);
}

export async function getSession() {
  const client = await getOAuthClient();
  const result = await client.init();

  if (result?.session) {
    return result.session;
  }
  return null;
}

export async function getAgent(): Promise<Agent | null> {
  const session = await getSession();
  if (!session) return null;

  return new Agent(session);
}

export async function logout(): Promise<void> {
  const session = await getSession();
  if (session) {
    const client = await getOAuthClient();
    await client.revoke(session.did);
  }
}

export interface MySpaceProfile {
  did: string;
  handle: string;
  displayName?: string;
  avatar?: string;
  banner?: string;
  description?: string;
  mood?: string;
  headline?: string;
  aboutMe?: string;
  whoIdLikeToMeet?: string;
  interests?: {
    general?: string;
    music?: string;
    movies?: string;
    television?: string;
    books?: string;
    heroes?: string;
  };
  topFriends?: string[];
  customCss?: string;
  songUrl?: string;
  lastLogin?: string;
}

export async function getProfile(did: string): Promise<MySpaceProfile | null> {
  const agent = await getAgent();
  if (!agent) return null;

  try {
    const profile = await agent.getProfile({ actor: did });
    return {
      did: profile.data.did,
      handle: profile.data.handle,
      displayName: profile.data.displayName,
      avatar: profile.data.avatar,
      banner: profile.data.banner,
      description: profile.data.description,
    };
  } catch {
    return null;
  }
}
