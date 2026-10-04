# RM-008 CI correction

At 5072105 the full suite failed 1 test. The raster footer is itself transformed to the output width before the base artwork transform is constructed, so the mock operation log now contains the footer width-only transform before the base width+height transform. The existing test incorrectly assumed the base transform must be operation index 0. Application behavior was not implicated.

Test-only correction: locate and assert the base transform by its height=960 signature, while retaining the two-draw and repeated-branding assertions. Application code is unchanged. Rerun complete CI and Preview deployment before owner testing.
