COLLECTOR FORM VISIBILITY FIX v730

Fixes:
- Save buttons were showing before the actual form/questions.
- Crop Survey and Livestock Survey were visible but the form was not opening properly.
- Shape ready/save panel was dominating the Start Survey screen.
- Offline Save & Sync/Entries were crowding the collector display.

Correct workflow:
1. Select Survey Name.
2. Choose Crop Survey or Livestock Survey.
3. Form questions display.
4. Draw/select shape.
5. Save Entry or Save & Add Another Plot.

Install:
1. Copy all files into frontend folder.
2. Replace existing files.
3. Open WELCOME.html?screen=collector&v=730
4. Press Ctrl + F5.
5. If old UI remains: DevTools > Application > Storage > Clear site data, then restart Live Server.
