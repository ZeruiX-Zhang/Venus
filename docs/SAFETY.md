# Safety

`packages/safety-runtime` implements safety profiles, minor mode, identity policy, permissions, and audit primitives.

## Safety Profile

Fields:

- mode: `adult`, `minor`, `strict`, or `custom`
- content filters
- identity policy
- permissions
- blocked topics
- escalation rules

## Minor Mode

Minor mode blocks:

- sexual content
- pornographic content
- erotic roleplay
- graphic violence
- gore
- adult romantic escalation
- manipulative dependency language

It keeps creative, story, study, and chat features available through safe redirection and forces `minor_safe_core`.

## Identity Policy

Supported roles:

- companion
- study partner
- productivity assistant
- fictional character
- coach
- professional role limited
- forbidden identity

Identity controls allowed claims, disallowed claims, professional disclaimers, tool permissions, and boundaries.

## Normal vs Developer

Normal mode shows a simple safety toggle, minor mode indicator, and readable explanation. Developer Mode shows raw safety profile JSON, blocked topics, identity policy, permissions, and traces.
