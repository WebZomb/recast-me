# Recast Me v0.8 — Real Visuals + Prompt Obedience Fix

This corrects the problem where the live site still showed the old shape/SVG artwork.

WHAT CHANGED
- Replaced the two hero demo images with the approved real generated images:
  - YOUR IMAGE
  - YOUR WORLD
- Replaced all 8 shape/SVG style cards with the approved full generated artwork.
- Removed the old temporary "we'll replace these later" message.
- Increased uploaded reference preparation from 480px to 768px to preserve more face/pet detail.
- Rewrote the AI prompt hierarchy so the customer's written notes are the PRIMARY creative instruction.
- Explicitly tells the model NOT to make a near-copy/retouch of the source photo.
- Explicitly tells the model to change scene, wardrobe, lighting, props and composition while locking identity.
- Prevents generic beautification/body/age changes unless the customer actually requests them.
- Keeps the v0.7 merch-priority changes already in app.js / checkout.js / merch-v07.css.

UPLOAD
Upload everything in this ZIP to the GitHub repo root, preserving folders, then commit to main.
Cloudflare should auto-deploy.

IMPORTANT
The PNG files in public/assets are required. If they are skipped, the site will keep showing the old shape illustrations.
