# Flying — Private Pilot Study Kit

Personal study notes and interactive tools for private pilot ground school, built around
**[MIT OCW 16.687 Private Pilot Ground School](https://ocw.mit.edu/courses/16-687-private-pilot-ground-school-january-iap-2019/)**
(January IAP 2019) and the FAA Pilot’s Handbook of Aeronautical Knowledge.

**Educational only — not for flight planning.** Use the AFM/POH for the airplane you fly.

## Live site (GitHub Pages)

**https://weklund.github.io/flying/**

| Page | Path |
|------|------|
| Home | `/` |
| **Aircraft Performance Lab** | `/learn/aircraft-performance/` |
| **Lift Theory Lab** | `/learn/lift-theory/` |
| Practice quiz | `/quiz/` |
| Study notes | `/notes/` |
| Density altitude note | `/notes/density-altitude.html` |
| Bernoulli note | `/notes/bernoulli-differential-pressure.html` |

## What’s in the repo

| Path | Description |
|------|-------------|
| [`index.html`](index.html) | Study hub (GitHub Pages home) |
| [`learn/aircraft-performance/`](learn/aircraft-performance/) | Interactive density altitude & performance lab |
| [`learn/lift-theory/`](learn/lift-theory/) | Interactive lift theory (Bernoulli → circulation) |
| [`quiz/`](quiz/) | Browser practice quiz |
| [`notes/`](notes/) | Short HTML study notes (DA, Bernoulli, …) |
| [`STUDY_INDEX.md`](STUDY_INDEX.md) | Session-by-session MIT 16.687 index |
| [`16.687-january-iap-2019/`](16.687-january-iap-2019/) | Offline OCW HTML dump (optional local) |
| [`study/faa-handbooks/`](study/faa-handbooks/) | Download script + sources (PDFs gitignored — too large) |
| [`scripts/`](scripts/) | Index builder + FAA / video download helpers |

## License notes

- MIT OCW course materials: [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)
- FAA handbooks: U.S. government works (public domain in the U.S.)
- Interactive lab, quiz, and notes: personal study aids — verify against primary sources

## First-time GitHub + Pages setup

```bash
cd /path/to/flying
git init
git add .
git commit -m "Initial flying study kit with performance lab and Pages site"

# Create repo (GitHub CLI) — public recommended for free Pages
gh repo create flying --public --source=. --remote=origin --push

# Or: create empty repo on github.com, then:
# git remote add origin git@github.com:YOU/flying.git
# git branch -M main
# git push -u origin main
```

Then enable Pages:

1. Repo **Settings → Pages**
2. **Source:** GitHub Actions  
   (this repo includes [`.github/workflows/pages.yml`](.github/workflows/pages.yml))
3. Wait for the **Deploy GitHub Pages** workflow to finish
4. Open the site URL shown under Settings → Pages

Alternative: **Deploy from a branch** → `main` → `/ (root)`. The `.nojekyll` file keeps pure static HTML working.

### Project site URL shape

`https://YOU.github.io/REPO/`

All links in this kit are **relative**, so they work both on Pages and from a local server.

## Local quick start

```bash
# Optional: fetch FAA PDFs (not stored in git — AFH is ~260MB)
python3 scripts/download_faa_handbooks.py

# Local server (recommended)
python3 -m http.server 8080
# http://localhost:8080/
# http://localhost:8080/learn/aircraft-performance/
# http://localhost:8080/quiz/
```

## FAA handbooks

| Handbook | Doc | Official |
|----------|-----|----------|
| Pilot’s Handbook of Aeronautical Knowledge | FAA-H-8083-25C | [PHAK](https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak) |
| Airplane Flying Handbook | FAA-H-8083-3C | [AFH](https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/airplane_handbook) |

PDFs are **gitignored** so the repo stays under GitHub’s file-size limits. See [`study/faa-handbooks/SOURCES.md`](study/faa-handbooks/SOURCES.md).

## Notes

- Lecture videos are not required for Pages; use YouTube links in `STUDY_INDEX.md` or `scripts/download_videos.py` locally.
- The quiz is **practice only**, not an FAA knowledge-test bank.
- Performance Lab numbers are educational models — never a substitute for the AFM/POH.
