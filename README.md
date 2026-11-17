# Capoeira Brasil Apps

Served at https://apps.capoeirabrasil.be via GitHub Pages. One folder per app.

- `CongoCalender/` — Congo Capoeira Calendar (CCC), read-only web version, rebuilt daily.
- `launchpad/` — app launchpad. Edit `launchpad/apps.json` to add apps (put icons in `launchpad/icons/`). Sends iPhone users to the App Store, Android users to Google Play, everyone else to the web link. `launchpad/?app=<id>` jumps straight to one app. Or fill in `launchpad/tools/launchpad-apps-template.xlsx` and run `python3 launchpad/tools/xlsx_to_json.py <file.xlsx>` to rebuild `apps.json` (a store cell can say "yes" — the script lists those so the store link can be looked up).
