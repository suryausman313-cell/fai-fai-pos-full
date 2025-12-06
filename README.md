# FAI FAI POS (static)

## How to use (local / GitHub pages)
1. Create a new GitHub repo (public).
2. Upload all files exactly as here to repo root.
3. In repo Settings -> Pages -> set branch `main` / `/ (root)` and Save.
4. Wait 1-3 minutes then open the pages URL (username.github.io/repo).

## Admin
Default admin:
- email: admin@313
- password: 246800

## PWA / APK
- After Pages works, you can use tools like `pwa2apk` or `bubblewrap` to generate Android APK from the hosted PWA.

## Firebase (optional)
- If you need realtime DB & printing across devices, create Firebase project and adapt `scripts/app.js` to sync.
