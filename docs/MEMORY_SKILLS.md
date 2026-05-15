# Memory Skills

v0.3 implements Memory-as-Skills, not one generic vector memory blob.

## Registry

`packages/memory-runtime` defines `MemorySkillRegistry`. Each skill has:

- id, name, description
- read and write triggers
- retrieval mode: `always_on`, `keyword`, `semantic`, `hybrid`, or `manual`
- priority and context budget
- user approval, editability, conflict policy, namespace, TTL policy, and safety tags

## Always-On Blocks

Pinned blocks are inserted first and never rely on retrieval:

- `active_character_identity`
- `active_persona_core`
- `user_profile_summary`
- `relationship_contract`
- `safety_profile`
- `current_scene`

## Default Triggered Skills

- `user_preference_memory`
- `relationship_memory`
- `task_context_memory`
- `novel_lore_memory`
- `persona_behavior_memory`
- `journal_memory`
- `knowledge_memory`
- `safety_memory`

## Read Pipeline

1. `selectMemorySkills(input, agentState)`
2. `retrieveMemoryPackets(selectedSkills, input, budget, store, state)`
3. `assembleMemoryContext(packets)`

Only selected skills retrieve records. Knowledge packets are marked separately from persona and memory packets. Developer Mode shows packet source and recall reason; normal mode only shows a friendly remembered-context indicator.

## Write Pipeline

1. `observeUserEvent`
2. `extractMemoryCandidates`
3. `classifyCandidateToMemorySkill`
4. `retrieveExistingRelatedMemory`
5. `mergeOrCreateMemory`
6. `validateMemory`
7. `askUserForApprovalIfNeeded`
8. `saveMemory`

Default write mode is ask-before-saving. Sensitive details and conflicts require explicit approval.

## Data Controls

The UI supports add, edit, delete, delete all, export, skill toggles, recalled-this-turn, approval queue, and developer debug.
