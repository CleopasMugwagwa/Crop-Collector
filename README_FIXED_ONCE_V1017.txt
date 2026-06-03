FIXED ONCE v1017

Fixes:
- Livestock module mismatch where effectiveModule became "choose".
- Old app-wizard 240-question handler is now stopped from running on Livestock/Next/Back.
- Livestock is forced to exactly 30 main questions.
- Question counter should now show up to 30, not 240.
- Crop remains limited to main crop questions.
- Repeated interval renders are disabled to reduce DevTools node warnings.

Open:
http://127.0.0.1:5500/WELCOME.html?screen=collector&v=1017

If you still see v1016 in console, clear site data and reload v1017.
