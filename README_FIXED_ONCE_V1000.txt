FIXED ONCE v1000

This version removes the destructive patch scripts and returns the app to the original working architecture.

What was fixed:
- Removed old experimental layout scripts that were emptying Start Survey.
- Replaced collector-final-fixes.js with a safe non-destructive version.
- Replaced collector-final-fixes.css with safe layout-only CSS.
- Fixed app-db.js so survey dropdown options do not crash with "select.options is not iterable".
- Ensured #survey-name is a <select>, as app-db expects.
- Added a safe startApp user guard to prevent null displayName crash.
- Kept core app scripts and workflows:
  app-db.js, app-wizard.js, app-map.js, app-sync.js, app-sync-hotfix.js,
  ministry-full-form.js, geometry-capture-fix.js, offline-sync-engine.js, second-plot-helper.js.

Install:
1. Replace your frontend folder with this frontend folder, OR copy all files over your current frontend folder.
2. Stop Live Server.
3. Start Live Server.
4. Open exactly:
   http://127.0.0.1:5500/WELCOME.html?screen=collector&v=1000
5. Press Ctrl+F5.
6. If old behavior remains: DevTools > Application > Storage > Clear site data, then reload v=1000.

Do not copy older patch files back into WELCOME.html.
