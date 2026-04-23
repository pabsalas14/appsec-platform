# ADR-0014: File upload and content handling security

- Status: accepted
- Date: 2026-04-21

## Context

Uploads expand the attack surface beyond JSON APIs. Size limits, content types,
storage paths, and serving behavior all affect the blast radius of malformed or
malicious files. The framework already exposes upload endpoints and static file
serving, so it needs explicit boundaries.

## Decision

Uploads must stay behind authenticated routes, enforce allowed MIME types and
size limits, and store metadata separately from public URLs. Files are served
from controlled locations rather than user-chosen paths. The framework treats
malware scanning, DLP, and object storage migration as production follow-up
requirements when the product risk profile demands them.

Projects should document any expansion of accepted file types, direct-download
behavior, or public sharing flows in a dedicated ADR or product security review.

## Consequences

+ Upload handling is framed as a security feature, not just a convenience API.
+ Teams know where the framework boundary ends and where product-specific
  scanning or storage controls begin.
- More advanced upload use cases still need extra infrastructure and review.

## Alternatives considered

- Treat uploads as generic blobs with only a size cap: rejected because content
  handling rules materially affect risk.
- Promise malware scanning by default: rejected because the framework does not
  ship that infrastructure out of the box.
