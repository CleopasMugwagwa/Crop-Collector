FIXED ONCE v1001

This fixes the v1000 error:
ReferenceError: ensureSurveyNameSelectElement is not defined

Cause:
The helper was inserted inside a service-worker catch block in app-db.js, so renderSurveyNameOptions could not access it.

Fix:
The helper is now placed directly before renderSurveyNameOptions in app-db.js.
The survey dropdown also safely handles select.options.

Install:
1. Replace your current frontend folder with this frontend folder.
2. Stop Live Server.
3. Start Live Server.
4. Open:
   http://127.0.0.1:5500/WELCOME.html?screen=collector&v=1001
5. Press Ctrl + F5.
6. If old JS still loads, clear site data.
