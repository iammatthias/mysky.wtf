// MySpace-specific lexicons for AT Protocol
// Using standard.site for blog posts, custom namespace for MySpace features

export const LEXICONS = {
  // standard.site lexicons
  publication: "site.standard.publication",
  document: "site.standard.document",

  // Custom MySpace lexicons (would need to be registered)
  profile: "space.myspace.profile",
  topFriends: "space.myspace.topFriends",
  comment: "space.myspace.comment",
  customCss: "space.myspace.customCss",
  mood: "space.myspace.mood",
  bulletin: "space.myspace.bulletin",
} as const;

// ============================================
// standard.site lexicon types
// ============================================

// site.standard.theme.color#rgb
export interface ThemeColorRGB {
  $type: "site.standard.theme.color#rgb";
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
}

// site.standard.theme.basic
export interface ThemeBasic {
  background: ThemeColorRGB;
  foreground: ThemeColorRGB;
  accent: ThemeColorRGB;
  accentForeground: ThemeColorRGB;
}

// Publication preferences
export interface PublicationPreferences {
  showInDiscover?: boolean;
}

// site.standard.publication - where content lives
export interface Publication {
  $type: "site.standard.publication";
  url: string; // Base publication URL (e.g., https://mysky.wtf)
  name: string; // Name of the publication (max 128 graphemes)
  description?: string; // Brief description (max 300 graphemes)
  icon?: BlobRef; // Square image, at least 256x256, max 1MB
  basicTheme?: ThemeBasic;
  preferences?: PublicationPreferences;
}

// Blob reference type for uploaded images
export interface BlobRef {
  $type: "blob";
  ref: { $link: string };
  mimeType: string;
  size: number;
}

// Strong reference to another record
export interface StrongRef {
  uri: string;
  cid: string;
}

// Content types for document content union
export interface MarkdownContent {
  $type: "site.standard.content.markdown";
  value: string;
}

export interface HtmlContent {
  $type: "site.standard.content.html";
  value: string;
}

// site.standard.document - the content itself
export interface Document {
  $type: "site.standard.document";
  site: string; // at:// URI to publication record or https:// URL
  path?: string; // Combined with site URL to form canonical URL (prepend with /)
  title: string; // Title of the document (max 128 graphemes)
  description?: string; // Brief description/excerpt (max 300 graphemes)
  coverImage?: BlobRef; // Thumbnail/cover image, max 1MB
  content?: MarkdownContent | HtmlContent; // Document content union
  textContent?: string; // Plaintext representation (no markdown/formatting)
  bskyPostRef?: StrongRef; // Reference to Bluesky post for comments
  tags?: string[]; // Categorization tags (max 50 graphemes each)
  publishedAt: string; // ISO datetime of publish time
  updatedAt?: string; // ISO datetime of last edit
  // MySky extension fields (stored in profile, not document)
  visibility?: "public" | "friends" | "draft";
}

// Document with record metadata (uri, cid, rkey)
export interface DocumentRecord {
  uri: string;
  cid: string;
  value: Document;
}

// ============================================
// MySpace-specific lexicon types
// ============================================

// MySpace profile extension
export interface MySpaceProfileRecord {
  $type: "space.myspace.profile";
  headline?: string;
  mood?: string;
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
  songUrl?: string;
  customCssBlobRef?: string;
  // Privacy settings
  privacy?: {
    profileVisibility?: "public" | "friends";
    contactMe?: "anyone" | "friends";
    blogVisibility?: "public" | "friends";
    showOnline?: boolean;
    showLastLogin?: boolean;
    allowComments?: boolean;
    showFriends?: boolean;
  };
  // Blog/publication settings
  blogSettings?: {
    blogTitle?: string;
    blogTagline?: string;
    postsPerPage?: number;
    showAuthor?: boolean;
    showDate?: boolean;
    allowComments?: boolean;
    defaultVisibility?: "public" | "friends" | "draft";
    blogCss?: string;
  };
}

// Top Friends record
export interface TopFriendsRecord {
  $type: "space.myspace.topFriends";
  friends: string[]; // Array of DIDs, max 8
  updatedAt: string;
}

// Comment record
export interface CommentRecord {
  $type: "space.myspace.comment";
  targetDid: string;
  content: string;
  createdAt: string;
}

// Bulletin record
export interface BulletinRecord {
  $type: "space.myspace.bulletin";
  subject: string;
  body: string;
  createdAt: string;
}

// Legacy BlogEntry type (for backwards compatibility during migration)
export interface BlogEntry {
  $type: "site.standard.blog.entry";
  title: string;
  content: string;
  createdAt: string;
  visibility?: "public" | "friends" | "private";
}

// Mood options matching classic MySpace
export const MOODS = [
  "accomplished",
  "aggravated",
  "amused",
  "angry",
  "annoyed",
  "anxious",
  "apathetic",
  "artistic",
  "awake",
  "bitchy",
  "blah",
  "blank",
  "bored",
  "bouncy",
  "busy",
  "calm",
  "cheerful",
  "chipper",
  "cold",
  "complacent",
  "confused",
  "contemplative",
  "content",
  "cranky",
  "crappy",
  "crazy",
  "creative",
  "crushed",
  "curious",
  "cynical",
  "depressed",
  "determined",
  "devious",
  "dirty",
  "disappointed",
  "discontent",
  "distressed",
  "dorky",
  "drained",
  "drunk",
  "ecstatic",
  "embarrassed",
  "energetic",
  "enraged",
  "enthralled",
  "envious",
  "exanimate",
  "excited",
  "exhausted",
  "flirty",
  "frustrated",
  "full",
  "geeky",
  "giddy",
  "giggly",
  "gloomy",
  "good",
  "grateful",
  "groggy",
  "grumpy",
  "guilty",
  "happy",
  "high",
  "hopeful",
  "horny",
  "hot",
  "hungry",
  "hyper",
  "impressed",
  "indescribable",
  "indifferent",
  "infuriated",
  "intimidated",
  "irate",
  "irritated",
  "jealous",
  "jubilant",
  "lazy",
  "lethargic",
  "listless",
  "lonely",
  "loved",
  "melancholy",
  "mellow",
  "mischievous",
  "moody",
  "morose",
  "naughty",
  "nauseated",
  "nerdy",
  "nervous",
  "nostalgic",
  "numb",
  "okay",
  "optimistic",
  "peaceful",
  "pensive",
  "pessimistic",
  "pissed off",
  "pleased",
  "predatory",
  "productive",
  "quixotic",
  "recumbent",
  "refreshed",
  "rejected",
  "rejuvenated",
  "relaxed",
  "relieved",
  "restless",
  "rushed",
  "sad",
  "satisfied",
  "scared",
  "shocked",
  "sick",
  "silly",
  "sleepy",
  "sore",
  "stressed",
  "surprised",
  "sympathetic",
  "thankful",
  "thirsty",
  "thoughtful",
  "tired",
  "touched",
  "uncomfortable",
  "weird",
  "working",
  "worried",
] as const;

export type Mood = (typeof MOODS)[number];

// Helper to create RGB color
export function rgb(r: number, g: number, b: number): ThemeColorRGB {
  return { $type: "site.standard.theme.color#rgb", r, g, b };
}

// Helper to generate a URL-safe slug from title
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100);
}

// Helper to generate a unique rkey for documents
export function generateDocumentRkey(title: string): string {
  const slug = slugify(title);
  const timestamp = Date.now().toString(36);
  return `${slug}-${timestamp}`;
}
