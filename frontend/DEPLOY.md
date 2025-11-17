# Deploy Frontend (Netlify or Firebase Hosting)

This project uses Vite and produces a static site in `dist/` when you run `npm run build`.

Netlify (recommended for quick deploy):
- Connect this repository to Netlify (Site settings → Build & deploy → Continuous Deployment).
- Build command: `npm run build`
- Publish directory: `dist` (we set this in `netlify.toml`)
- If you add a custom domain, follow Netlify DNS instructions to point it at your site. DNS may take a few minutes-hours to propagate.

Firebase Hosting (one-time setup):
- Install Firebase Tools: `npm i -g firebase-tools`
- Login: `firebase login`
- Initialize hosting in frontend: `cd frontend; firebase init hosting`
  - Choose `Use an existing project` and pick `ecommerce-102` (or your Firebase project).
  - Set public directory: `dist`
  - Configure as SPA? Yes (rewrite all 404s to /index.html).
- Build & Deploy:
  - `npm run build`
  - `firebase deploy --only hosting`
- Add any custom domains at Firebase Console → Hosting → Add custom domain; follow verification steps.

Common reasons for "Site not found":
- You haven't deployed the site (run `npm run build` then deploy).
- The deploy publish folder is wrong (Netlify publishing `build` while Vite creates `dist`).
- DNS propagation for custom domain is not finished.
- You didn't setup hosting for the correct Firebase project.

Quick troubleshooting:
- Look at Netlify deploy logs — they show whether build succeeded and which directory was published.
- Check `firebase deploy --only hosting` output for errors and URLs.
- Visit the hosting provider's site dashboard and re-trigger the build or check domain status.
