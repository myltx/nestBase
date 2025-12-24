---
trigger: always_on
---

# API Governance Rules (Always On)

This rule defines the highest-level API engineering constraints.
It MUST be applied to all backend-related tasks.

---

## 1. Resource-Oriented API Design

- APIs MUST be designed around resources (nouns), not actions.
- URLs like `/getList`, `/deleteById`, `/publish` are FORBIDDEN.

Examples:
- ✅ GET /contents
- ❌ POST /contents/list

---

## 2. HTTP Method Mapping

- GET: Read
- POST: Create
- PATCH: Partial update (preferred)
- PUT: Full replace (rare)
- DELETE: Remove

Using incorrect HTTP methods is NOT allowed.

---

## 3. Controller Responsibility

- Controllers MUST be thin.
- Controllers are only allowed to:
  - Receive parameters
  - Perform validation
  - Apply guards / permissions
  - Return raw data or DTOs
- Business logic MUST be implemented in Service layer.

---

## 4. Query & Filtering Standardization

- All list APIs MUST use a unified Query DTO.
- Pagination, sorting, filtering MUST NOT create new endpoints.
- Multiple list endpoints (findActive, findPopular, etc.) are FORBIDDEN.

Use query parameters instead:
- ?status=active
- ?sort=createdAt:desc

---

## 5. Status & State Change

- State changes MUST be handled via PATCH on the resource itself.
- Action-style endpoints like `/publish`, `/enable` are DISCOURAGED.

Preferred:
- PATCH /contents/:id { status: "PUBLISHED" }

---

## 6. Relationship Handling

- Many-to-many relationships MUST be expressed as sub-resources.

Examples:
- GET /roles/:id/users
- POST /roles/:id/users
- DELETE /roles/:id/users

Standalone relationship APIs SHOULD be avoided.

---

## 7. Batch Operations

- Batch operations MUST be explicit.
- Allowed patterns:
  - POST /resources/batch
  - POST /resources/batch-delete

DELETE with body is allowed ONLY if infrastructure supports it.

---

## 8. Response Structure

- Controllers MUST return raw data or DTOs only.
- Global interceptor handles `{ code, data, message }`.
- Manual response wrapping is FORBIDDEN.