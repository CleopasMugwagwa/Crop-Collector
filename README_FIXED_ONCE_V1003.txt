FIXED ONCE v1003

Fixes the v1002 issue where Crop Survey selected, but no form question appeared.

What was added:
- Repair active ODK question display after clicking Crop/Livestock.
- Forces the active questionnaire section and active input group visible.
- If app-wizard fails to show a field, it falls back to Crop Type for crop or Questionnaire ID for livestock.
- Keeps the original wizard/form logic intact.

Install:
1. Replace your frontend folder with this frontend folder.
2. Stop Live Server.
3. Start Live Server.
4. Open:
   http://127.0.0.1:5500/WELCOME.html?screen=collector&v=1003
5. Ctrl+F5.
