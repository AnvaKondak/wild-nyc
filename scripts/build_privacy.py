#!/usr/bin/env python3
"""Write docs/PRIVACY.md from src/content/privacy.json, so the in-app policy and the
web version (for the App Store listing) always say the same thing.

Run from the repo root:  python3 scripts/build_privacy.py
"""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
p = json.load(open(os.path.join(ROOT, "src/content/privacy.json")))
CONTACT = p.get("contact") or "the email on our App Store page"
lines = [f"# Wild Neighbors {p['title']}", "", "**We notice. We don't follow.**", "", f"_Updated {p['updated']}_", "", p["summary"], ""]
for s in p["sections"]:
    lines += [f"## {s['heading']}", "", s["body"].replace("{contact}", CONTACT), ""]
open(os.path.join(ROOT, "docs/PRIVACY.md"), "w").write("\n".join(lines))
print("docs/PRIVACY.md")
