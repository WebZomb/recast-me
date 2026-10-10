# RM105 — GitHub to Cloudflare guarded deployment workflow

This is a staged workflow, not an activated deployment path. The owner requested future GitHub updates deployable without keeping Windows PC online. The workflow runs exact-source npm tests and Wrangler dry-run, then deploys only from main after BOTH GitHub Actions secrets exist and repository variable CLOUDFLARE_DEPLOY_READY is explicitly set to true.

Required GitHub repo secrets: CLOUDFLARE_API_TOKEN (restricted Cloudflare Workers Scripts edit token) and CLOUDFLARE_ACCOUNT_ID. The GitHub browser session on the PC currently shows "Page not found" for the repo Actions secrets page, indicating owner must sign in to GitHub with admin access first. Cloudflare is signed in through Brave, but no API token was generated or printed, and none was inserted in source.

Safety: Deployment job remains skipped without the ready variable. Even when active, it performs NO paid image render, customer email, purchase, credit use, Shopify action or fulfillment. It serializes production releases, uses wrangler.jsonc keep_vars=true, and checks only public site/readiness and unauthorized admin route. Existing Cloudflare Worker version edd814da-9525-4185-ba77-72b8c5bed8c5 was already deployed and verified; 414/414 local tests and read-only smoke passed, with 49 plain settings + 8 secrets preserved.

Rollback this staged work by reverting the workflow before enabling the variable. Once logged in, set the two secrets and variable, run an approved workflow_dispatch and confirm the real deployment receipt before describing GitHub deployment as automatic. Production environment reviewer protection is recommended.
