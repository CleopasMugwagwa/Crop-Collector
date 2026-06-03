COLLECTOR FINAL UI ORDER FIX v721

Fixes:
- HierarchyRequestError: Failed to execute 'insertBefore' on 'Node': The new child element contains the parent.
- This happened in v720 when the script tried to move collector-primary-modules before an element already inside it.
- v721 uses safe DOM placement and prevents moving a parent into its own child.

Install:
1. Copy all files into your frontend folder.
2. Replace existing files.
3. Open WELCOME.html?screen=collector&v=721
4. Press Ctrl + F5.
5. If v720 error still appears, clear site data and restart Live Server.

Expected:
- No HierarchyRequestError.
- Crop Survey / Livestock Survey visible.
- Back/Next hidden on the choose-survey screen.
- Offline & Basemaps remains collapsed.
