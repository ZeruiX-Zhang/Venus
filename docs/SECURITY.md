# Security

## Default Position

The product is default-deny for tools and side effects. Mock mode remains fully usable without API keys or network calls.

Enabled by default:

- `memory_read`
- `memory_write`
- `memory_export`
- `memory_delete`
- `knowledge_read`

Disabled by default:

- `model_provider_edit`
- `network_request`
- `file_read`
- `file_write`
- `shell_execute`
- `desktop_control`

Dangerous tools must remain behind explicit permission and confirmation before implementation.

## Normal Mode And Developer Mode

Normal mode hides raw provider details, traces, prompt assembly, persona JSON, memory debug packets, and model internals.

Developer Mode may expose runtime internals for inspection:

- Runtime traces.
- Raw persona cores.
- Recalled memory packets.
- Safety profile.
- Context isolation preview.
- Provider settings.
- Model provider QA results.

## Memory Privacy

Memory must stay visible and user-controllable. The UI supports:

- View enabled and disabled Memory Skills.
- View always-on memory blocks.
- View recalled-this-turn packets and recall reasons.
- Approve or reject memory write suggestions.
- Add, edit, delete, delete all, and export memory records.
- Choose write mode: auto off, ask before saving, or auto save non-sensitive.

Default write mode is `ask`. Sensitive-looking memories such as passwords, API keys, addresses, medical details, and financial data are never silently stored.

## Knowledge Prompt Injection

External documents, novel text, and retrieved chunks are treated as untrusted context. Knowledge can provide facts, but cannot modify:

- System or developer instructions.
- Persona cores.
- Safety policy.
- Identity policy.
- Memory write policy.

The Knowledge panel flags instruction-like content such as "ignore previous instructions" and shows a Developer Mode context isolation preview.

## Secret Storage

`packages/model-gateway/src/secrets` defines:

- `SecretStore`
- `InMemorySecretStore`
- `BrowserEncryptedSecretStore`
- `TauriStrongholdSecretStore`
- `SecretStoreFactory`

Rules:

- Saved API keys are masked in the UI.
- Raw saved keys are not displayed after saving.
- Browser storage is labeled local-development only and is not equivalent to an OS keychain.
- Tauri Stronghold is represented as an adapter surface; production requires wiring `tauri-plugin-stronghold` or an OS keychain backend and validating it per platform.
- Provider tests must fail recoverably when no key is configured and must not break mock mode.

## Desktop Security

Transparent and always-on-top desktop behavior is configured for Tauri where supported. Click-through is not enabled in this prototype because support is platform-specific and can create unsafe interaction ambiguity. The supported fallback is compact floating mode, opacity control, lock/unlock, hide/peek, and reset position.

## Remaining Production Requirements

- Encrypted memory at rest.
- Real OS keychain or Tauri Stronghold integration.
- Secret redaction in logs and crash reports.
- Provider data-retention disclosures.
- Consent screens for persistent memory.
- Signed desktop builds and updater.
- Privacy policy and data deletion policy.
- Legal review for character import, voice, and copyrighted text.
