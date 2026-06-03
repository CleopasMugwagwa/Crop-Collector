COLLECTOR HIERARCHY WARNING FIX v741

Fixes:
- collector-form-visibility-fix v730 recovered: HierarchyRequestError
- collector-simple-form-display-fix v740 recovered repeated warnings
- The old scripts tried to move a DOM element into its own parent/child.
- v741 replaces those scripts with safe DOM placement.

Install:
1. Copy all files into your frontend folder.
2. Replace existing files.
3. Open WELCOME.html?screen=collector&v=741
4. Press Ctrl + F5.

Important:
If the console still shows v730/v740 warnings:
- DevTools > Application > Storage > Clear site data
- Stop and restart Live Server
- Open WELCOME.html?screen=collector&v=741
