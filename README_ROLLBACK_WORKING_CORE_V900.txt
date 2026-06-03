ROLLBACK WORKING CORE v900

This is a rollback-style file, not another aggressive UI redesign.

What was done:
- Removed the experimental form/layout patch scripts that were fighting each other.
- Kept the core app scripts: app-db, app-map, app-sync, geometry capture, offline sync, second plot helper, ministry form scripts.
- Fixed the startup null displayName issue safely.
- Fixed the survey dropdown error by making #survey-name a real <select>, because app-db expects select.options.
- Added only minimal CSS cleanup.

Install:
1. Copy WELCOME.html into the frontend folder and replace the current file.
2. Stop Live Server.
3. Start Live Server.
4. Open exactly:
   http://127.0.0.1:5500/WELCOME.html?screen=collector&v=900
5. Press Ctrl + F5.

If still loading old scripts:
DevTools > Application > Storage > Clear site data.
Then close the tab, restart Live Server, and reopen v=900.

If this still does not restore the app, the safest next step is to use your last known working ZIP/file from Downloads, Recycle Bin, Git, VS Code Timeline, or Windows Previous Versions.
