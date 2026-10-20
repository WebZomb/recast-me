# Watermarked device Save — October 20, 2026

Owner requested Save also export to phones/tablets/computers while retaining My Recasts.

Baseline: main b73ba98b41d24cbb60955b7813ea21ebac1a2759. Result: commit titled `Save protected previews to device after My Recasts` on fix/save-preview-device (commit identity recorded in Git history/PR).

Implemented: app.js captures selected version before asynchronous work; browser saves private collection pointer first, native retains existing reply-based save. Only protectedPreviewFile server-watermarked JPEG is passed to new device-preview-save.js. Desktop requests download; browser chooses folder. Coarse-pointer/mobile and native WebKit show a small accessible dialog with a fresh-tap file share action and protected-image long-press fallback. Canceled export does not remove the collection entry. Preparation failures explicitly retain My Recasts success. Existing Share behavior preserved. Main markup/layout unchanged except script cache version306. Dialog width90vw/max440px, max85dvh overflow, fitted image and48px touch targets provide narrow-phone layout constraints; real-device visual review remains untested.

Validation: node syntax check passed; five focused export/device tests passed. Initial broad run failed because new worktree lacked fast-png; reused existing matching workspace node_modules. Next run595/598 passed with three static source assertions requiring new captured metadata names/cache version. Updated those assertions; final npm test598/598 passed. Wrangler deployment dry-run bundled successfully (218assets; no production deployment). Mocked tests cover protected file only, fresh tap, desktop download request, mobile cancellation and no-share fallback; existing protected export validation rejects unmarked and malformed files.

Untested: real iPhone/iPad/Android Photos action, installed native WK long-press options, desktop browser save dialog, actual end-to-end saved file. Websites cannot silently write to Photos or choose Desktop. Native fallback may require a future native Photos bridge if installed WK does not expose image-save actions. Do not label downloads as confirmed Photos saves.

No paid render, ads, orders, credentials, spending-limit changes or native release. Uploaded source is not live deployment. Rollback: revert this change and restore script cache version. Retains existing collection limits and browser-local persistence behavior.
