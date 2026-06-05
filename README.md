# DNA Collector

Track your **Duet Night Abyss** collection — queue characters, weapons, and demon wedges to hunt, set your priority order, and check them off as you go.

Data is sourced from [Boarhat.gg](https://boarhat.gg/games/duet-night-abyss/) (v1.4).

## Features

- **My Collection** — priority queue with drag-to-reorder and progress tracking
- **Check off items** — mark targets as collected and watch your completion grow
- **Browse databases** — characters, weapons, and demon wedges with filters
- **One-click Collect** — add anything to your hunt list from browse pages
- **Auto-save** — your list persists in local storage

## Setup

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Refresh game data

```bash
npm run fetch-data
```

## Build for production

```bash
npm run build
npm run preview
```

## Live site

Deployed to GitHub Pages on push to `main`:

[https://mistgg.github.io/dna-planner/](https://mistgg.github.io/dna-planner/)

## Data attribution

Character, weapon, and demon wedge data © [Boarhat.gg](https://boarhat.gg). Fan project — not affiliated with Boarhat or the game developers.
