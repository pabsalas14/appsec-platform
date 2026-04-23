# Summary

<!-- 1-3 sentences. What does this PR do and why? Link the issue. -->

Closes #

## Hard rules checklist (AGENTS.md)

- [ ] Auth: every new/changed route has `get_current_user` / `require_role` / `require_ownership` (ADR-0001, ADR-0004)
- [ ] Envelope: responses use `success` / `paginated` / `error` (ADR-0001)
- [ ] Transactions: no new `await db.commit()` outside `get_db` (ADR-0003)
- [ ] Cookies: no new `response.set_cookie` outside `app/core/cookies.py` (ADR-0002)
- [ ] Ownership: new owned entity is listed in `tests/test_ownership.py::OWNED_ENTITIES` (ADR-0004)
- [ ] Types: ran `make types` and committed `frontend/src/types/api.ts` if backend schemas changed (ADR-0005)
- [ ] Tests: `make test` passes locally; added smoke / contract / IDOR where applicable (ADR-0006)
- [ ] ADR: added/updated under `docs/adr/` if a hard rule changed

## Screenshots / examples (optional)

<!-- For UI changes, attach before/after. For API changes, paste request +
     response in the new envelope shape. -->

## Deployment notes

- [ ] No migration
- [ ] Alembic migration included, `alembic upgrade head` on deploy
- [ ] New env var — documented in `.env.example`
