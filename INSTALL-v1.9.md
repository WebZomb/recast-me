# Recast Me v1.9 — launch polish and real model comparison

Install this patch over the current site (v1.8.1). Merge the ZIP folders into the repository root, replace matching files, keep everything else, then deploy through the existing GitHub/Cloudflare connection.

The site now begins creation with photo uploads, offers removable thumbnails and Surprise me, and shows complete artwork in small preview/merch images. Secondary merchandise cards are full-width on phones. Customer generation engines are unchanged.

Control Center → System now links to the owner-only Model comparison page. It requires the existing ADMIN_TOKEN and generates a billable image only when you submit a test. No secret is embedded in this package. Do not paste secrets into chat or commit them to GitHub.

Read docs/FINISH-LAUNCH-v1.9.md for ordered setup, cost assumptions, public-scale work still needed, Shopify/Printful/X checks and the App Store plan.

Validation: 20 backend tests passed, including unauthorized model-test rejection and allowlisted model selection. Mobile 390px and desktop 1440px checks passed for loading every image, no overflow/JS errors, 12 products in one catalog, upload/removal and Surprise me preserving notes. Live rendering/billing/commerce/X activation is still unverified.
