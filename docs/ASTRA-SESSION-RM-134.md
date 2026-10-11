# RM134 — Research after protected-head quality failures

2026-10-11. Baseline HEAD `be30c564bd7fd4f7bb3e0c1ac89a7ef748cfdd52`; deployed source remains RM133 `ebcaacac97dbf6fdb8c5cda90ff1f531e536da8a`. Research and source review only. No runtime edits, deployment, provider requests, payments, or service activation. Public rendering was not switched to either protected-head experiment.

## Evidence and diagnosis

Owner's latest screenshots demonstrate failure of the owner-only experiments: FLUX Fill invents a woman wearing the intended costume; Qwen leaves the kitchen/supporting torso and appears to place a generated crowned head behind the restored original head. Earlier Nano original examples preserve likeness better, but supporting-person removal remains unsolved. Do not describe protected-head quality as accepted. Prior mocked tests establish mechanics, not photographic quality.

Source review: `src/protected-face-edit.js` segments the generic concept `head`, unions all returned masks above confidence/area thresholds, permits all other pixels to change, then pastes normalized original head pixels into the generated image. The only alignment check is canvas dimensions. It does not verify subject selection, generated head position/scale, neck/body alignment, extra heads, or requested background replacement. Mask scores and areas are not semantic correctness checks. These are confirmed implementation limitations. The actual intermediate masks and pre-composite images for the supplied failures were not inspected; wrong detection/polarity and precise provider behavior remain unproven hypotheses. Do not claim a confirmed mask inversion defect. BFL documents black=preserve/white=edit, which matches our intended polarity.

Public `src/customer-identity.js` remains Nano v5. It contains both preserve-original-pose instructions and conditional close framing/crop instructions; earlier v4/v5 examples visibly changed pose. Keep the accepted earlier Nano result/recipe as the comparison baseline. Do not silently call v5 accepted or roll back production during research.

## Primary-source findings

1. Google's native-image guide documents reference-image editing, adding a hat to a cat, semantic localized editing, multi-reference composition and explicit facial-detail preservation. This supports reference-conditioned editing as a suitable approach; it does not promise pixel-identical faces. https://ai.google.dev/gemini-api/docs/image-generation
2. Grounded-Segment-Anything provides an actual detect/segment/inpaint implementation, animal segmentation examples, and automatic labeling integration. This is a useful implementation precedent for automatic intended-subject selection, not a validated Recast pipeline. https://github.com/IDEA-Research/Grounded-Segment-Anything
3. SAM 3 supports text/box/point object segmentation. Segment the intended subject instance, rather than assume every detected head is wanted. GPU requirements and model license/access apply to self-hosting. https://github.com/facebookresearch/sam3 ; hosted schema https://fal.ai/models/fal-ai/sam-3/image/api
4. Inpaint Anything offers remove/replace/fill workflows built around segmentation. Its interactive examples are not automatically a no-input customer workflow. https://github.com/geekyutao/Inpaint-Anything
5. FLUX Fill is region inpainting/outpainting, with black preserved and white edited. It does not determine which subject a customer intended or prevent inventing another subject in a large editable region. https://docs.bfl.ai/flux_1_fill
6. Diffusers documents that inpainting can alter unmasked areas. Copying pixels back is not a guarantee of sensible geometry or seamless composition. https://huggingface.co/docs/diffusers/using-diffusers/inpaint
7. IP-Adapter and AnyStory are real reference-conditioned generation projects, not demonstrated cheaper production replacements for this workload. No GPU-throughput, license-stack or Recast-quality benchmark was run. https://github.com/tencent-ailab/IP-Adapter ; https://github.com/junjiehe96/AnyStory
8. InstantID is not a general pet solution; its README describes face landmarks, largest-face/multi-person limitations and separate research restrictions for checkpoints/InsightFace models despite Apache-licensed code. https://github.com/instantX-research/InstantID

## Costs checked and unresolved provider detail

- fal original Nano edit still advertises $0.039 per output image: https://fal.ai/models/fal-ai/nano-banana/edit
- fal Nano Banana 2 edit advertises $0.08 base image, 512px at 0.75x; not a lower-cost drop-in replacement: https://fal.ai/models/fal-ai/nano-banana-2/edit
- Google direct Flash Lite Image advertises $0.0336 for 1K output, with input/text/thinking separately billed. Lower listed output cost alone does not establish likeness quality. https://ai.google.dev/gemini-api/docs/pricing
- Google documents contain conflicting original-model retirement dates: pricing warning says October 2, 2026; dedicated deprecations table says March 15, 2027. Do not claim fal is shut down, silently migrated, or guaranteed unchanged from this discrepancy. Verify provider-specific model mapping before any migration. https://ai.google.dev/gemini-api/docs/deprecations
- Existing lab Qwen/Fill labels include one segmentation request; no invoice or actual billing was checked. Research consumed no paid inference.

## Recommended next experiment (proposed, NOT implemented)

Freeze the accepted Nano edit recipe as control. Separate subject selection from generation. First inspect automatically selected full-subject masks on difficult photos; remove unwanted supporting-person context from the edit input using deterministic masking while retaining the intended subject's original visible pixels and canvas geometry. Masking cannot recover anatomy hidden by hands. Do not add a second generative cleanup pass by default or paste a head over an unchecked generated head.

Then compare unchanged Nano control against one Nano edit using the automatically isolated subject, identical style/resolution, with small bounded repeats. This is a hypothesis to validate, not a promise that cutouts solve identity. Retain private, short-lived owner diagnostics of selection overlay and raw output, never commit private images. If using original plus isolated reference, explicitly identify them as the same subject; separately test whether the extra reference helps or duplicates subjects. Do not change both input strategy and engine in the same comparison.

Evaluate likeness, unwanted figures, extra heads/limbs, original head angle, requested scene, edge quality, latency, and total cost per acceptable image. Expand beyond one dog to another pet, adult portrait, group, held pet, and partial-face/occlusion cases. Use approved/licensed photos; existing authorization does not waive cost caps or model-change visibility. No automatic retries. No ready-for-customer claim until real outputs pass. Easy default can be automatic; ambiguous group selection needs an optional simple correction, not a manual crop editor. Reuse exact approved artwork for product printing.

Changed files: this research record and cumulative handoff only. Validation: source/documentation review and `git diff --check`; no runtime tests needed for notes. No new deployment to roll back. Existing production state unchanged; protected choices remain experimental and should not be promoted.
