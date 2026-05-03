# DOS Hub Agent Instructions

## Platform Identity

DOS Hub is the centralized Operational Intelligence Platform for Distinctive Outdoor Structures.

This is not a collection of disconnected tools.

This is a governed modular operational system.

All code decisions must preserve:

- modular architecture
- central authentication
- role-based access
- project persistence
- structured exports
- data continuity
- no file overwrite
- operational traceability

---

## Core Rules

1. Do not rename locked DOS Hub modules.
2. Do not restructure locked DOS Hub modules.
3. Do not bypass Firebase authentication.
4. Do not create separate login systems.
5. Do not deploy directly to production.
6. Legacy code from Manus and Google AI Studio is reference only.
7. Firestore is the source of truth for project records.
8. SharePoint is the archive for finalized exported documents.
9. Make is the workflow automation layer.
10. Every module output must save into My Projects.
11. Every save must attach to a project.
12. Submissions are append-only.
13. No overwrite behavior allowed.
14. Export files must be uniquely named.
15. Maintain external ID sync discipline.

---

## Locked Modules

- Home
- My Projects
- Resources
- Utilities
- Strategy Advisor
- Jurisdiction & Zoning Lookup
- Motorized Screens – Ordering Tool
- ROI Calculator
- Smart Receipt Capture
- Training
- AI Role Play
- Engineering
- Beam Span Calculator
- Marketing
- Admin
- Product Naming Tool
- Billable Rate Calculator
- External Links

Do not rename these modules.

---

## Required Architecture

GitHub = source of truth

Codex = builder

Cloud Run = application hosting

Firebase Auth = authentication

Firestore = persistence

Make = automation orchestration

SharePoint = document archive

HubSpot = CRM source of truth

Service Fusion = field operations source of truth

DOS Hub = operational intelligence layer

---

## Persistence Rules

All saved work must follow:

users/{uid}
  projects/{projectId}
    submissions/{submissionId}
  activity/{submissionId}
  idempotency/{idempotencyKey}

Rules:

- every save creates a new submission
- no overwrite
- no delete
- export trace required

---

## Export Rules

Naming format:

{projectName}__{moduleKey}__{submissionId}.pdf

All exports must route through Make.

All final files archive in SharePoint.

---

## First Objective

Build one complete workflow:

Login
→ Open Motorized Screens
→ Save to project
→ Show in My Projects
→ Generate PDF
→ Send to Make
→ Archive in SharePoint
→ Record export trace

No expansion until this workflow works.
