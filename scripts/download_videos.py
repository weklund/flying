#!/usr/bin/env python3
"""Download MIT 16.687 lecture MP4s from archive.org into videos/."""

from __future__ import annotations

import argparse
import json
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / "16.687-january-iap-2019"
OUT_DIR = ROOT / "videos"
GALLERY = COURSE / "video_galleries" / "class-videos" / "data.json"


def load_videos() -> list[dict]:
    data = json.loads(GALLERY.read_text(encoding="utf-8"))
    rows = []
    for v in data.get("videos") or []:
        vf = v.get("video_files") or {}
        meta = v.get("video_metadata") or {}
        url = vf.get("archive_url")
        if not url:
            continue
        rows.append(
            {
                "title": v.get("title") or "Untitled",
                "url": url,
                "filename": Path(url).name,
                "youtube_id": meta.get("youtube_id"),
            }
        )
    return rows


def download(url: str, dest: Path, force: bool = False) -> None:
    if dest.exists() and dest.stat().st_size > 1_000_000 and not force:
        print(f"  skip (exists): {dest.name} ({dest.stat().st_size / 1e6:.1f} MB)")
        return
    dest.parent.mkdir(parents=True, exist_ok=True)
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
    print(f"  ok: {dest.name} ({dest.stat().st_size / 1e6:.1f} MB)")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--only",
        type=int,
        nargs="*",
        help="1-based video indices to download (from gallery order)",
    )
    parser.add_argument("--list", action="store_true", help="List videos and exit")
    parser.add_argument("--force", action="store_true", help="Re-download existing files")
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be downloaded",
    )
    args = parser.parse_args()

    videos = load_videos()
    if not videos:
        print("No videos found in gallery JSON.", file=sys.stderr)
        return 1

    if args.list:
        for i, v in enumerate(videos, 1):
            print(f"{i:2d}. {v['title']}\n    {v['url']}")
        return 0

    selected = videos
    if args.only:
        selected = []
        for i in args.only:
            if i < 1 or i > len(videos):
                print(f"Invalid index: {i} (1–{len(videos)})", file=sys.stderr)
                return 1
            selected.append(videos[i - 1])

    print(f"Will fetch {len(selected)} video(s) into {OUT_DIR}/")
    print("Sources are archive.org MIT OCW mirrors (CC BY-NC-SA 4.0).")
    for v in selected:
        print(f"\n{v['title']}")
        dest = OUT_DIR / v["filename"]
        if args.dry_run:
            print(f"  would write {dest}")
            continue
        try:
            download(v["url"], dest, force=args.force)
        except Exception as e:
            print(f"  ERROR: {e}", file=sys.stderr)
            # continue with others
    print("\nDone. Re-run scripts/build_study_index.py to link local files in STUDY_INDEX.md.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
