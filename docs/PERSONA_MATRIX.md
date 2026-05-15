# Persona Matrix

`packages/persona-runtime` implements a multi-core personality system.

## Persona Cores

Supported core types:

- `base_core`
- `novel_core`
- `user_created_core`
- `reality_based_core`
- `scene_core`
- `minor_safe_core`

Each core stores traits, values, speech style, emotional style, relationship style, behavior patterns, allowed scenes, forbidden behaviors, safety constraints, context isolation policy, and evaluator rules.

## Selection

`selectActivePersonaCores(input, state, matrix)` activates cores by context:

- `base_core` is always active.
- `novel_core` and `scene_core` activate for roleplay, story, scene, character, and novel prompts.
- `reality_based_core` activates for work, study, planning, and help.
- `minor_safe_core` activates in minor or strict mode.

External knowledge can supply facts but cannot rewrite persona cores. User memory can influence tone but does not mutate cores unless the user edits the matrix.

## Novel Import

The import flow:

1. Paste or upload text.
2. Analyze candidate characters.
3. Select one or more candidates.
4. Generate persona cores.
5. Generate constraints, isolation policy, and evaluator rules.
6. Preview sample chat.
7. Save cores into the matrix.

The importer stores concise derived traits and summaries, not long copyrighted passages.

## Evaluator

`evaluatePersonaConsistency` checks for empty output, developer leakage, forbidden behaviors, minor-safe violations, and context contamination.
