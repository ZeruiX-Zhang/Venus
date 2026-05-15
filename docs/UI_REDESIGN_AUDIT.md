# UI Redesign Audit

## 1. Current Interface Problems

The current interface exposes nearly every feature at once. The left navigation, central stage, chat dock, quick actions, and right-side panels all compete for attention. The product has strong functionality, but the layout reads like a developer demo because the visual hierarchy is not decisive enough.

Main issues:

- The sidebar is too wide and visually heavy for primary navigation.
- The central character stage does not have enough calm surrounding space, so the companion does not fully become the visual subject.
- The right panel stacks forms, cards, warnings, and test results with similar weight.
- Many cards use the same border, background, padding, and heading scale, which makes scanning difficult.
- Developer and diagnostic surfaces are too close in weight to normal consumer surfaces.
- Copy is often explanatory instead of directional, especially in knowledge, settings, and system panels.

## 2. Why It Does Not Feel Premium

A premium desktop companion product should feel quiet first, then reveal power on demand. The current UI uses many visible borders, dense card groups, and evenly weighted text blocks. This creates a "feature wall" impression: useful, but not composed.

The interface also relies too much on hard panel boundaries. It needs softer depth, more whitespace, and clearer contrast between the main subject, support information, and developer controls.

## 3. Confusing Information Hierarchy

- Navigation, developer mode, current status, and all product modules share the same sidebar surface.
- The main stage and chat dock are both prominent, but the stage should lead and the input should feel attached to the interaction flow.
- Knowledge search, add, test, source list, retrieved packets, and injection warnings are presented as separate blocks with similar visual priority.
- Safety and provider states are important, but they appear as small labels without a consistent status system.
- Developer-only context isolation is placed near normal knowledge work instead of being visually deferred.

## 4. Areas To Weaken

- Sidebar labels and button chrome.
- Repeated card borders and heavy backgrounds.
- Long explanatory paragraphs in normal mode.
- Developer mode entry and provider details when developer mode is off.
- Prompt-injection warnings as loud standalone badges; they should become structured risk states.

## 5. Areas To Make Primary

- The character stage and avatar presence.
- The current conversation input.
- A compact product status line: provider mode, safety mode, and latest state.
- The active module in the right panel.
- In Knowledge Base, the main work loop: search, add source, test retrieval, review entries.

## 6. New Layout Direction

The redesign uses a three-zone Apple-inspired product structure:

- Left: a narrow, quiet navigation rail with icon-led items, subtle active state, and developer mode at the bottom.
- Center: a spacious character stage with soft depth, glass material, a larger companion focal area, a short companion cue, and an integrated chat dock.
- Right: an assistant panel that shows only the active module's most useful controls, with developer-only internals folded into lower-priority sections.

The visual system shifts from many hard cards to fewer layered surfaces: translucent panels, soft shadows, consistent radius, restrained blue accent, compact status badges, and smoother hover/press transitions. The goal is not to copy Apple UI, but to apply clarity, deference, and depth so the character and current task remain the product focus.
