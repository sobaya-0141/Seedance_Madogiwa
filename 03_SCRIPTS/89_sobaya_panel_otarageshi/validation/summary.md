# Image validation summary — 2026-09-17

VLM validation status: NOT RUN. The local Ollama endpoint was unreachable even though the model files were installed; `verify_frame.py` could not connect to the server. Per the image-validation fallback, every keyframe was opened and checked visually against the bundled Fukuchan_sheet.png, Sobaya_sheet.png, Prop state ledger, Scene ledger, Camera plan and its checklist.

Final visual verdict: PASS for all 16 keyframes.

| Image | Manual visual verdict | Main checks |
|---|---|---|
| clip1_start.png | PASS | One intact panel, one Fukuchan, requested ritual costume, unlit pit, late-afternoon daylight |
| clip1_end.png | PASS | One intact panel with exactly three luminous cut lines, no fire/smoke |
| clip2_start.png | PASS | Byte-identical shared frame with clip1_end |
| clip2_end.png | PASS | Exactly four large clean pieces, no fire/smoke |
| clip3_start.png | PASS | Byte-identical shared frame with clip2_end |
| clip3_end.png | PASS | Approximately twelve pieces gathered in the unlit pit |
| clip4_start.png | PASS | CUT preserves the same dry-piece state; high-angle view |
| clip4_end.png | PASS | Small controlled flames and thin smoke begin |
| clip5_start.png | PASS | CUT preserves fire state; no people in fire close-up |
| clip5_end.png | PASS | Burning pieces, thick smoke, vague silhouette but no recognizable face |
| clip6_start.png | PASS | Byte-identical shared frame with clip5_end |
| clip6_end.png | PASS | One Sobaya smoke face; two black eye holes, mouth slit, four red marks, forehead dot, hair |
| clip7_start.png | PASS | Byte-identical shared frame with clip6_end |
| clip7_end.png | PASS | One face dissolving into smoke; no duplicate face/body |
| clip8_start.png | PASS | CUT preserves fading smoke/embers; one Fukuchan in wide view |
| clip8_end.png | PASS | Smoke fully dispersed, embers only, one Fukuchan, consistent daylight |

The following shared joins were verified with SHA-1 equality:

- clip1_end.png = clip2_start.png
- clip2_end.png = clip3_start.png
- clip5_end.png = clip6_start.png
- clip6_end.png = clip7_start.png
