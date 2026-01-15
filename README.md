# MySky

A nostalgic social network for the decentralized web. MySky brings back the spirit of early 2000s social networking—customizable profiles, Top 8 Friends, mood indicators, and personal blogs—built on the [AT Protocol](https://atproto.com).

**Live at [mysky.wtf](https://mysky.wtf)**

## Features

- **Customizable Profiles** - Edit your About Me, interests, mood, headline, and add custom CSS to make your profile uniquely yours
- **Top 8 Friends** - Feature your closest friends on your profile (Tom is everyone's first friend, just like the original)
- **Personal Blogs** - Write blog posts using the [standard.site](https://standard.site) lexicon format, making your content portable across the AT Protocol network
- **Bulletins** - Share announcements with your friends network
- **Profile Songs** - Add music to your profile
- **AT Protocol OAuth** - Sign in with your Bluesky handle or any AT Protocol identity—no passwords stored on MySky

## Tech Stack

- **[Astro](https://astro.build)** - Web framework
- **[AT Protocol](https://atproto.com)** - Decentralized identity and data storage
- **[Cloudflare Pages](https://pages.cloudflare.com)** - Hosting and edge compute
- **TypeScript** - Type safety throughout

## Lexicons

MySky uses a combination of standard and custom AT Protocol lexicons:

### standard.site (Blog/Publication)
- `site.standard.publication` - Publication metadata (name, description, icon, theme)
- `site.standard.document` - Blog posts with title, content, tags, and cover images

### MySky Custom
- `space.myspace.profile` - Extended profile data (headline, mood, interests, custom CSS)
- `space.myspace.topFriends` - Top 8 friends list
- `space.myspace.comment` - Profile comments
- `space.myspace.bulletin` - Bulletin posts

## Project Structure

```
src/
├── components/       # Reusable Astro components
│   ├── TopNav.astro
│   ├── Footer.astro
│   └── Layout.astro
├── layouts/          # Page layouts
├── lib/              # Core libraries
│   ├── atproto.ts    # AT Protocol API functions
│   ├── auth.ts       # OAuth authentication
│   └── lexicons.ts   # Type definitions and helpers
├── pages/            # File-based routing
│   ├── blog/         # Blog management
│   ├── edit/         # Profile editing
│   ├── profile/      # Public profiles
│   └── ...
└── styles/           # Global styles
```

## Development

```bash
# Install dependencies
bun install

# Start dev server
bun dev

# Build for production
bun build

# Deploy to Cloudflare Pages
npx wrangler pages deploy ./dist --project-name=mysky
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Home / Login |
| `/profile/[handle]` | Public profile view |
| `/edit` | Edit profile |
| `/edit/privacy` | Privacy settings |
| `/edit/photos` | Photo management |
| `/edit/friends` | Manage Top 8 |
| `/edit/css` | Custom CSS editor |
| `/edit/song` | Profile song |
| `/edit/interests` | Interests & personality |
| `/blog` | Blog dashboard |
| `/blog/new` | Create blog post |
| `/blog/drafts` | Draft management |
| `/blog/settings` | Publication settings |
| `/bulletins` | Bulletin board |
| `/browse` | Browse users |
| `/search` | Search users |
| `/messages` | Messages |
| `/settings` | Account settings |

## Data Ownership

Your data lives on your Personal Data Server (PDS), not on MySky's servers. MySky is just a client that reads and writes to your PDS using the AT Protocol. This means:

- You own your identity, posts, and connections
- Your data is portable to any AT Protocol app
- If MySky disappears, your data stays with you

## Contributing

MySky is open source. Contributions welcome!

## License

MIT
