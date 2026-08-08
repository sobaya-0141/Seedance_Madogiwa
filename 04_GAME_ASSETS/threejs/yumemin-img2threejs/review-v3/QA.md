# Yumemin v3 — visual QA

Reference: `02_CHARACTERS/Yumemin_3D_turnaround_v3.png`

## Confirmed

- The blue body is a true sphere and remains circular in front, profile, and rear renders.
- The tapir-like proboscis grows from the facial centerline, projects forward, curves down, and has a rounded closed tip.
- The white region is a separate rear conforming cloth shell with a raised white edge.
- The rear render is white except for the centered blue tail nub and its fabric opening.
- Eyes and ear interiors are physical geometry/material changes, not drawn black outlines.
- The neutral preview hides the optional mallet.
- Runtime console: no warnings or errors.
- Runtime size: 24,808 triangles, 20 draw calls.
- Part coverage: pass, 0 errors, 0 warnings.
- Multi-angle degeneration test: pass; minimum orbit silhouette ratio 0.918.

## Remaining approximation

- The ears use beveled extruded wedges; their edges are slightly sharper than the soft sculpt shown in the setting art.
- The wrap uses a procedural woven bump and a clean conforming shell; the setting art's hand-shaped cloth folds are simplified.
- Neutral preview lighting makes the blue slightly paler than the reference render.

## Evidence

- `qa-contact-sheet.png`
- `front-comparison.png`
- `part-coverage.json`
- `multi-angle-diagnostic.json`
- `model-stats.json`
