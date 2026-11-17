#!/usr/bin/env python3
"""Turn Steven's Excel list (launchpad-apps.xlsx) into launchpad/apps.json.

Usage: python3 launchpad/tools/xlsx_to_json.py path/to/launchpad-apps.xlsx

Columns: App name | Short description | Web app link | App Store | Google Play | Icon (optional)
A store cell may hold a link or just "yes". Rows with "yes" are reported so the real
store link can be looked up and pasted into apps.json (or back into the sheet).
Existing icons in apps.json are kept when the app name matches.
"""
import json, re, sys, unicodedata
from pathlib import Path
from openpyxl import load_workbook

OUT = Path(__file__).resolve().parent.parent / "apps.json"

def slug(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")

def cell(v):
    return str(v).strip() if v is not None else ""

def main(xlsx):
    ws = load_workbook(xlsx, data_only=True)["Apps"]
    old = json.loads(OUT.read_text()) if OUT.exists() else {}
    old_by_name = {a["name"].lower(): a for a in old.get("apps", [])}
    apps, todo = [], []
    for row in ws.iter_rows(min_row=2, values_only=True):
        name, desc, web, ios, android, icon = (list(row) + [None] * 6)[:6]
        name = cell(name)
        if not name:
            continue
        prev = old_by_name.get(name.lower(), {})
        a = {"id": prev.get("id") or slug(name), "name": name, "description": cell(desc),
             "icon": cell(icon) or prev.get("icon", ""), "web": cell(web),
             "appstore": cell(ios), "playstore": cell(android)}
        for k in ("appstore", "playstore"):
            v = a[k]
            if v.lower() in ("yes", "y", "ja", "oui", "sim", "x"):
                a[k] = prev.get(k, "") if prev.get(k, "").startswith("http") else ""
                if not a[k]:
                    todo.append(f"{name}: look up {k} link")
            elif v and not v.startswith("http"):
                a[k] = ""
        if a["icon"] and not a["icon"].startswith(("http", "icons/", "img/")):
            a["icon"] = "icons/" + a["icon"]
        apps.append(a)
    data = {k: v for k, v in old.items() if k != "apps"}
    data["apps"] = apps
    OUT.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    print(f"Wrote {len(apps)} apps to {OUT}")
    for t in todo:
        print("TODO", t)

if __name__ == "__main__":
    main(sys.argv[1])
