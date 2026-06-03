CLEAN COLLECTOR DISPLAY PATCH v660

Patched files:
- collector-final-fixes.css
- collector-final-layout.css
- collector.css fallback

What it fixes:
- Hides the Quick Menu sentence:
  "Main collection tools stay up front..."
- Hides progress/status cards:
  "7/39 required answers complete"
  "Needs Work 17/100"
  "Up next..."
- Hides setup step text:
  "Setup Step 2 of 41: Crop Type"
- Keeps real form questions unchanged.
- Keeps Back / Next / Save buttons.
- Keeps warning/error feedback visible.
- Keeps Second Plot / Same Farmer Helper visible but compact.

Install:
1. Copy the patched CSS files into your frontend folder.
2. Replace the existing files.
3. Open:
   WELCOME.html?screen=collector&v=660
4. Press Ctrl + F5.

If your HTML still references old version numbers, Ctrl + F5 is enough in most cases.
