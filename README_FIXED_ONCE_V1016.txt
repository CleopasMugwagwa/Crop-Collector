FIXED ONCE v1016

Fixes:
- Removes repeated render intervals that caused Chrome DevTools warning:
  "Node cannot be found in the current page"
- Fixes livestock effective module staying null.
- Clicking Livestock Survey now immediately sets:
  selectedSurveyType = livestock
  effectiveModule = livestock
  currentSurveyModule = livestock
- Patches ensureCollectorSurveyReady so requestedModule is filled from the active module.
- Keeps v1015 logic: 30 main questions only.

Open:
http://127.0.0.1:5500/WELCOME.html?screen=collector&v=1016

If console still shows v1015, clear site data and reload v1016.
