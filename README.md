# Capoeira Brasil Apps

Served at https://apps.capoeirabrasil.be via GitHub Pages. One folder per app.

- `CongoCalender/` — Congo Capoeira Calendar (CCC), read-only web version, rebuilt daily.
- `launchpad/` — app launchpad. Edit `launchpad/apps.json` to add apps (put icons in `launchpad/icons/`). Sends iPhone users to the App Store, Android users to Google Play, everyone else to the web link. `launchpad/?app=<id>` jumps straight to one app. Or fill in `launchpad/tools/launchpad-apps-template.xlsx` and run `python3 launchpad/tools/xlsx_to_json.py <file.xlsx>` to rebuild `apps.json` (a store cell can say "yes" — the script lists those so the store link can be looked up).
  The live list is kept in Steven's Google Sheet "Visão do Jogo & Friends – Launchpad apps" (Drive id `1a_GPf1yl71isCH4navvvpN9qkVf34IsnDjqCXq-jcog`; a "(v2)" copy with a Hidden column is `1nYifvegw439Nf3l6I1WKY03lyDi5fBpX6Jsf-7vouuM`, use whichever Steven edited last). On "update the launchpad", export it and run the converter; store links already in apps.json are kept for "yes" cells, icons are kept by app name.
