FIXED ONCE v1028 - stabilized release candidate

Main fixes:
- Removed stacked historical patch renderers from collector-final-fixes.js.
- app-wizard.js is now the single source of truth for collector question rendering.
- Crop Survey has exactly 30 main questions.
- Livestock Survey has exactly 30 main questions.
- Crop and livestock fields are separated.
- Survey options now carry survey_type metadata.
- Clicking Crop/Livestock auto-aligns the selected survey when a matching survey exists.
- Final save wording is standardized to Save Entry.
- saveEntry uses safer field reads and stores workflowExtras.
- Mobile/tablet/desktop responsive hardening added.
- Crop geofence code remains active for crop surveys only.

Open:
http://127.0.0.1:5500/WELCOME.html?screen=collector&v=1028

After replacing files:
1. Stop Live Server.
2. Start Live Server again.
3. Open the v1028 URL.
4. Press Ctrl + F5.
5. Clear site data only if an older v1027/v1026 script still appears in the console.
