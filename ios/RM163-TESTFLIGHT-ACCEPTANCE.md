# RM163 internal TestFlight acceptance — Specials tab

Native source branch: `rm152-ios-testflight`. Public live website source: RM162–163 PR #78 merged into main `1537ab2d8feab6982ace7f4d46aeba79de6a061c`.

The native iPhone `TabView` now contains exactly five tabs in this order:
1. Create
2. My Recasts
3. My Orders
4. Specials
5. Guide

The new Specials tab loads `https://recastmeai.com/specials.html` in the existing trusted same-origin WKWebView. The page is fully illustrated with Halloween until October 31, then automatically rotates to the next relevant shopping holiday. Gift CTA links open the existing photo creator and do **not** automatically render or purchase anything. The native app hides its website bottom navigation to avoid a double dock.

After Codemagic signs and uploads the **next internal-only build**:
- Confirm `App Store Connect → TestFlight → Owner Testing` is assigned the new, ready build (existing single authorized tester only).
- Update the installed app from TestFlight. Website changes update automatically, but this additional *native tab* requires a signed build and installation.
- Verify a smooth five-tab bar on iPhone (all five labels and icons visible, Guide last).
- Check Specials: Halloween illustration on hero, event gifts, themed content down to footer, upcoming dated gift events, scroll, photo CTA deep-link selects Halloween, no two stacked nav bars.
- Check Create: simple Save and Share buttons directly under image, product CTA unchanged, no More options clutter.
- Check My Recasts: saved offline previews and gallery More options actions, protected product links, private code display.
- Check My Orders: original purchase displayed; shipping tracking only when actual carrier data arrives; replay celebration never issues credits.
- Check accessibility: reduce motion, tap/haptics, VoiceOver focus, small device rendering, return from in-app Shopify.
- No new paid orders required for UI testing.

GitHub Actions simulator checks are **not** signed TestFlight builds, and the source tab is not on the owner's iPhone until a new Codemagic run succeeds, Apple processes it and the new build is installed. Do not mark as done before confirming installation.
