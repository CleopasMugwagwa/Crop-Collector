RESTORE COLLECTOR FORM + SURVEY BUTTONS v700

Fixes the issue shown in the screenshot:
- Crop Survey and Livestock Survey buttons disappeared.
- Form questions were not displaying after drawing a shape.
- Only save actions were showing.

What this patch does:
- Restores Collect form visibility.
- Restores Crop Survey and Livestock Survey buttons.
- Restores active form/question display.
- Keeps Save Entry / Save & Add Another Plot after drawing.
- Keeps Offline & Basemaps collapsed until clicked.
- Hides only the unwanted status text:
  Main collection tools stay up front...
  7/39 required answers complete...
  Needs Work...
  Up next...
  Setup Step...

Install:
1. Copy ALL files into the frontend folder.
2. Replace existing files.
3. Open WELCOME.html?screen=collector&v=700
4. Press Ctrl + F5.

If it still displays old UI:
- DevTools > Application > Storage > Clear site data.
- Restart Live Server.
