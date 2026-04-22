# Anubis-Alpha — `/public` Cleanup List

The `Anubis_UI/frontend/public/` folder is sitting on top of a Vercel/Next.js marketing template. Much of it is **template debris** that cannot ship as Anubis without legal or brand consequences.

This doc triages every file in that folder into one of three categories.

---

## ✅ KEEP (copy from `Anubis_UI/frontend/public/` → `anubis-alpha/frontend/public/`)

These are utility assets you actively need.

| File | Why keep |
|---|---|
| `placeholder.jpg` | Fallback image for broken/missing sources |
| `placeholder.svg` | Vector fallback |
| `placeholder-logo.png` | Fallback logo placeholder |
| `placeholder-logo.svg` | Vector version of above |
| `placeholder-user.jpg` | Fallback user avatar |
| `images/large-card-background.svg` | Generic decorative asset — no branding |

Optionally keep (rename to make the intent obvious in an Anubis context):

| File | Action | New location |
|---|---|---|
| `images/mcp-integrations/figma.svg` | Move | `images/tech-stack/figma.svg` |
| `images/mcp-integrations/nextjs.svg` | Move | `images/tech-stack/nextjs.svg` |
| `images/mcp-integrations/react.svg` | Move | `images/tech-stack/react.svg` |
| `images/mcp-integrations/shadcn.svg` | Move | `images/tech-stack/shadcn.svg` |
| `images/mcp-integrations/tailwind-css.svg` | Move | `images/tech-stack/tailwind.svg` |
| `images/mcp-integrations/resend.svg` | Move | `images/tech-stack/resend.svg` |

Useful on an About page or "Built with" section.

---

## 🔁 REPLACE before launch (placeholder OK for local dev)

These files work locally but **must be replaced with real Anubis brand assets before the site goes public**.

| File | Replacement plan |
|---|---|
| `apple-icon.png` | 180x180 Anubis icon (PWA touch icon) |
| `icon.svg` | Anubis favicon, monochrome |
| `icon-dark-32x32.png` | Dark-theme 32x32 favicon |
| `icon-light-32x32.png` | Light-theme 32x32 favicon |
| `favicon.ico` | Classic ICO fallback |

**Until the brand is locked:** leave these as the template defaults — they won't hurt during development. Swap them in Week 6 of the roadmap (pre-launch brand pass).

---

## 🚫 DELETE — do not ship (template debris)

### Legal / brand risk — delete immediately

| File | Reason |
|---|---|
| `images/guillermo-rauch.png` | Photo of Vercel's CEO. Cannot appear in a product you're selling. Delete now. |

### Licensed stock / other people's branding

| File | Reason |
|---|---|
| `images/avatars/albert-flores.png` | Figma / Untitled UI "Wireframe Avatars" stock photo |
| `images/avatars/annette-black.png` | Same |
| `images/avatars/cameron-williamson.png` | Same |
| `images/avatars/cody-fisher.png` | Same |
| `images/avatars/darlene-robertson.png` | Same |
| `images/avatars/dianne-russell.png` | Same |
| `images/avatars/robert-fox.png` | Same |

Safe during local dev as placeholder faces on testimonial cards. Must go before public launch unless you license them. My recommendation: **delete them and remove the testimonial section from the landing page** until you have real customer quotes with real headshots (and permission). An empty testimonial section looks worse than no section.

### Fake customer logos

| File | Reason |
|---|---|
| `logos/logo01.svg` | Template's generic "trusted by" logo |
| `logos/logo02.svg` | Same |
| `logos/logo03.svg` | Same |
| `logos/logo04.svg` | Same |
| `logos/logo05.svg` | Same |
| `logos/logo06.svg` | Same |
| `logos/logo07.svg` | Same |
| `logos/logo08.svg` | Same |

**Delete the entire `logos/` folder** and the "Trusted by" row from the landing page until you have real contractor customers who've agreed to be named. Empty rows scream "new product" louder than no row at all.

### Vercel's own product screenshots

These are Vercel's marketing images — they cannot appear as Anubis screenshots.

| File | Reason |
|---|---|
| `images/ai-code-reviews.png` | Vercel marketing asset |
| `images/dashboard-preview.png` | Vercel marketing asset |
| `images/deployment-easy.png` | Vercel marketing asset |
| `images/mcp-connectivity.png` | Vercel marketing asset |
| `images/new-product-ui.jpeg` | Vercel marketing asset |
| `images/one-click-integrations.png` | Vercel marketing asset |
| `images/parallel-coding-agents.png` | Vercel marketing asset |
| `images/product-ui.jpeg` | Vercel marketing asset |
| `images/realtime-coding-previews.png` | Vercel marketing asset |

**Delete all of them.** Replace with real Anubis dashboard/opportunity/portal screenshots once those views are styled and populated with demo data. Use `placeholder.jpg` as the stand-in while building.

---

## 🎯 Proposed final `/public` structure

After cleanup, aim for this:

```
frontend/public/
├── apple-icon.png              ← placeholder now, Anubis icon pre-launch
├── icon.svg                    ← placeholder now, Anubis icon pre-launch
├── icon-dark-32x32.png         ← placeholder
├── icon-light-32x32.png        ← placeholder
├── favicon.ico                 ← add if missing
├── placeholder.jpg             ← keep (fallback)
├── placeholder.svg             ← keep (fallback)
├── placeholder-logo.png        ← keep (fallback)
├── placeholder-logo.svg        ← keep (fallback)
├── placeholder-user.jpg        ← keep (fallback)
├── images/
│   ├── large-card-background.svg   ← keep
│   ├── tech-stack/                 ← renamed from mcp-integrations
│   │   ├── figma.svg
│   │   ├── nextjs.svg
│   │   ├── react.svg
│   │   ├── resend.svg
│   │   ├── shadcn.svg
│   │   └── tailwind.svg
│   └── screenshots/                ← NEW, empty for now
│                                   ← real Anubis screens go here as they ship
└── brand/                          ← NEW, empty for now
                                    ← Anubis logo/wordmark variants go here
```

Everything else — gone.

---

## One-shot cleanup script (optional)

If you want to automate the deletion after copying the Anubis_UI `public/` folder into `anubis-alpha/frontend/public/`, run this from the project root:

```bash
cd frontend/public

# Legal risk
rm -f images/guillermo-rauch.png

# Licensed avatars
rm -rf images/avatars/

# Fake customer logos
rm -rf logos/

# Vercel screenshots
rm -f images/ai-code-reviews.png
rm -f images/dashboard-preview.png
rm -f images/deployment-easy.png
rm -f images/mcp-connectivity.png
rm -f images/new-product-ui.jpeg
rm -f images/one-click-integrations.png
rm -f images/parallel-coding-agents.png
rm -f images/product-ui.jpeg
rm -f images/realtime-coding-previews.png

# Rename the tech stack folder
mv images/mcp-integrations images/tech-stack

# Create empty folders for future assets
mkdir -p images/screenshots brand

echo "Cleanup complete. Verify with: ls -R"
```

---

## Why this matters

The difference between a premium-feeling SaaS and a template with a new name slapped on it is often a single bad asset. A stock Figma avatar on your homepage. A Vercel dashboard screenshot labeled "Anubis." The fake "trusted by" logos a contractor can spot in a second because they recognize the template.

The goal: when a prospect lands on your site, every image is either a **real Anubis screenshot**, a **real customer logo**, or **clean negative space**. That restraint is what separates a product from a prototype.

---

*Friction point removed for the end-user: by deciding the cleanup up front — before you've published anything — you never have to issue a takedown, explain yourself to Vercel, or re-license a stock avatar after a launch email has already gone out. The cost of doing this now is 10 minutes. The cost of doing it after launch is a weekend and some trust.*
