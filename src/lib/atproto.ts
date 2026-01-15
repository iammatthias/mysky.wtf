import { Agent } from "@atproto/api";
import type {
  MySpaceProfileRecord,
  TopFriendsRecord,
  CommentRecord,
  BulletinRecord,
  Publication,
  Document,
  DocumentRecord,
  BlobRef,
  ThemeBasic,
} from "./lexicons";
import { LEXICONS, generateDocumentRkey, rgb } from "./lexicons";

// Tom from MySky - everyone's first friend (just like the original!)
export const TOM_DID = "did:plc:z72i7hdynmk6r22z27h6tvur"; // tom.bsky.social

// Default MySky publication URL
export const MYSKY_URL = "https://mysky.wtf";

// ============================================
// MySpace Profile Functions
// ============================================

// Fetch MySpace profile extension data from PDS
export async function getMySpaceProfile(
  agent: Agent,
  did: string,
): Promise<MySpaceProfileRecord | null> {
  try {
    const response = await agent.com.atproto.repo.getRecord({
      repo: did,
      collection: LEXICONS.profile,
      rkey: "self",
    });
    return response.data.value as MySpaceProfileRecord;
  } catch {
    return null;
  }
}

// Save MySpace profile extension
export async function saveMySpaceProfile(
  agent: Agent,
  profile: Omit<MySpaceProfileRecord, "$type">,
): Promise<void> {
  const did = agent.session?.did;
  if (!did) throw new Error("Not authenticated");

  const record: MySpaceProfileRecord = {
    $type: LEXICONS.profile,
    ...profile,
  };

  try {
    await agent.com.atproto.repo.putRecord({
      repo: did,
      collection: LEXICONS.profile,
      rkey: "self",
      record,
    });
  } catch {
    await agent.com.atproto.repo.createRecord({
      repo: did,
      collection: LEXICONS.profile,
      rkey: "self",
      record,
    });
  }
}

// ============================================
// Top Friends Functions
// ============================================

// Get Top Friends - returns Tom as default first friend if no friends set
export async function getTopFriends(
  agent: Agent,
  did: string,
): Promise<string[]> {
  try {
    const response = await agent.com.atproto.repo.getRecord({
      repo: did,
      collection: LEXICONS.topFriends,
      rkey: "self",
    });
    const record = response.data.value as TopFriendsRecord;
    return record.friends || [];
  } catch {
    // No friends record exists - return Tom as the default first friend!
    return [TOM_DID];
  }
}

// Save Top Friends
export async function saveTopFriends(
  agent: Agent,
  friends: string[],
): Promise<void> {
  const did = agent.session?.did;
  if (!did) throw new Error("Not authenticated");

  const record: TopFriendsRecord = {
    $type: LEXICONS.topFriends,
    friends: friends.slice(0, 8),
    updatedAt: new Date().toISOString(),
  };

  try {
    await agent.com.atproto.repo.putRecord({
      repo: did,
      collection: LEXICONS.topFriends,
      rkey: "self",
      record,
    });
  } catch {
    await agent.com.atproto.repo.createRecord({
      repo: did,
      collection: LEXICONS.topFriends,
      rkey: "self",
      record,
    });
  }
}

// ============================================
// standard.site Publication Functions
// ============================================

// Get user's publication record
export async function getPublication(
  agent: Agent,
  did: string,
): Promise<Publication | null> {
  try {
    const response = await agent.com.atproto.repo.getRecord({
      repo: did,
      collection: LEXICONS.publication,
      rkey: "self",
    });
    return response.data.value as Publication;
  } catch {
    return null;
  }
}

// Create or update publication
export async function savePublication(
  agent: Agent,
  publication: Omit<Publication, "$type">,
): Promise<void> {
  const did = agent.session?.did;
  if (!did) throw new Error("Not authenticated");

  const record: Publication = {
    $type: LEXICONS.publication,
    ...publication,
  };

  try {
    await agent.com.atproto.repo.putRecord({
      repo: did,
      collection: LEXICONS.publication,
      rkey: "self",
      record,
    });
  } catch {
    await agent.com.atproto.repo.createRecord({
      repo: did,
      collection: LEXICONS.publication,
      rkey: "self",
      record,
    });
  }
}

// Create default publication for user
export async function createDefaultPublication(
  agent: Agent,
  handle: string,
  displayName?: string,
): Promise<Publication> {
  const did = agent.session?.did;
  if (!did) throw new Error("Not authenticated");

  const publication: Publication = {
    $type: LEXICONS.publication,
    url: `${MYSKY_URL}/profile/${handle}/blog`,
    name: `${displayName || handle}'s Blog`,
    description: `Blog posts from ${displayName || handle} on MySky`,
    basicTheme: {
      background: rgb(255, 255, 255),
      foreground: rgb(0, 51, 102),
      accent: rgb(255, 102, 0),
      accentForeground: rgb(255, 255, 255),
    },
    preferences: {
      showInDiscover: true,
    },
  };

  await savePublication(agent, publication);
  return publication;
}

// ============================================
// standard.site Document Functions
// ============================================

// Get all documents (blog posts) for a user
export async function getDocuments(
  agent: Agent,
  did: string,
  limit = 20,
): Promise<DocumentRecord[]> {
  try {
    const response = await agent.com.atproto.repo.listRecords({
      repo: did,
      collection: LEXICONS.document,
      limit,
    });
    return response.data.records.map((r) => ({
      uri: r.uri,
      cid: r.cid,
      value: r.value as Document,
    }));
  } catch {
    return [];
  }
}

// Get a specific document by rkey
export async function getDocument(
  agent: Agent,
  did: string,
  rkey: string,
): Promise<DocumentRecord | null> {
  try {
    const response = await agent.com.atproto.repo.getRecord({
      repo: did,
      collection: LEXICONS.document,
      rkey,
    });
    return {
      uri: response.data.uri,
      cid: response.data.cid,
      value: response.data.value as Document,
    };
  } catch {
    return null;
  }
}

// Create a new document (blog post)
export async function createDocument(
  agent: Agent,
  doc: {
    title: string;
    content: string;
    description?: string;
    tags?: string[];
    visibility?: "public" | "friends" | "draft";
    coverImage?: BlobRef;
  },
): Promise<DocumentRecord> {
  const did = agent.session?.did;
  if (!did) throw new Error("Not authenticated");

  // Ensure user has a publication
  let publication = await getPublication(agent, did);
  if (!publication) {
    const profile = await agent.getProfile({ actor: did });
    publication = await createDefaultPublication(
      agent,
      profile.data.handle,
      profile.data.displayName,
    );
  }

  const rkey = generateDocumentRkey(doc.title);
  const now = new Date().toISOString();

  const record: Document = {
    $type: LEXICONS.document,
    site: `at://${did}/${LEXICONS.publication}/self`,
    path: `/${rkey}`,
    title: doc.title,
    description: doc.description,
    content: {
      $type: "site.standard.content.markdown",
      value: doc.content,
    },
    textContent: doc.content.replace(/[#*_`~\[\]()]/g, ""), // Strip markdown
    tags: doc.tags,
    coverImage: doc.coverImage,
    publishedAt: now,
    visibility: doc.visibility || "public",
  };

  const response = await agent.com.atproto.repo.createRecord({
    repo: did,
    collection: LEXICONS.document,
    rkey,
    record,
  });

  return {
    uri: response.data.uri,
    cid: response.data.cid,
    value: record,
  };
}

// Update an existing document
export async function updateDocument(
  agent: Agent,
  rkey: string,
  updates: {
    title?: string;
    content?: string;
    description?: string;
    tags?: string[];
    visibility?: "public" | "friends" | "draft";
    coverImage?: BlobRef;
  },
): Promise<void> {
  const did = agent.session?.did;
  if (!did) throw new Error("Not authenticated");

  // Get existing document
  const existing = await getDocument(agent, did, rkey);
  if (!existing) throw new Error("Document not found");

  const record: Document = {
    ...existing.value,
    title: updates.title ?? existing.value.title,
    description: updates.description ?? existing.value.description,
    tags: updates.tags ?? existing.value.tags,
    visibility: updates.visibility ?? existing.value.visibility,
    coverImage: updates.coverImage ?? existing.value.coverImage,
    updatedAt: new Date().toISOString(),
  };

  if (updates.content !== undefined) {
    record.content = {
      $type: "site.standard.content.markdown",
      value: updates.content,
    };
    record.textContent = updates.content.replace(/[#*_`~\[\]()]/g, "");
  }

  await agent.com.atproto.repo.putRecord({
    repo: did,
    collection: LEXICONS.document,
    rkey,
    record,
  });
}

// Delete a document
export async function deleteDocument(
  agent: Agent,
  rkey: string,
): Promise<void> {
  const did = agent.session?.did;
  if (!did) throw new Error("Not authenticated");

  await agent.com.atproto.repo.deleteRecord({
    repo: did,
    collection: LEXICONS.document,
    rkey,
  });
}

// Get documents filtered by visibility
export async function getPublishedDocuments(
  agent: Agent,
  did: string,
  limit = 20,
): Promise<DocumentRecord[]> {
  const docs = await getDocuments(agent, did, limit);
  return docs.filter((d) => d.value.visibility !== "draft");
}

export async function getDraftDocuments(
  agent: Agent,
  did: string,
  limit = 50,
): Promise<DocumentRecord[]> {
  const docs = await getDocuments(agent, did, limit);
  return docs.filter((d) => d.value.visibility === "draft");
}

// Helper to extract rkey from document URI
export function getRkeyFromUri(uri: string): string {
  const parts = uri.split("/");
  return parts[parts.length - 1];
}

// ============================================
// Bulletin Functions
// ============================================

// Get bulletins from a user
export async function getBulletins(
  agent: Agent,
  did: string,
  limit = 20,
): Promise<BulletinRecord[]> {
  try {
    const response = await agent.com.atproto.repo.listRecords({
      repo: did,
      collection: LEXICONS.bulletin,
      limit,
    });
    return response.data.records.map((r) => r.value as BulletinRecord);
  } catch {
    return [];
  }
}

// Post a bulletin
export async function postBulletin(
  agent: Agent,
  subject: string,
  body: string,
): Promise<void> {
  const did = agent.session?.did;
  if (!did) throw new Error("Not authenticated");

  const record: BulletinRecord = {
    $type: LEXICONS.bulletin,
    subject,
    body,
    createdAt: new Date().toISOString(),
  };

  await agent.com.atproto.repo.createRecord({
    repo: did,
    collection: LEXICONS.bulletin,
    record,
  });
}

// ============================================
// Comment Functions
// ============================================

// Get comments for a profile
export async function getProfileComments(
  agent: Agent,
  targetDid: string,
): Promise<CommentRecord[]> {
  try {
    const response = await agent.com.atproto.repo.listRecords({
      repo: targetDid,
      collection: LEXICONS.comment,
      limit: 50,
    });
    return response.data.records
      .map((r) => r.value as CommentRecord)
      .filter((c) => c.targetDid === targetDid);
  } catch {
    return [];
  }
}

// Post a comment
export async function postComment(
  agent: Agent,
  targetDid: string,
  content: string,
): Promise<void> {
  const did = agent.session?.did;
  if (!did) throw new Error("Not authenticated");

  const record: CommentRecord = {
    $type: LEXICONS.comment,
    targetDid,
    content,
    createdAt: new Date().toISOString(),
  };

  await agent.com.atproto.repo.createRecord({
    repo: targetDid,
    collection: LEXICONS.comment,
    record,
  });
}

// ============================================
// CSS and Blob Functions
// ============================================

// Upload custom CSS as blob and return ref
export async function uploadCustomCss(
  agent: Agent,
  css: string,
): Promise<string> {
  const did = agent.session?.did;
  if (!did) throw new Error("Not authenticated");

  const blob = new Blob([css], { type: "text/css" });
  const response = await agent.com.atproto.repo.uploadBlob(blob);

  return response.data.blob.ref.toString();
}

// Fetch custom CSS blob
export async function getCustomCss(
  agent: Agent,
  did: string,
  blobRef: string,
): Promise<string | null> {
  try {
    const response = await agent.com.atproto.sync.getBlob({
      did,
      cid: blobRef,
    });
    return new TextDecoder().decode(response.data);
  } catch {
    return null;
  }
}

// Upload an image and return blob ref
export async function uploadImage(
  agent: Agent,
  file: File | Blob,
): Promise<BlobRef> {
  const did = agent.session?.did;
  if (!did) throw new Error("Not authenticated");

  const response = await agent.com.atproto.repo.uploadBlob(file);

  return {
    $type: "blob",
    ref: { $link: response.data.blob.ref.toString() },
    mimeType: file.type,
    size: file.size,
  };
}

// ============================================
// Identity Functions
// ============================================

// Resolve handle to DID
export async function resolveHandle(
  agent: Agent,
  handle: string,
): Promise<string | null> {
  try {
    const response = await agent.resolveHandle({ handle });
    return response.data.did;
  } catch {
    return null;
  }
}

// Get multiple profiles for Top Friends display
export async function getProfiles(agent: Agent, dids: string[]) {
  const profiles = await Promise.all(
    dids.map(async (did) => {
      try {
        const response = await agent.getProfile({ actor: did });
        return response.data;
      } catch {
        return null;
      }
    }),
  );
  return profiles.filter(Boolean);
}

// Search for users
export async function searchUsers(agent: Agent, query: string, limit = 20) {
  try {
    const response = await agent.searchActors({ q: query, limit });
    return response.data.actors;
  } catch {
    return [];
  }
}

// ============================================
// Legacy Support - Blog Entry Functions
// (For backwards compatibility during migration)
// ============================================

// Get blog entries (maps to getDocuments)
export async function getBlogEntries(agent: Agent, did: string, limit = 10) {
  const docs = await getDocuments(agent, did, limit);
  // Transform to legacy format for backwards compatibility
  return docs.map((d) => ({
    title: d.value.title,
    content: d.value.content?.value || d.value.textContent || "",
    createdAt: d.value.publishedAt,
    visibility: d.value.visibility,
    // Include new fields for gradual migration
    uri: d.uri,
    rkey: getRkeyFromUri(d.uri),
    description: d.value.description,
    tags: d.value.tags,
    updatedAt: d.value.updatedAt,
  }));
}

// Create blog entry (maps to createDocument)
export async function createBlogEntry(
  agent: Agent,
  title: string,
  content: string,
  visibility: "public" | "friends" | "draft" = "public",
): Promise<void> {
  await createDocument(agent, {
    title,
    content,
    description: content.substring(0, 300),
    visibility,
  });
}
