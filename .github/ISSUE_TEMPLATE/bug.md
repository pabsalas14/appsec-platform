---
name: Bug report
about: Something broke — help us reproduce it
title: "bug: <short description>"
labels: ["bug"]
---

## What happened

<!-- What did you do, what did you expect, what did you actually see? -->

## Reproduction

1. …
2. …
3. …

Minimal request / payload / URL if relevant:

```http
GET /api/v1/…
```

## Environment

- Branch / commit:
- Docker compose version:
- OS:
- Browser (if frontend):

## Relevant logs

<details><summary>backend logs</summary>

```
<!-- docker compose logs backend | tail -n 100 -->
```

</details>

<details><summary>frontend console</summary>

```
<!-- paste errors here -->
```

</details>

## Which ADR / hard rule is affected?

<!-- If this bug is a violation of an ADR (envelope shape, IDOR, …),
     reference it here so the fix includes a regression test. -->
