---
description: Use this workflow before creating or modifying any backend API. It ensures API consistency, avoids duplication, and enforces governance rules.
---


## Step 1: Context Scan
- Scan existing modules and controllers.
- Identify similar or overlapping APIs.
- 列出当前可能相关的接口（路径 + 方法）。

---

## Step 2: Duplication Check
- Check whether the requirement can be fulfilled by:
  - Extending an existing API via Query / DTO
  - Reusing existing resource endpoints
- If duplication exists, propose a merge strategy.

---

## Step 3: Governance Validation
Validate the design against:
- Resource-oriented URL
- HTTP method correctness
- Status update via PATCH
- No action-style endpoints

List any violations explicitly.

---

## Step 4: Interface Proposal
Output:
- Final API path
- HTTP method
- Query / Body DTO design
- Whether this is:
  - Reuse
  - Merge
  - New API (with justification)

---

## Step 5: Documentation Update
- Generate a short optimization record:
  - What changed
  - What was removed or merged
  - Why this improves clarity or scalability