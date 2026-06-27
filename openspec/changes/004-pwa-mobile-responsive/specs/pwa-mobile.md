# Spec: PWA + Mobile Responsive

## PWA Configuration

### Library: `@ducanh2912/next-pwa`

Battle-tested for Next.js 14 App Router. Workbox-based service worker generation.

### Manifest (`public/manifest.json`)

```json
{
  "name": "SMD Chess — Percasi Sumedang",
  "short_name": "SMD Chess",
  "description": "Sistem manajemen turnamen catur — registrasi online, verifikasi pembayaran, dan Swiss pairing",
  "theme_color": "#1d4ed8",
  "background_color": "#ffffff",
  "display": "standalone",
  "start_url": "/",
  "icons": [
    { "src": "/icons/icon-192x192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512x512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

### next.config.mjs PWA Settings

```js
import withPWA from "@ducanh2912/next-pwa";

const nextConfig = {
  images: { remotePatterns: [...] },
};

export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    { urlPattern: /^\/_next\/static\/.*/, handler: "CacheFirst" },
    { urlPattern: /^\/icons\/.*/, handler: "CacheFirst" },
    { urlPattern: /^\/(jadwal|klasemen|pairing)\/.*/, handler: "NetworkFirst", options: { expiration: { maxAgeSeconds: 300 } } },
  ],
})(nextConfig);
```

### Root Layout Additions (`src/app/layout.tsx`)

```html
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#1d4ed8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

---

## Mobile Responsive Patterns

### TV Pairing View — Responsive Grid

**File:** `src/app/(public)/pairing/[code]/[round]/tv-pairing-view.tsx`

| Viewport | Columns | Layout |
|----------|---------|--------|
| < 768px (mobile) | 1 | Stack vertically, max 17 items per column |
| 768-1024px (tablet) | 2 | Side by side |
| > 1024px (desktop/projector) | 3 | Original layout |

```tsx
// Before (line 63):
<main className="flex-1 grid grid-cols-3 divide-x ...">

// After:
<main className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 divide-x-0 md:divide-x ...">
```

### Tables — Horizontal Scroll Pattern

All tables use the same pattern:

```tsx
<div className="overflow-x-auto rounded-lg border border-gray-200">
  <table className="w-full min-w-[600px] text-sm">
    ...
  </table>
</div>
```

`min-w-[600px]` ensures table triggers horizontal scroll when viewport < 600px. Content remains readable — no text clipping.

### Match Row — Truncate Names

```tsx
// Before (no truncation):
<span className="font-medium min-w-[150px] text-right">
  {nameMap.get(match.player1_id)}
</span>

// After (with truncation):
<span className="font-medium min-w-[0] flex-1 text-right truncate">
  {nameMap.get(match.player1_id)}
</span>
```

---

## Offline Page

### File: `src/app/offline/page.tsx`

Simple server component. Shows when service worker can't serve a cached response.

```tsx
export default function OfflinePage() {
  return (
    <main className="flex-1 flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <div className="text-6xl">♟</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Anda sedang offline
        </h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-sm">
          Halaman ini tidak tersedia dalam mode offline.
          Silakan cek koneksi internet Anda dan coba lagi.
        </p>
      </div>
    </main>
  );
}
```

---

## Testing Checklist

### PWA
- [ ] App installable di Chrome desktop (lighthouse PWA audit)
- [ ] Manifest loads correctly
- [ ] Service worker registers without errors

### Mobile Responsive
- [ ] Pairing view: 1 column on 320px, readable text, no horizontal scroll
- [ ] Klasemen table: scrolls horizontally, row height readable
- [ ] Jadwal matches: names truncate, no overflow
- [ ] Admin tables: all scrollable, buttons accessible
- [ ] Forms (daftar, login): fit within 320px viewport
