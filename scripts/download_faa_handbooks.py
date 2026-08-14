#!/usr/bin/env python3
"""Download official FAA ground-school handbooks into study/faa-handbooks/."""

from __future__ import annotations

import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "study" / "faa-handbooks"

HANDBOOKS = [
    {
        "filename": "FAA-H-8083-25C_Pilots_Handbook_of_Aeronautical_Knowledge.pdf",
        "url": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/faa-h-8083-25c.pdf",
        "title": "Pilot’s Handbook of Aeronautical Knowledge (FAA-H-8083-25C)",
    },
    {
        "filename": "FAA-H-8083-3C_Airplane_Flying_Handbook.pdf",
        "url": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/00_afh_full.pdf",
        "title": "Airplane Flying Handbook (FAA-H-8083-3C)",
    },
]


def download(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.exists() and dest.stat().st_size > 1_000_000:
        print(f"  skip (exists): {dest.name} ({dest.stat().st_size / 1e6:.1f} MB)")
        return
    print(f"  downloading {dest.name} …")
    req = urllib.request.Request(url, headers={"User-Agent": "flying-study-tools/1.0"})
    with urllib.request.urlopen(req, timeout=600) as resp, dest.open("wb") as f:
        total = resp.headers.get("Content-Length")
        total_n = int(total) if total else None
        read = 0
        while True:
            chunk = resp.read(1024 * 256)
            if not chunk:
                break
            f.write(chunk)
            read += len(chunk)
            if total_n:
                pct = 100 * read / total_n
                print(f"\r  {pct:5.1f}%  ({read / 1e6:.1f} / {total_n / 1e6:.1f} MB)", end="")
        print()
    # basic sanity check
    head = dest.read_bytes()[:5]
    if head != b"%PDF-":
        dest.unlink(missing_ok=True)
        raise RuntimeError(f"Download does not look like a PDF: {dest}")
    print(f"  ok: {dest} ({dest.stat().st_size / 1e6:.1f} MB)")


def main() -> int:
    print(f"Output directory: {OUT_DIR}")
    for book in HANDBOOKS:
        print(f"\n{book['title']}")
        print(f"  {book['url']}")
        try:
            download(book["url"], OUT_DIR / book["filename"])
        except Exception as e:
            print(f"  ERROR: {e}", file=sys.stderr)
            return 1
    print("\nDone. Re-run scripts/build_study_index.py to refresh STUDY_INDEX.md.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
