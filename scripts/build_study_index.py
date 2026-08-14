#!/usr/bin/env python3
"""Build STUDY_INDEX.md from the MIT OCW 16.687 offline dump."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
COURSE = ROOT / "16.687-january-iap-2019"
OUT = ROOT / "STUDY_INDEX.md"


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def strip_html(text: str) -> str:
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def resolve_resource_pdf(resource_href: str) -> str | None:
    """Map ../../resources/<slug>/index.html -> local static_resources PDF if present."""
    m = re.search(r"resources/([^/]+)/", resource_href)
    if not m:
        return None
    slug = m.group(1)
    res_data = COURSE / "resources" / slug / "data.json"
    if not res_data.exists():
        return None
    data = load_json(res_data)
    file_path = data.get("file") or ""
    # file is like /courses/.../HASH_name.pdf
    name = Path(file_path).name
    if not name:
        return None
    local = COURSE / "static_resources" / name
    if local.exists():
        return str(local.relative_to(ROOT))
    return None


def parse_lecture_notes() -> list[dict]:
    ln = load_json(COURSE / "pages" / "lecture-notes" / "data.json")
    content = ln.get("content", "")
    rows = re.findall(
        r"<tr>\s*<td>\s*(\d+)\s*</td>\s*<td>\s*(.*?)\s*</td>",
        content,
        re.S,
    )
    sessions = []
    for ses, body in rows:
        links = re.findall(r'href="([^"]+)"[^>]*>([^<]+)', body)
        plain = strip_html(body)
        materials = []
        for href, label in links:
            pdf = resolve_resource_pdf(href)
            materials.append(
                {
                    "label": strip_html(label),
                    "resource_page": href.replace("../../", "16.687-january-iap-2019/"),
                    "pdf": pdf,
                }
            )
        sessions.append(
            {
                "ses": int(ses),
                "title": plain,
                "materials": materials,
                "available": "not available" not in plain.lower(),
            }
        )
    return sessions


def parse_videos() -> list[dict]:
    vg = load_json(COURSE / "video_galleries" / "class-videos" / "data.json")
    videos = []
    for v in vg.get("videos") or []:
        vf = v.get("video_files") or {}
        meta = v.get("video_metadata") or {}
        videos.append(
            {
                "title": v.get("title") or "Untitled",
                "archive_url": vf.get("archive_url"),
                "youtube_id": meta.get("youtube_id"),
                "uid": v.get("uid"),
            }
        )
    return videos


def match_video(session_title: str, videos: list[dict]) -> dict | None:
    # Normalize for fuzzy match
    def norm(s: str) -> str:
        s = s.lower()
        s = re.sub(r"\(pdf.*?\)", "", s)
        s = re.sub(r"[^a-z0-9]+", " ", s)
        return s.strip()

    st = norm(session_title)
    # Prefer lecture number if present
    lec_m = re.search(r"lecture\s+(\d+)", st)
    special_m = re.search(r"special lecture[:\s]+(.+)", st)

    best = None
    best_score = 0
    for v in videos:
        vt = norm(v["title"])
        score = 0
        if lec_m and re.search(rf"lecture\s+{lec_m.group(1)}\b", vt):
            score += 10
        if special_m:
            key = special_m.group(1)[:20]
            if key[:12] in vt:
                score += 8
        # token overlap
        stoks = set(st.split())
        vtoks = set(vt.split())
        if stoks & vtoks:
            score += len(stoks & vtoks)
        if score > best_score:
            best_score = score
            best = v
    return best if best_score >= 5 else None


def instructor_insights() -> list[tuple[str, str]]:
    root = COURSE / "pages" / "instructor-insights"
    items = []
    for child in sorted(root.iterdir()):
        if not child.is_dir():
            continue
        data_path = child / "data.json"
        if not data_path.exists():
            continue
        data = load_json(data_path)
        title = data.get("title") or child.name
        rel = str((child / "index.html").relative_to(ROOT))
        items.append((title, rel))
    return items


def faa_handbooks() -> list[dict]:
    faa_dir = ROOT / "study" / "faa-handbooks"
    catalog = [
        {
            "title": "Pilot’s Handbook of Aeronautical Knowledge",
            "doc": "FAA-H-8083-25C",
            "filename": "FAA-H-8083-25C_Pilots_Handbook_of_Aeronautical_Knowledge.pdf",
            "official": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak",
            "pdf_url": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/faa-h-8083-25c.pdf",
        },
        {
            "title": "Airplane Flying Handbook",
            "doc": "FAA-H-8083-3C",
            "filename": "FAA-H-8083-3C_Airplane_Flying_Handbook.pdf",
            "official": "https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/airplane_handbook",
            "pdf_url": "https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/00_afh_full.pdf",
        },
    ]
    for item in catalog:
        path = faa_dir / item["filename"]
        item["local"] = str(path.relative_to(ROOT)) if path.exists() else None
        item["size_mb"] = round(path.stat().st_size / 1e6, 1) if path.exists() else None
    return catalog


def main() -> None:
    course = load_json(COURSE / "data.json")
    sessions = parse_lecture_notes()
    videos = parse_videos()
    insights = instructor_insights()
    faa = faa_handbooks()

    lines: list[str] = []
    lines.append("# Private Pilot Ground School — Study Index")
    lines.append("")
    lines.append(
        f"**{course.get('course_title')}** · MIT **{course.get('primary_course_number')}** · "
        f"{course.get('term')} {course.get('year')}"
    )
    lines.append("")
    instructors = ", ".join(
        i.get("title") or f"{i.get('first_name')} {i.get('last_name')}"
        for i in course.get("instructors") or []
    )
    lines.append(f"**Instructors:** {instructors}")
    lines.append("")
    lines.append(course.get("course_description", "").strip())
    lines.append("")
    lines.append("**License:** CC BY-NC-SA 4.0 (MIT OCW materials)")
    lines.append("")
    lines.append("**Offline course root:** [`16.687-january-iap-2019/index.html`](16.687-january-iap-2019/index.html)")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## Quick start")
    lines.append("")
    lines.append("1. Open the [course home](16.687-january-iap-2019/index.html) in a browser.")
    lines.append("2. Work through sessions below (PDF slides are offline; videos need download or YouTube).")
    lines.append("3. Read FAA handbooks in [`study/faa-handbooks/`](study/faa-handbooks/).")
    lines.append("4. Drill knowledge with the [quiz app](quiz/index.html).")
    lines.append("5. Optional: `python3 scripts/download_videos.py` to fetch lecture MP4s from archive.org.")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## FAA handbooks (official PDFs)")
    lines.append("")
    lines.append(
        "These are free U.S. government publications. Full books were downloaded into this repo when available."
    )
    lines.append("")
    lines.append("| Handbook | Doc # | Local PDF | Official page |")
    lines.append("|----------|-------|-----------|---------------|")
    for h in faa:
        local = f"[`{h['filename']}`]({h['local']}) ({h['size_mb']} MB)" if h["local"] else "_not downloaded — run `scripts/download_faa_handbooks.py`_"
        lines.append(
            f"| {h['title']} | {h['doc']} | {local} | [FAA]({h['official']}) · [direct PDF]({h['pdf_url']}) |"
        )
    lines.append("")
    lines.append("Also useful (not auto-downloaded): [Helicopter Flying Handbook](https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/helicopter_flying_handbook).")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## Lecture sessions")
    lines.append("")
    lines.append(
        f"{sum(1 for s in sessions if s['available'])} of {len(sessions)} sessions have slide PDFs offline. "
        "Session 18 (Aerobatics) is not available on OCW."
    )
    lines.append("")

    for s in sessions:
        lines.append(f"### Session {s['ses']}: {s['title']}")
        lines.append("")
        if not s["available"]:
            lines.append("_Materials not published on OCW._")
            lines.append("")
            continue
        if s["materials"]:
            lines.append("**Slides / notes**")
            lines.append("")
            for m in s["materials"]:
                if m["pdf"]:
                    lines.append(f"- [{m['label']}]({m['pdf']})")
                else:
                    lines.append(f"- {m['label']} — [resource page]({m['resource_page']})")
            lines.append("")
        vid = match_video(s["title"], videos)
        if vid:
            lines.append("**Video**")
            lines.append("")
            if vid.get("youtube_id"):
                lines.append(
                    f"- YouTube: https://www.youtube.com/watch?v={vid['youtube_id']}"
                )
            if vid.get("archive_url"):
                lines.append(f"- Archive.org MP4: {vid['archive_url']}")
            local_guess = ROOT / "videos" / f"{vid.get('youtube_id') or s['ses']}.mp4"
            # nicer local names from archive basename
            if vid.get("archive_url"):
                local_name = Path(vid["archive_url"]).name
                local_path = ROOT / "videos" / local_name
                if local_path.exists():
                    lines.append(f"- Local: [`videos/{local_name}`](videos/{local_name})")
                else:
                    lines.append(f"- Local (after download): `videos/{local_name}`")
            lines.append("")

    lines.append("---")
    lines.append("")
    lines.append("## All class videos (gallery)")
    lines.append("")
    lines.append("| # | Title | YouTube | Archive.org |")
    lines.append("|---|-------|---------|-------------|")
    for i, v in enumerate(videos, 1):
        yt = (
            f"[watch](https://www.youtube.com/watch?v={v['youtube_id']})"
            if v.get("youtube_id")
            else "—"
        )
        ar = f"[mp4]({v['archive_url']})" if v.get("archive_url") else "—"
        lines.append(f"| {i} | {v['title']} | {yt} | {ar} |")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## Instructor insights")
    lines.append("")
    for title, rel in insights:
        lines.append(f"- [{title}]({rel})")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("## Tools in this repo")
    lines.append("")
    lines.append("| Tool | Purpose |")
    lines.append("|------|---------|")
    lines.append("| `scripts/build_study_index.py` | Regenerate this file |")
    lines.append("| `scripts/download_faa_handbooks.py` | Fetch FAA PHAK + Airplane Flying Handbook PDFs |")
    lines.append("| `scripts/download_videos.py` | Fetch lecture MP4s from archive.org |")
    lines.append("| [`quiz/index.html`](quiz/index.html) | Browser quiz aligned to ground-school topics |")
    lines.append("")
    lines.append("---")
    lines.append("")
    lines.append("*Generated by `scripts/build_study_index.py`. Re-run after downloading videos or handbooks.*")
    lines.append("")

    OUT.write_text("\n".join(lines), encoding="utf-8")
    print(f"Wrote {OUT} ({len(sessions)} sessions, {len(videos)} videos)")


if __name__ == "__main__":
    main()
