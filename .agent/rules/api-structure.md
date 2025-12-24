---
trigger: model_decision
description: Apply this rule when designing or refactoring backend modules, folder structures, or API layouts, especially for resource grouping or relationship APIs (e.g. user-role, role-menu). Skip for pure frontend or internal service logic tasks.
---

# API Structure Rule

Apply this rule when:
- Creating a new module
- Refactoring folder structure
- Reviewing API layout

---

## Folder Structure Principle

- Folder structure SHOULD reflect resource ownership, not pure functionality.
- APIs related to a resource MUST be grouped under that resource.

Preferred:
modules/
  users/
  roles/
  contents/

Avoid:
modules/
  user-role/
  content-status/
  role-menu/

---

## Relationship Modules

- Relationship logic MAY exist as services.
- API exposure MUST be aggregated under the parent resource controller.

Example:
- Role-User logic lives in RolesController, not UserRolesController.