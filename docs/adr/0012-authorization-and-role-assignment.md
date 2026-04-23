# ADR-0012: Authorization and role assignment

- Status: accepted
- Date: 2026-04-21

## Context

The framework supports public self-registration and separate admin user
management. Allowing public registration to set privileged roles collapses that
separation and creates a direct privilege-escalation path.

## Decision

Public self-registration always creates `role="user"`. The registration schema
does not expose `role`, and any client-supplied role-like field must be ignored
or rejected by contract tests. Role assignment belongs to admin-only flows under
`/api/v1/admin/*`.

Projects that need invitations, SSO provisioning, or staff bootstrap flows must
implement them as separate privileged entry points rather than widening public
registration.

## Consequences

+ Public registration can no longer self-promote to admin.
+ Authorization policy becomes easier to reason about because role assignment is
  centralized in admin flows.
- Products that need richer onboarding must design dedicated privileged
  workflows instead of piggybacking on self-registration.

## Alternatives considered

- Accept a public `role` field and validate it loosely: rejected because any
  mistake reopens privilege escalation.
- Hide `role` only in the frontend form: rejected because the backend contract
  must be authoritative.
