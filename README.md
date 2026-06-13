# SMD Chess

Sistem manajemen turnamen catur untuk Percasi Sumedang — registrasi online, verifikasi pembayaran, dan Swiss pairing.

## Setup

### Prerequisites
- Node.js 18+
- Supabase account (free tier)
- Vercel account (free tier)

### Installation

```bash
git clone <repo-url>
cd smd_chess
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Required variables:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Setup

Run Supabase migrations:
```bash
npx supabase db push
```

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Testing

```bash
npm test
```

## Deployment

### Vercel

1. Connect repo to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy

### Supabase

1. Create production project
2. Run migrations against production
3. Update Vercel env vars with production keys

## Project Structure

See `openspec/project.md` for detailed specification.

## License

Private — Percasi Sumedang
