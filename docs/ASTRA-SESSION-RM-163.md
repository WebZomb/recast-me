# RM162–163 — Simple Preview Actions & Seasonal Gift Specials

**Status:** WEB PUBLISHED AND VERIFIED • native fifth tab source saved but NEW TestFlight build not yet confirmed.

October 13, 2026 (Eastern). User explicitly asked to simplify preview options, keep More options with each saved Recast, shrink the black tab dock, add a fifth Specials button **before Guide**, and build an immersive Halloween-to-footer landing page promoting the next meaningful gifting occasions, automatically rotating to the next major holiday.

## Web changes

- Completed in PR **#78**, merged into `main` as commit **`1537ab2d8feab6982ace7f4d46aeba79de6a061c`**.
- Preview action clutter removed: no old Save/share, Save to My Recasts, Open in another browser, or oversized More options panel underneath preview. Instead **Save** and **Share** buttons appear in a compact 2-column action strip directly under the watermarked photo. Existing **Put It on a Product** and **Pick another version** remain. Save uses existing securely protected preview storage; native WKWebView saves a watermark-only copy and private access token to the device's Keychain, and browser Save keeps a private same-device favorite shortcut.
- `public/my-recasts.js` and `my-recasts.html`: selected saved picture now has expandable More options: Share protected watermarked JPEG, Open saved picture, Copy private link, Copy individual Artwork ID, Artwork & privacy (private original page), Remove from favorites. Main **Use on a Product** action remains immediate and never re-renders. A bare Artwork ID cannot reveal private artwork.
- `public/mobile-bottom-nav.css` black iPhone-style capsule made narrower, sleeker and sharper with proper accessible touch targets; five-tab layout added and Guide stays last. `mobile-bottom-nav.js?v=163` and markup on all relevant marketing, help, creator, order and gallery pages.
- `public/specials.html` is a dedicated SEO-indexable seasonal gift experience, Halloween themed from original hero artwork all the way to closing section and footer: painterly pets, costume fantasy, pumpkins, glowing bats, gift mockups, multiple CTA deep-links and upcoming gift-calendar cards. Custom, optimized holiday images and seasonal styling. Product shipping is *never* promised by a fixed date, no fabricated discounts.
- `public/season-calendar.js` calculates and sorts the next US gift occasions every year: Valentine's Day, National Pet Day, Mother's Day, graduation, Father's Day, International Dog Day, Halloween, Thanksgiving, Black Friday shopping, Cyber Monday, Christmas, New Year. Monthly spotlight switches automatically, so not a stale Halloween campaign in December. Uses calendar-local noon to avoid DST start-of-day off-by-one errors.
- `public/seasonal-specials-v163.js` changes hero, labels, gift ideas and event links without changing AI or checkout. Direct `/?style=halloween#start` deep link is supported by `public/app.js` selection logic.

## Release and validation

- Source branch `recast/rm162-simplify-preview-actions-and-compact-nav` final head **`80160a24e07ee01bca525d24f49bfd44180d0543`**. Gate **security #38420039062 PASS** and **customer-policy Chromium/WebKit #38420038904 PASS**. An initial draft failed three stale/static tests; those were corrected with no reduction in checkout or rendering safety assertions.
- Guarded Cloudflare deploy **GitHub Actions #38420761526 SUCCESS**: **566 tests passed, 0 failed**; Worker version **`7179a908-7c3a-4b53-96c2-53047f299ec6`**; read-only runtime smoke HTTP 200; no paid operations. Independent post-merge read-only launch audit **#38420761614 SUCCESS**.
- A second authorized Windows machine `DESKTOP-96HLGJF` is currently connected through Remote Desktop Commander. Isolated headless Chrome live tests ran on `https://recast-me.sergz24.workers.dev/` and `/specials.html` at **320,393,768,1280px** after deployment. Results: five navigation links visible at all sizes, no horizontal overflow, proper header layout on PC, preview has exactly **Save / Share**, no More options, hero + illustrated Halloween image assets load, upcoming calendar shows six events, six themed sections from top to bottom; **zero page script errors and zero failed HTTP responses**. Screenshots saved on that PC under `C:\Users\sergz\Documents\recast-rm163-halloween-{mobile,footer,desktop}.png` and `recast-rm163-home-mobile.png`. No customers, paid render, backend mutation, Printful order, credit or new checkout touched.

## Native iOS — still a separate signed build step

- Native branch `rm152-ios-testflight` contains five-tab `RecastMeApp.swift`: Create, My Recasts, My Orders, Specials, Guide. Specials loads the live same-origin `specials.html`, with the native tab bar rather than a second web dock.
- GitHub branch head at this receipt includes `ios/RM163-TESTFLIGHT-ACCEPTANCE.md` commit **`6839ad74a95ae9054c89cedd3c0af8c8f373a75d`**. This docs update does **not** sign or upload an IPA; last confirmed signed iPhone TestFlight installation is Build9 (four tabs), and this fifth tab requires a *new Codemagic private internal build*, Apple processing, assignment to the existing Owner Testing group and installation.
- Do not invent signed-build completion; Codemagic and Apple accounts may require browser login. Prefer signed-in authorized PC to trigger workflow `recast-internal-testflight` on `rm152-ios-testflight` and validate it in App Store Connect, never a public App Store submission. Connected PC `DESKTOP-GFOHB7M` may show online but did not respond to terminal requests in this session, while `DESKTOP-96HLGJF` was online and successfully ran headless Chrome. Never share dev keys, certs, or auth profiles.
- Public launch remains subject to app payment policy, privacy metadata and on-device acceptance.

## Safety / rollback

No new Shopify order, Printful job, AI provider charge, render credit award, customer photo export or credential change occurred. Existing order #1003 remains separate. Revert PR #78 from main via guarded deploy to undo web UI if needed, preserving paid orders, past artworks and credits. Native PR #71 remains independent and not merged to public main.
