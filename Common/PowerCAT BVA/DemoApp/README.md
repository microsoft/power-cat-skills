# PowerCAT BVA — Static Demo

A fully self-contained, static build of the **PowerCAT BVA · Business Value** app.
It runs entirely in the browser with **embedded demo data** — no Power Platform,
no Dataverse, no sign-in, no backend. Ideal for sharing the experience publicly
(e.g. GitHub Pages).

## What's in here

```
demo-site/
  index.html          App entry point
  assets/             JS + CSS bundle (hashed)
  .nojekyll           Tells GitHub Pages to serve files as-is
```

The build uses a relative base path (`./`), so it works from any folder or
sub-path — no configuration needed.

## What the demo shows

- The full dashboard: KPI tiles, value-by-business-unit chart, attestation
  doughnut, top-apps chart, and the searchable / sortable submissions grid.
- The **Submit value** screen with the type-to-search app picker and live value
  preview. Submissions update the in-memory demo data for the session (they are
  **not** persisted — a page reload resets the demo).
- ~40 sample apps across the business units with realistic value submissions.

> The demo data is illustrative only and contains no real customer information.

## Deploy to GitHub Pages

### Option A — project site from a `docs/` or `/` folder

1. Create a new GitHub repository (or use an existing one).
2. Copy the **contents** of this `demo-site/` folder into the repo (either the
   repo root, or a `docs/` folder).
3. Commit and push.
4. In the repo: **Settings → Pages**.
5. Under **Build and deployment**, set **Source = Deploy from a branch**, pick
   your branch, and the folder (`/root` or `/docs`) you used. Save.
6. Wait a minute; your demo is live at
   `https://<user>.github.io/<repo>/`.

### Option B — `gh-pages` branch

```bash
# from a clone of your repo, with this folder's contents at the root
git checkout --orphan gh-pages
git add .
git commit -m "PowerCAT BVA static demo"
git push origin gh-pages
# then Settings → Pages → Source = gh-pages branch, / (root)
```

That's it — because the app uses a relative base path and ships its own data,
nothing else needs configuring.

## Rebuilding the demo

From the app project (`BusinessValueSolution/ValueDashboardApp`):

```powershell
npm install
npm run build:demo      # outputs a fresh static build into ./demo
```

Then copy the contents of `./demo` over this folder (keep `.nojekyll`).
