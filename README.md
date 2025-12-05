# fai-fai-pos-full# FAI-FAI POS — Full (Static/PWA demo)

This is a self-contained static POS demo (HTML/CSS/JS) with:
- Cashier (POS)
- Waiter app (send orders)
- Kitchen board (receive & mark done)
- Admin product management
- Reports (exports, till)
- LocalStorage persistence (works offline)
- PWA ready (manifest + service worker)
- Firebase placeholder for later realtime sync

## Deploy (GitHub Pages)
1. Create a new repo (public) on GitHub.
2. Upload these files to the repo root.
3. In Settings → Pages, set source to `main` branch (root `/`) and save.
4. Wait 1–5 minutes; open the Pages URL.

## To enable realtime multi-device:
- Create a Firebase project, add Firestore, paste config into `firebase-config-placeholder.js`
- Implement `initFirebase()` to sync Firestore -> localStorage (I can provide ready code if you want).

## Printing:
- Browser printing uses `window.print()`; for direct thermal printing use:
  - Print server (Node.js) or
  - Native Android app that accepts print jobs (recommended)
  - ESC/POS via Web Bluetooth (experimental)

## Notes:
- Currency stored in local DB settings.
- Admin default login: username `admin`, password `admin123` (in `app.js` default staff)
