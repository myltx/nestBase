---
description: Audit existing APIs to identify redundancy, inconsistency, and optimization opportunities.
---

## Step 1: Module Scan
- List all controllers and routes in the target module.
- 按资源维度进行分组。

---

## Step 2: Smell Detection
Identify:
- Action-style APIs
- Multiple list endpoints
- Getter/Setter style APIs
- Standalone relationship controllers

---

## Step 3: Consolidation Plan
For each issue:
- Mark as: Merge / Replace / Remove
- Provide the target API design.

---

## Step 4: Migration Safety
- Identify frontend or consumer impact.
- Suggest backward compatibility or migration strategy if needed.

---

## Step 5: Optimization Report
Generate a markdown summary:
- Before / After API count
- Structural improvements
- Long-term benefits