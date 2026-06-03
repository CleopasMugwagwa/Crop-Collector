FIXED ONCE v1018

Fixes:
- Stops the old app-wizard from showing Question x of 240.
- app-wizard getCollectorQuestionFlow is now capped at 30 questions.
- getCurrentModule no longer returns "choose".
- setCurrentModule no longer keeps "choose" as active module.
- Livestock and Crop remain limited to 30 main questions.

Open:
http://127.0.0.1:5500/WELCOME.html?screen=collector&v=1018

If the console still shows v1017 or Question x of 240, clear site data and reload v1018.
