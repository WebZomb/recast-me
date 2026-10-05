# RM-007 social compatibility correction

CI at 2ead58b ran 85 tests: 81 passed and 4 existing social tests failed. Root cause: the new readiness state is per quality mode while social.js still read the legacy/default health shape, and capacity returned by the server gate was falling through to generic retry_wait. This also cascaded into later social test state because the test bucket is shared within those scenarios.

Correction: social generation explicitly reads the High-Quality circuit and treats both quota and capacity gate responses as awaiting_capacity, preserving the existing X queue semantics. It does not bypass the readiness gate and does not add an AI call. Website behavior and zero-render readiness remain unchanged.

Rerun all tests and Preview deployment before owner testing.
