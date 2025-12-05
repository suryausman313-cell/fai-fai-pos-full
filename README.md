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
- Admin default login: username `admin`, password `admin123` (in `app.js` default staff)# FAI FAI POS — Static Demo

## Files included
- index.html, admin.html, cashier.html, waiter.html, kitchen.html, reports.html
- script.js (shared logic)
- style.css
- products.json (initial)
- manifest.json, service-worker.js (PWA)

## How to publish (GitHub Pages)
1. Create a new public repo on GitHub and upload all files to repo root (commit).
2. In repo Settings → Pages → Source: choose `main` branch and folder `/ (root)`. Save.
3. Wait ~1-2 minutes then open `https://<your-username>.github.io/<repo-name>/`.

## Notes
- Admin page manages products (stored in localStorage).
- Cashier sends sales (also saved in localStorage orders).
- Waiter sends kitchen orders (in localStorage).
- Kitchen page reads orders and can mark them done.
- Reports page reads orders and gives CSV export.
- To reset products: Admin → Reset Default.

## Printing
- From Cashier click `Checkout & Print`, your browser native print will open.
- For thermal receipt printers, use Chrome print to the installed printer (or a small helper app).
