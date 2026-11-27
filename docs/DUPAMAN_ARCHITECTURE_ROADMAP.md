# DUPAMAN — Architecture, SKEL Library & Execution Roadmap

**Status:** Planning baseline — documentation only  
**Date:** 2026-11-27  
**Repository:** `rafia22110/DUPAMAN-Digital-Product-Studio`  
**Default branch at review:** `main`  
**Planning branch:** `docs/dupaman-architecture-roadmap`

> This document records the agreed direction and a staged execution plan. It is not authorization to refactor, merge, promote, or deploy to Production.

---

## 1. Product vision and goals

DUPAMAN has two connected goals:

1. **Build and mature DUPAMAN Studio** as the flagship digital product studio experience.
2. **Build a reusable project-foundation system** so future products can be started from proven, tailored SKELs (scaffolds) rather than rebuilt from scratch.

The intended outcome is a small internal platform: reusable foundations, a catalog of starter templates, project-generation tooling, shared quality standards, and a documented release process.

## 2. Architecture decision

### Decision: Modular Monolith first; evolve to a Monorepo when justified

Do not split the current application into many packages or repositories as the first move. First establish clear module boundaries inside the existing repository. Extract packages only when their interfaces, dependencies, ownership, and reuse cases are understood.

Why:
- The existing repository already contains an active product and multiple technical concerns.
- Premature package/repository splitting adds dependency and deployment complexity.
- A modular structure allows gradual extraction with smaller regression risk.
- The existing PocketBase/HTML starter should be assessed as a separate runtime path, not forcibly merged into the React/Vite application.

A future Monorepo is a valid destination, not a prerequisite for the first milestones.

## 3. Preliminary repository baseline

The following was identified from the repository tree, project metadata, and PR history during the planning review. This is a structural inventory, not a complete source audit or successful local test run.

- Main application uses React 19, TypeScript, and Vite.
- An Express server/API layer exists.
- The public experience includes specialized 3D/spatial UI components.
- Localization and bilingual public experience work exists, including EN/HE and LTR/RTL behavior.
- AI-related API/agent integration and A2A/A2UI-related areas exist.
- Content-related structures include a content registry and exhibits store.
- An administrative surface includes `StudioAdminPanel`.
- A standalone `dupaman_studio_starter` folder exists and appears to follow an HTML/PocketBase approach.
- A GitHub Actions quality workflow exists for TypeScript/lint and build checks.

### Current GitHub reference point

- Default branch: `main`
- Main HEAD observed during review: `cd02c4f0f80fde405be9b2b688a2da26e9716826`
- PR #4, “DUPAMAN Global — Bilingual Experience & Premium Typography”, is merged.
- Merge commit: `cd02c4f0f80fde405be9b2b688a2da26e9716826`

### Audit items still required

Before code changes, inspect and record:
- Full source tree and actual module dependencies.
- `package.json`, lockfile, scripts, and TypeScript configuration.
- Frontend/server entry points and API boundaries.
- Authentication, authorization, secrets handling, and data access.
- AI provider integrations, prompt/context flow, and tool execution.
- PocketBase starter capabilities and deployment assumptions.
- Vercel project settings, Production deployment, Preview deployment, environment scopes, domains, and aliases.
- Test coverage, build results, runtime errors, accessibility, and performance.

Do not treat the preliminary inventory above as proof that every listed subsystem is production-ready.

## 4. Target conceptual architecture

The following is a target organization to approach gradually. It is not a directive to move files immediately.

```text
DUPAMAN/
├── apps/
│   ├── studio/                 # Flagship public experience
│   ├── admin/                  # Isolated administration surface (when justified)
│   └── starter-pocketbase/     # Existing standalone starter, after audit
│
├── packages/
│   ├── core/                   # Shared application primitives
│   ├── design-system/          # Tokens, typography, UI primitives
│   ├── localization/           # Locale, direction, translation utilities
│   ├── ai-adapters/            # Provider-neutral AI interfaces
│   ├── content-engine/         # Content schemas and registry contracts
│   ├── security/               # Shared security utilities and policies
│   └── shared-types/           # Stable shared contracts
│
├── skels/
│   ├── experience/
│   ├── global/
│   ├── ai-studio/
│   ├── admin/
│   └── deployment/
│
├── tooling/
│   ├── project-generator/
│   └── quality-gates/
│
├── tests/
├── docs/
└── .github/
```

Only introduce workspace tooling (for example, npm/pnpm workspaces or a task runner) after the audit confirms that multiple independently maintained apps/packages need it.

## 5. SKEL catalog

Each SKEL must be independently understandable and reproducible. Every template should include:
- A clear use case and non-goals.
- A minimal working example.
- Installation and configuration instructions.
- Versioned dependencies and configuration.
- Environment-variable example without secrets.
- Automated checks and a smoke-test path.
- Accessibility, security, and performance defaults.
- A changelog and compatibility statement.
- A documented upgrade path.

### SKEL 01 — Experience

For immersive websites and interactive digital experiences:
- Spatial/navigation patterns.
- Motion and interaction primitives.
- Responsive behavior and reduced-motion support.
- Glass/surface design primitives and design tokens.
- Performance budgets and graceful fallback behavior.
- Keyboard and touch interaction.

### SKEL 02 — Global

For international and multilingual products:
- Locale selection and persistence.
- Translation key conventions and missing-key checks.
- RTL/LTR layout direction and logical CSS properties.
- Locale-aware typography, dates, numbers, and formatting.
- Language-aware AI response configuration where applicable.
- First-visit language policy configurable per project.

### SKEL 03 — AI Studio

For AI applications and agent experiences:
- Provider-neutral interfaces and adapters.
- Server-side API key handling; no secrets in browser bundles.
- Context and conversation lifecycle.
- Tool permissions and validation boundaries.
- Error, timeout, retry, and rate-limit handling.
- Observability and cost/usage instrumentation.
- Evaluation and regression tests for prompts/agent behavior.

### SKEL 04 — Admin

For private management surfaces:
- Authentication and role-based authorization.
- Separation from public routes and public data.
- Content/settings management patterns.
- Audit/activity events for sensitive operations.
- Input validation and safe error handling.
- Hebrew-only admin may remain a DUPAMAN product decision; it should not be hardcoded into the generic template.

### SKEL 05 — Deployment

For repeatable delivery:
- CI checks and reproducible builds.
- Preview and Production environment separation.
- Environment-variable validation.
- Deployment smoke tests and health checks.
- Release checklist, rollback procedure, and ownership.
- Explicit approval gates for Production promotion.

## 6. Project generator

After the first SKELs are stable, build an internal generator that can:
1. Select a template.
2. Set project name, package identifier, and metadata.
3. Select locales and default language.
4. Select supported capabilities (for example AI, admin, content, 3D).
5. Generate safe environment examples and setup instructions.
6. Install dependencies and run validation.
7. Produce a new project with a clear provenance/version record.

The generator must not copy secrets, production data, private environment values, or live credentials.

## 7. Phased execution plan

### Phase 0 — Baseline, audit, and safety boundary

Tasks:
- Confirm current main HEAD and working branches.
- Inspect current Production and Preview deployments and Vercel project configuration.
- Record environment scopes and domains without exposing secret values.
- Map repository files, entry points, dependencies, and deployment behavior.
- Establish a recoverable baseline and rollback instructions.
- Identify existing tests and run the current safe checks.

Exit criteria:
- Architecture inventory and dependency map are documented.
- Production deployment and configuration baseline are recorded.
- Known risks and unknowns are explicit.
- No application code or Production configuration has been changed.

### Phase 1 — Core boundaries and design foundation

Tasks:
- Define module responsibilities and dependency direction.
- Separate UI, domain logic, data access, server/API, and provider integrations.
- Define shared types and stable contracts.
- Consolidate design tokens and typography decisions.
- Establish localization conventions and RTL/LTR rules.
- Define the public/admin security boundary.

Exit criteria:
- Architecture decision record approved.
- Module dependency rules documented.
- Existing application still builds and passes baseline checks.
- No behavior regressions in the Preview validation path.

### Phase 2 — First SKELs

Recommended order:
1. Global
2. Experience
3. AI Studio
4. Admin
5. Deployment

Tasks:
- Extract only stable, reusable capabilities.
- Preserve the existing product while extraction is validated.
- Build a small demonstration project from each template.
- Test setup from a clean environment.

Exit criteria:
- Each SKEL has documentation, configuration, demo, checks, and version.
- A clean setup can reproduce the expected result.
- The flagship app continues to pass its regression checks.

### Phase 3 — Project Generator

Tasks:
- Define a template manifest and compatibility metadata.
- Implement interactive or CLI-based template selection.
- Generate project configuration and documentation.
- Run install/build/test checks after generation.
- Add a dry-run and safe failure behavior.

Exit criteria:
- A new sample project can be generated and validated from each supported SKEL.
- Generated projects do not inherit credentials or production-specific settings.

### Phase 4 — Quality, security, and performance

Tasks:
- Add unit, integration, and end-to-end coverage where appropriate.
- Add RTL/LTR and locale regression tests.
- Test authentication, authorization, API validation, and secret handling.
- Add accessibility and reduced-motion checks.
- Establish performance budgets for 3D and core navigation.
- Add observability and operational runbooks.

Exit criteria:
- Quality gates are repeatable and block unsafe releases.
- Known critical security and reliability issues are resolved or explicitly accepted.

### Phase 5 — Controlled release

Tasks:
- Deploy to an isolated Preview environment.
- Run automated and manual acceptance tests.
- Review the diff and deployment target.
- Obtain explicit owner approval.
- Only then merge/promote to Production.

Exit criteria:
- Written approval exists for the specific release.
- Deployment target and rollback path are verified.
- Production health is checked after release.

## 8. Release and Production protection policy

Until explicit approval is given:
- Do not push implementation changes directly to `main`.
- Do not merge a feature or documentation PR into `main` without approval.
- Do not promote a Preview deployment to Production.
- Do not change Production environment variables, domains, aliases, or project settings.
- Do not run destructive migrations or alter production data.
- Use isolated feature/documentation branches and Preview deployments only.
- Record commit SHA, validation evidence, and deployment URL for each milestone.
- If a change could affect Production indirectly, inspect Vercel Git/deployment settings before pushing it.

This document itself is committed on a dedicated documentation branch. It does not change application code or Production configuration.

## 9. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Refactor breaks the flagship experience | Small extractions, regression tests, Preview-first |
| Overengineering the workspace too early | Modular Monolith first; extract only proven boundaries |
| Duplicating the existing starter | Audit and evolve `dupaman_studio_starter` |
| AI provider lock-in | Provider-neutral contracts and server-side adapters |
| RTL/LTR regressions | Dedicated locale/direction test matrix |
| Secret or admin exposure | Server-side secrets, authorization checks, route/data separation |
| Unexpected Production deployment | Inspect Vercel configuration; explicit release gates |
| Templates become stale | Semantic versions, compatibility notes, changelog, upgrade tests |

## 10. Working agreements and decisions recorded

Agreed direction:
- Goal is **both**: mature DUPAMAN Studio and create a reusable SKEL/template foundation.
- Architecture choice is to be **recommended by engineering review**, not assumed to be a full Monorepo immediately.
- Current recommendation: Modular Monolith first, with a path to Monorepo if evidence supports it.
- Preserve the existing product and starter; do not rewrite from scratch.
- Start with a factual audit and architecture documentation before implementation.
- Prioritize Global and Experience as the first SKEL candidates.
- Keep Studio Admin separated from public experience and protect its access.
- Keep Production unchanged until explicit approval.

## 11. Immediate next actions

1. Complete Phase 0 repository and deployment audit.
2. Produce a source-backed module/dependency map.
3. Review the existing PocketBase starter and decide whether to evolve or isolate it.
4. Write Architecture Decision Records for module boundaries, localization, AI adapters, and deployment.
5. Present the proposed Phase 1 file-level change plan for approval.
6. Only then begin implementation on a dedicated feature branch.

---

**Document owner:** DUPAMAN project  
**Current status:** Plan recorded; implementation not started by this document commit.  
