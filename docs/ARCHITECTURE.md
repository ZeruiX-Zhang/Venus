# Architecture

Personal Character Agent v0.3 is a local Character Agent OS-style product with shared runtime behavior across web, desktop, and CLI.

## Runtime Flow

`CompanionRuntime.sendMessage` performs:

1. Normalize input.
2. Safety pre-check.
3. Route intent.
4. Select active persona cores.
5. Select Memory Skills.
6. Retrieve memory packets within budget.
7. Keep knowledge packets separate.
8. Assemble isolated context.
9. Generate through mock or OpenAI-compatible gateway.
10. Evaluate persona consistency.
11. Safety post-check.
12. Emit avatar events.
13. Extract memory write candidates.
14. Create approval suggestions or safe autosaves.
15. Return final response object with trace id and optional developer debug.

## Packages

- `agent-runtime`: orchestrates the product workflow and final response object.
- `memory-runtime`: Memory Skill Registry, stores, read/write pipelines.
- `persona-runtime`: Personality Matrix, novel import, persona evaluator.
- `safety-runtime`: safety profiles, minor mode, identity policy.
- `avatar-runtime`: state machine and pixel renderer.
- `model-gateway`: mock and OpenAI-compatible model gateway.
- `ui`: shared React UI for web and desktop.
- `shared`, `agent-core`, `memory-core`, `persona-core`, `avatar-core`: compatibility and lower-level utilities from the prior foundation.

## Apps

- `apps/web`: browser companion product.
- `apps/desktop`: desktop shell. Native transparent always-on-top behavior is documented as platform-specific follow-up.
- `apps/cli`: terminal pixel companion using the same runtime.

## UI Surfaces

Normal mode:

- character stage
- chat
- memory
- novel import
- personality
- appearance
- voice placeholder
- safety mode

Developer mode:

- provider settings
- runtime traces
- recalled memory packets
- raw persona matrix
- evaluator results
- safety profile
- memory skill registry
- context debug
