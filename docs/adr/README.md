# Architecture Decision Records

Short, append-only log of the **why** behind the framework's design. Every
"MUST / MUST NEVER" in [`AGENTS.md`](../../AGENTS.md) references one of these.

New decisions MUST:

1. Copy `0000-template.md` to `NNNN-short-title.md` (next free number).
2. Reference the relevant ADR in the PR description.
3. Supersede (not delete) a previous ADR when overriding it.

## Index

| #    | Title                                   | Status   |
|------|-----------------------------------------|----------|
| [0001](0001-api-contract.md)           | API response envelope        | accepted |
| [0002](0002-auth-strategy.md)          | JWT + HttpOnly cookies + rotation | accepted |
| [0003](0003-transaction-ownership.md)  | `get_db` commits, services never | accepted |
| [0004](0004-ownership-isolation.md)    | Per-user ownership isolation | accepted |
| [0005](0005-type-generation.md)        | TS types generated from OpenAPI | accepted |
| [0006](0006-testing-strategy.md)       | Contract + IDOR + coverage ≥ 70% | accepted |
| [0007](0007-logging-and-audit.md)      | Structured logging & audit trail | accepted |
| [0008](0008-ui-shell-and-admin.md)     | UI shell, admin surface & demo pages | accepted |
| [0009](0009-security-baseline-and-threat-model.md) | Security baseline and threat model | accepted |
| [0010](0010-cookie-based-session-security.md) | Cookie-based session security | accepted |
| [0011](0011-authentication-abuse-protection.md) | Authentication abuse protection | accepted |
| [0012](0012-authorization-and-role-assignment.md) | Authorization and role assignment | accepted |
| [0013](0013-operational-security-defaults.md) | Operational security defaults | accepted |
| [0014](0014-file-upload-and-content-handling-security.md) | File upload and content handling security | accepted |
| [0015](0015-password-policy-and-cookie-tuning.md) | Password policy, cookie tuning and edge rate-limit | accepted |
