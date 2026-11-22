#!/usr/bin/env python3
"""Turn Steven's Excel list (launchpad-apps.xlsx) into launchpad/apps.json.

Usage: python3 launchpad/tools/xlsx_to_json.py path/to/launchpad-apps.xlsx

Columns (found by header name, any order): Section | App name | Short description | Web app link |
App Store | Google Play | Icon (optional) | Hidden (Y = only on the owner's phone) | Coming soon (Y = shows a "Coming soon" tag instead of Open). Section: 1/Congo, 2/Friends, 3/Other (empty = other).
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
    rows = list(ws.iter_rows(values_only=True))
    head = [cell(h).lower() for h in rows[0]]
    def col(row, *keys):
        for i, h in enumerate(head):
            if any(h.startswith(k) for k in keys) and i < len(row):
                return row[i]
        return None
    for row in rows[1:]:
        name, desc, web = col(row, "app name", "name"), col(row, "short desc", "desc"), col(row, "web")
        ios, android, icon = col(row, "app store"), col(row, "google play", "play"), col(row, "icon")
        sec = cell(col(row, "section")).lower()
        hidden = cell(col(row, "hidden")).lower() in ("y", "yes", "ja", "x", "true", "1")
        soon = cell(col(row, "coming soon", "soon")).lower() in ("y", "yes", "ja", "x", "true", "1")
        name = cell(name)
        if not name:
            continue
        prev = old_by_name.get(name.lower(), {})
        section = ("congo" if sec.startswith(("1", "congo a", "congo")) and "friend" not in sec
                   else "friends" if sec.startswith("2") or "friend" in sec
                   else "other" if sec else prev.get("section", "other"))
        a = {"section": section, "id": prev.get("id") or slug(name), "name": name, "description": cell(desc),
             "icon": cell(icon) or prev.get("icon", ""), "web": cell(web),
             "appstore": cell(ios), "playstore": cell(android)}
        if hidden:
            a["hidden"] = True
        if soon:
            a["soon"] = True
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
