# Recast Me v1.0 — upload instructions

This ZIP is a full launch-candidate project, not a tiny patch.

## GitHub
1. Extract the ZIP first.
2. In `WebZomb/recast-me`, upload the **contents** of the extracted folder to the repository root, preserving `public/`, `src/`, and `wrangler.jsonc`.
3. Replace matching files when GitHub asks.
4. Commit to `main`.
5. Cloudflare's connected Worker should deploy automatically.

Do **not** upload only the ZIP — GitHub will not automatically unzip it into the repository.

## Immediate visual check
After Cloudflare deploys, reload:
`https://recast-me.sergz24.workers.dev/?v=10`

You should see the new cinematic backgrounds and realistic product mockups.

## Immediate AI check
Use the same reference and exact direction:
`Make me and my dog super heros`

Expected behavior:
- recognizably the same real subjects,
- visibly transformed world / costume / composition,
- no raw 3030 provider errors,
- reasonable wait,
- private Artwork ID returned.

## New private dashboard
After you create a Cloudflare Worker secret named `ADMIN_TOKEN`, open:
`https://recast-me.sergz24.workers.dev/admin.html`

## No accidental launch
- Shopify products remain DRAFT.
- order automation is OFF.
- X bot is OFF.
- trend scanner is OFF.
- retention cleanup is OFF.
- physical production requires explicit confirmation.
