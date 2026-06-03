STARTUP AND SURVEY HOTFIX v850

Fixes the exact console errors:
1. Cannot read properties of null (reading 'displayName')
2. select.options is not iterable
3. Old WELCOME route still using v=830/v=400.

Install:
1. Copy WELCOME.html into your frontend folder.
2. Replace the existing WELCOME.html.
3. Stop Live Server.
4. Start Live Server again.
5. Open exactly:
   http://127.0.0.1:5500/WELCOME.html?screen=collector&v=850
6. Press Ctrl + F5.

Important:
Your screenshot showed you were still on v=830. After installing, the URL must show v=850.
If it still loads old JS files, clear site data:
DevTools > Application > Storage > Clear site data.
