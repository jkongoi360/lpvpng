# PNG LPV Election Simulator 2027

A Next.js application for simulating Papua New Guinea's Limited Preferential Voting (LPV) elections, ward by ward, across all electorates.

## Getting Started

Install dependencies and run the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

The site is password-protected. Create `.env.local` in the project root:

```
SITE_PASSWORD=your_password_here
```

Without `SITE_PASSWORD`, the `/api/auth` endpoint returns a 500 error.

## Data Structure

- `src/data/electorates.json` — all 89 Open electorates with province, seat type, and total registered voters.
- `src/data/llgs/<province>.json` — LLGs and wards grouped by electorate.
- `src/data/electoral-rolls/<electorate>/<llg>/<ward>.csv` — raw electoral roll exports (reference only; not used at runtime).

## Deployment

Production runs on a DigitalOcean droplet under PM2 (process name `lpvpng`). The site is served from `/var/www/lpvpng`. Pushes to `main` are deployed manually:

```bash
ssh root@<droplet> "cd /var/www/lpvpng && git pull origin main && npx next build && pm2 restart lpvpng --update-env"
```

`SITE_PASSWORD` must be set in `/var/www/lpvpng/.env.local` on the server.
