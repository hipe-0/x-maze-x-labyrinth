# AGENTS.md

## Git workflow

- After completing each feature (or a discrete, working change), automatically commit the changes to git.
- Do not wait to be asked: finishing a feature means staging the relevant files and creating a commit.
- Write a concise commit message that describes the feature/change, matching the repo's existing style.
- Stage only the files relevant to the feature; never commit secrets or unrelated edits.
- Only push if explicitly requested; auto-commit locally by default.

## Project rules

- This is the online version of the 1991 Casio labyrinth. Do not modify the
  source project at `../2026-10-16 Labyrinth Casio`.
- Keep the game renderer at the fixed 96 × 64 framebuffer size and 30 fps.
- The calculator shell is a Casio FX-7500G tribute. Keep the "fan project, not
  affiliated with Casio" disclaimer.
- The five active controls are up, down, left, right and EXE/select. Other
  calculator keys are decorative until explicitly enabled.
- Use `npm test`, `npm run lint` and `npm run build` before committing a
  feature.
