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
  PhotoAlbumRecord,
  PhotoAlbumWithMeta,
  PhotoRecord,
  PhotoWithMeta,
} from "./lexicons";
import { LEXICONS, generateDocumentRkey, rgb } from "./lexicons";

// Tom from MySky - everyone's first friend (just like the original!)
export const TOM_DID = "did:plc:z72i7hdynmk6r22z27h6tvur"; // tom.bsky.social

// Default MySky publication URL
export const MYSKY_URL = "https://mysky.wtf";

// PLC Directory for resolving DIDs to PDS endpoints
const PLC_DIRECTORY = "https://plc.directory";

// Cache for PDS endpoints to avoid repeated lookups
const pdsCache = new Map<string, string>();

// Resolve a DID to its PDS endpoint
async function resolvePds(did: string): Promise<string | null> {
  // Check cache first
  if (pdsCache.has(did)) {
    return pdsCache.get(did)!;
  }

  try {
    const response = await fetch(`${PLC_DIRECTORY}/${did}`, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) return null;
    const data = await response.json();

    // Find the PDS service endpoint
    const pdsService = data.service?.find(
      (s: any) => s.type === "AtprotoPersonalDataServer",
    );
    if (pdsService?.serviceEndpoint) {
      pdsCache.set(did, pdsService.serviceEndpoint);
      return pdsService.serviceEndpoint;
    }
    return null;
  } catch {
    return null;
  }
}

// Helper to fetch a record directly from a user's PDS
async function fetchRecordPublic(
  repo: string,
  collection: string,
  rkey: string,
): Promise<any | null> {
  try {
    // Resolve the user's PDS
    const pds = await resolvePds(repo);
    if (!pds) return null;

    const url = new URL(`${pds}/xrpc/com.atproto.repo.getRecord`);
    url.searchParams.set("repo", repo);
    url.searchParams.set("collection", collection);
    url.searchParams.set("rkey", rkey);

    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

// Helper to list records directly from a user's PDS
async function listRecordsPublic(
  repo: string,
  collection: string,
  limit = 50,
): Promise<any[]> {
  try {
    // Resolve the user's PDS
    const pds = await resolvePds(repo);
    if (!pds) return [];

    const url = new URL(`${pds}/xrpc/com.atproto.repo.listRecords`);
    url.searchParams.set("repo", repo);
    url.searchParams.set("collection", collection);
    url.searchParams.set("limit", limit.toString());

    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) return [];
    const data = await response.json();
    return data.records || [];
  } catch {
    return [];
  }
}

// ============================================
// MySpace Profile Functions
// ============================================

// Fetch MySpace profile extension data from PDS
export async function getMySpaceProfile(
  agent: Agent,
  did: string,
): Promise<MySpaceProfileRecord | null> {
  try {
    // Use public API for cross-PDS compatibility
    const data = await fetchRecordPublic(did, LEXICONS.profile, "self");
    if (data?.value) {
      return data.value as MySpaceProfileRecord;
    }
    return null;
  } catch {
    return null;
  }
}

// Save MySpace profile extension
export async function saveMySpaceProfile(
  agent: Agent,
  profile: Omit<MySpaceProfileRecord, "$type">,
): Promise<void> {
  const did = agent.did || agent.session?.did;
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
    // Use public API for cross-PDS compatibility
    const data = await fetchRecordPublic(did, LEXICONS.topFriends, "self");
    if (data?.value) {
      const record = data.value as TopFriendsRecord;
      return record.friends || [];
    }
    // No friends record exists - return Tom as the default first friend!
    return [TOM_DID];
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
  const did = agent.did || agent.session?.did;
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
  const did = agent.did || agent.session?.did;
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
  const did = agent.did || agent.session?.did;
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
    // Use public API for cross-PDS compatibility
    const records = await listRecordsPublic(did, LEXICONS.document, limit);
    return records.map((r: any) => ({
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
    // Use public API for cross-PDS compatibility
    const data = await fetchRecordPublic(did, LEXICONS.document, rkey);
    if (data) {
      return {
        uri: data.uri,
        cid: data.cid,
        value: data.value as Document,
      };
    }
    return null;
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
  const did = agent.did || agent.session?.did;
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
  const did = agent.did || agent.session?.did;
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
  const did = agent.did || agent.session?.did;
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

// Helper to extract content from a Document
export function getDocumentContent(doc: Document): string {
  if (
    doc.content &&
    typeof doc.content === "object" &&
    "value" in doc.content
  ) {
    return doc.content.value;
  } else if (doc.textContent) {
    return doc.textContent;
  } else if (typeof doc.content === "string") {
    // Fallback for any legacy string content
    return doc.content as unknown as string;
  }
  return "";
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
    // Use public API for cross-PDS compatibility
    const records = await listRecordsPublic(did, LEXICONS.bulletin, limit);
    return records.map((r: any) => r.value as BulletinRecord);
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
  const did = agent.did || agent.session?.did;
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

// Constellation API for backlink indexing (indexes all AT Proto records)
const CONSTELLATION_API = "https://constellation.microcosm.blue";

// Get comments for a profile using Constellation backlink index
export async function getProfileComments(
  agent: Agent,
  targetDid: string,
): Promise<CommentRecord[]> {
  const allComments: CommentRecord[] = [];

  try {
    // Use Constellation to find all space.myspace.comment records linking to this DID
    const constellationUrl = new URL(`${CONSTELLATION_API}/links`);
    constellationUrl.searchParams.set("target", targetDid);
    constellationUrl.searchParams.set("collection", LEXICONS.comment);
    constellationUrl.searchParams.set("path", ".targetDid");
    constellationUrl.searchParams.set("limit", "50");

    const response = await fetch(constellationUrl.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "MySky/1.0 (@iammatthias.com)",
      },
    });

    if (response.ok) {
      const data = await response.json();

      // Constellation returns linking_records with did, collection, rkey
      if (data.linking_records && Array.isArray(data.linking_records)) {
        for (const link of data.linking_records) {
          try {
            const { did: authorDid, collection, rkey } = link;
            if (!authorDid || !collection || !rkey) continue;

            // Fetch the actual comment record from the author's PDS
            const record = await fetchRecordPublic(authorDid, collection, rkey);
            if (!record?.value) continue;

            const comment = record.value as CommentRecord;
            if (!comment.author) comment.author = authorDid;
            allComments.push(comment);
          } catch {
            // Skip records we can't fetch
          }
        }
      }
    }

    // Fallback: also check the target's own repo for legacy comments via public API
    try {
      const records = await listRecordsPublic(targetDid, LEXICONS.comment, 50);
      records.forEach((r: any) => {
        const comment = r.value as CommentRecord;
        if (comment.targetDid === targetDid) {
          if (!comment.author) comment.author = targetDid;
          allComments.push(comment);
        }
      });
    } catch {
      // No legacy comments
    }

    // Also check the current user's repo for comments they've made to this profile
    // (since Constellation indexing may be delayed)
    const currentUserDid = agent.did || agent.session?.did;
    if (currentUserDid && currentUserDid !== targetDid) {
      try {
        const userComments = await listRecordsPublic(
          currentUserDid,
          LEXICONS.comment,
          50,
        );
        userComments.forEach((r: any) => {
          const comment = r.value as CommentRecord;
          if (comment.targetDid === targetDid) {
            if (!comment.author) comment.author = currentUserDid;
            allComments.push(comment);
          }
        });
      } catch {
        // Couldn't fetch user's comments
      }
    }

    // Sort by newest first and dedupe
    const seen = new Set<string>();
    return allComments
      .filter((c) => {
        const key = `${c.author}-${c.createdAt}-${c.content}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
  } catch (error) {
    console.error("Failed to fetch comments:", error);
    return [];
  }
}

// Post a comment - stores in the commenter's own repo
export async function postComment(
  agent: Agent,
  targetDid: string,
  content: string,
): Promise<void> {
  const did = agent.did || agent.session?.did;
  if (!did) throw new Error("Not authenticated");

  const record: CommentRecord = {
    $type: LEXICONS.comment,
    targetDid,
    author: did,
    content,
    createdAt: new Date().toISOString(),
  };

  // Store in the commenter's own repo (not the target's)
  await agent.com.atproto.repo.createRecord({
    repo: did,
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
  const did = agent.did || agent.session?.did;
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
  const did = agent.did || agent.session?.did;
  if (!did) throw new Error("Not authenticated");

  const response = await agent.com.atproto.repo.uploadBlob(file);

  // The blob ref from the API - extract the CID properly
  const blob = response.data.blob;
  const cid = blob.ref?.toString() || blob.ref?.$link || (blob as any).cid;

  console.log("Uploaded blob:", { blob, cid });

  return {
    $type: "blob",
    ref: { $link: cid },
    mimeType: blob.mimeType || file.type,
    size: blob.size || file.size,
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
  return docs.map((d) => {
    // Handle content extraction - could be markdown, html, or just textContent
    let content = "";
    if (
      d.value.content &&
      typeof d.value.content === "object" &&
      "value" in d.value.content
    ) {
      content = d.value.content.value;
    } else if (d.value.textContent) {
      content = d.value.textContent;
    } else if (typeof d.value.content === "string") {
      // Fallback for any legacy string content
      content = d.value.content as unknown as string;
    }

    return {
      title: d.value.title,
      content,
      createdAt: d.value.publishedAt,
      visibility: d.value.visibility,
      // Include new fields for gradual migration
      uri: d.uri,
      rkey: getRkeyFromUri(d.uri),
      description: d.value.description,
      tags: d.value.tags,
      updatedAt: d.value.updatedAt,
    };
  });
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

// ============================================
// Photo Album Functions
// ============================================

// Generate a unique rkey for albums/photos
function generateRkey(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

// Get all photo albums for a user
export async function getPhotoAlbums(
  agent: Agent,
  did: string,
): Promise<PhotoAlbumWithMeta[]> {
  try {
    // Use public API for cross-PDS compatibility
    const records = await listRecordsPublic(did, LEXICONS.photoAlbum, 100);
    return records.map((r: any) => ({
      uri: r.uri,
      cid: r.cid,
      rkey: getRkeyFromUri(r.uri),
      value: r.value as PhotoAlbumRecord,
    }));
  } catch {
    return [];
  }
}

// Get a specific photo album
export async function getPhotoAlbum(
  agent: Agent,
  did: string,
  rkey: string,
): Promise<PhotoAlbumWithMeta | null> {
  try {
    // Use public API for cross-PDS compatibility
    const data = await fetchRecordPublic(did, LEXICONS.photoAlbum, rkey);
    if (data) {
      return {
        uri: data.uri,
        cid: data.cid,
        rkey,
        value: data.value as PhotoAlbumRecord,
      };
    }
    return null;
  } catch {
    return null;
  }
}

// Create a new photo album
export async function createPhotoAlbum(
  agent: Agent,
  album: {
    name: string;
    description?: string;
    visibility?: "public" | "friends" | "private";
  },
): Promise<PhotoAlbumWithMeta> {
  const did = agent.did || agent.session?.did;
  if (!did) throw new Error("Not authenticated");

  const rkey = generateRkey();
  const record: PhotoAlbumRecord = {
    $type: LEXICONS.photoAlbum,
    name: album.name,
    description: album.description,
    visibility: album.visibility || "public",
    createdAt: new Date().toISOString(),
  };

  const response = await agent.com.atproto.repo.createRecord({
    repo: did,
    collection: LEXICONS.photoAlbum,
    rkey,
    record,
  });

  return {
    uri: response.data.uri,
    cid: response.data.cid,
    rkey,
    value: record,
  };
}

// Update a photo album
export async function updatePhotoAlbum(
  agent: Agent,
  rkey: string,
  updates: {
    name?: string;
    description?: string;
    visibility?: "public" | "friends" | "private";
    coverPhoto?: BlobRef;
  },
): Promise<void> {
  const did = agent.did || agent.session?.did;
  if (!did) throw new Error("Not authenticated");

  const existing = await getPhotoAlbum(agent, did, rkey);
  if (!existing) throw new Error("Album not found");

  const record: PhotoAlbumRecord = {
    ...existing.value,
    name: updates.name ?? existing.value.name,
    description: updates.description ?? existing.value.description,
    visibility: updates.visibility ?? existing.value.visibility,
    coverPhoto: updates.coverPhoto ?? existing.value.coverPhoto,
    updatedAt: new Date().toISOString(),
  };

  await agent.com.atproto.repo.putRecord({
    repo: did,
    collection: LEXICONS.photoAlbum,
    rkey,
    record,
  });
}

// Delete a photo album and all its photos
export async function deletePhotoAlbum(
  agent: Agent,
  rkey: string,
): Promise<void> {
  const did = agent.did || agent.session?.did;
  if (!did) throw new Error("Not authenticated");

  // First delete all photos in the album
  const photos = await getAlbumPhotos(agent, did, rkey);
  for (const photo of photos) {
    await deletePhoto(agent, photo.rkey);
  }

  // Then delete the album
  await agent.com.atproto.repo.deleteRecord({
    repo: did,
    collection: LEXICONS.photoAlbum,
    rkey,
  });
}

// Get all photos in an album
export async function getAlbumPhotos(
  agent: Agent,
  did: string,
  albumRkey: string,
): Promise<PhotoWithMeta[]> {
  try {
    // Use public API for cross-PDS compatibility
    const records = await listRecordsPublic(did, LEXICONS.photo, 100);
    return records
      .map((r: any) => ({
        uri: r.uri,
        cid: r.cid,
        rkey: getRkeyFromUri(r.uri),
        value: r.value as PhotoRecord,
      }))
      .filter((p) => p.value.albumRkey === albumRkey);
  } catch {
    return [];
  }
}

// Get all photos for a user (across all albums)
export async function getAllPhotos(
  agent: Agent,
  did: string,
): Promise<PhotoWithMeta[]> {
  try {
    // Use public API for cross-PDS compatibility
    const records = await listRecordsPublic(did, LEXICONS.photo, 100);
    return records.map((r: any) => ({
      uri: r.uri,
      cid: r.cid,
      rkey: getRkeyFromUri(r.uri),
      value: r.value as PhotoRecord,
    }));
  } catch {
    return [];
  }
}

// Get a specific photo
export async function getPhoto(
  agent: Agent,
  did: string,
  rkey: string,
): Promise<PhotoWithMeta | null> {
  try {
    // Use public API for cross-PDS compatibility
    const data = await fetchRecordPublic(did, LEXICONS.photo, rkey);
    if (data) {
      return {
        uri: data.uri,
        cid: data.cid,
        rkey,
        value: data.value as PhotoRecord,
      };
    }
    return null;
  } catch {
    return null;
  }
}

// Upload a photo to an album
export async function uploadPhoto(
  agent: Agent,
  albumRkey: string,
  file: File | Blob,
  caption?: string,
  tags?: string[],
): Promise<PhotoWithMeta> {
  const did = agent.did || agent.session?.did;
  if (!did) throw new Error("Not authenticated");

  // Upload the image blob
  const imageRef = await uploadImage(agent, file);

  const rkey = generateRkey();
  const record: PhotoRecord = {
    $type: LEXICONS.photo,
    albumRkey,
    image: imageRef,
    caption,
    tags,
    uploadedAt: new Date().toISOString(),
  };

  const response = await agent.com.atproto.repo.createRecord({
    repo: did,
    collection: LEXICONS.photo,
    rkey,
    record,
  });

  return {
    uri: response.data.uri,
    cid: response.data.cid,
    rkey,
    value: record,
  };
}

// Update photo caption/tags
export async function updatePhoto(
  agent: Agent,
  rkey: string,
  updates: {
    caption?: string;
    tags?: string[];
  },
): Promise<void> {
  const did = agent.did || agent.session?.did;
  if (!did) throw new Error("Not authenticated");

  const existing = await getPhoto(agent, did, rkey);
  if (!existing) throw new Error("Photo not found");

  const record: PhotoRecord = {
    ...existing.value,
    caption: updates.caption ?? existing.value.caption,
    tags: updates.tags ?? existing.value.tags,
  };

  await agent.com.atproto.repo.putRecord({
    repo: did,
    collection: LEXICONS.photo,
    rkey,
    record,
  });
}

// Delete a photo
export async function deletePhoto(agent: Agent, rkey: string): Promise<void> {
  const did = agent.did || agent.session?.did;
  if (!did) throw new Error("Not authenticated");

  await agent.com.atproto.repo.deleteRecord({
    repo: did,
    collection: LEXICONS.photo,
    rkey,
  });
}

// Get blob URL for displaying photos
// Uses the Bluesky CDN which can serve blobs from any PDS
export function getPhotoUrl(did: string, blobRef: BlobRef): string {
  // Handle different blob ref formats
  let cid: string | undefined;

  if (blobRef.ref?.$link) {
    cid = blobRef.ref.$link;
  } else if (typeof blobRef.ref === "string") {
    cid = blobRef.ref;
  } else if ((blobRef as any).cid) {
    cid = (blobRef as any).cid;
  } else if ((blobRef.ref as any)?.toString) {
    cid = (blobRef.ref as any).toString();
  }

  if (!cid) {
    console.error("Could not extract CID from blob ref:", blobRef);
    return "/default-avatar.svg";
  }

  // Use cdn.bsky.app which handles cross-PDS blob serving
  return `https://cdn.bsky.app/img/feed_thumbnail/plain/${did}/${cid}@jpeg`;
}
