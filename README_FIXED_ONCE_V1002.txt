FIXED ONCE v1002

This fixes the v1001 display problem:
- Start Survey was showing only Save buttons.
- Survey dropdown, Crop Survey and Livestock Survey buttons were missing.

Fix:
- collector-final-fixes.js now restores the Start Survey card if app-wizard fails to render it.
- Save buttons are hidden until a module is selected.
- Crop/Livestock buttons call the original app flow where available, with a fallback.
- No old destructive patch scripts are restored.

Install:
1. Replace frontend folder with this frontend folder.
2. Stop Live Server.
3. Start Live Server.
4. Open:
   http://127.0.0.1:5500/WELCOME.html?screen=collector&v=1002
5. Ctrl+F5.
6. If needed, clear site data.
