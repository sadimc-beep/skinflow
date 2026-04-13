# Architectural Decisions

> **Source:** Inferred from code patterns and structure (April 2026). Rationale is best-effort interpretation.

## Decision Record Format

Each decision includes:
- **Decision**: What was chosen
- **Context**: Why it was needed
- **Rationale**: Inferred reasoning
- **Consequences**: Trade-offs and implications

---

## AD-001: Django + Next.js Hybrid Architecture

**Decision:** Use Django as a pure REST API backend with Next.js as the frontend, rather than Django templates or a full SPA.

**Context:** Need a system that supports both server-rendered pages (for SEO/performance) and rich interactive UIs (for clinical workflows).

**Rationale:**
- Django provides robust ORM, admin, and ecosystem for business logic
- Next.js App Router enables server components for fast initial loads
- React provides rich UI components for complex forms and interactions
- Clean separation allows independent scaling and development

**Consequences:**
- Two codebases to maintain
- Need to keep API contracts stable
- Authentication must bridge both systems (JWT chosen)
- Additional complexity in deployment

---

## AD-002: Multi-Tenancy via Organization FK

**Decision:** Implement multi-tenancy using a foreign key to Organization on all data models, rather than schema-per-tenant or database-per-tenant.

**Context:** SaaS model requires data isolation between clinic organizations.

**Rationale:**
- Simplest approach to implement and maintain
- Single database reduces operational complexity
- Django ORM handles filtering naturally
- Sufficient for expected scale (hundreds of clinics, not millions)

**Consequences:**
- Must ensure all queries filter by organization
- Single database could become bottleneck at extreme scale
- No database-level isolation (relies on application logic)
- Easier to accidentally leak data if filtering is missed

---

## AD-003: Entitlement-Based Procedure Authorization

**Decision:** Require paid entitlements before procedure sessions can be executed. Entitlements are created automatically when invoices become PAID.

**Context:** Clinics need to ensure patients have paid for procedures before they're performed, and track usage of multi-session packages.

**Rationale:**
- Prevents revenue leakage from unbilled procedures
- Tracks remaining sessions in treatment plans
- Creates clear audit trail of what was paid vs. consumed
- Automates the check-in/billing coordination

**Consequences:**
- Adds workflow step: must generate invoice and receive payment before session
- `enforce_entitlement_for_session()` must be called before starting sessions
- Complexity in handling edge cases (refunds, transfers)
- Products handled differently (fulfilled immediately, no entitlements)

---

## AD-004: Double-Entry Accounting Integration

**Decision:** Build a full double-entry accounting module with automated journal posting from billing events.

**Context:** Clinics need proper financial records, and manual data entry is error-prone.

**Rationale:**
- Accounting accuracy is critical for business reporting
- Automation reduces data entry errors
- Real-time financial visibility
- Supports bank reconciliation workflows

**Consequences:**
- Increased complexity in billing services
- `AccountingService` hooks must be maintained as billing logic evolves
- System accounts must be properly seeded
- Requires accounting knowledge to configure correctly

---

## AD-005: JWT Authentication with SimpleJWT

**Decision:** Use JWT tokens for API authentication, stored in browser localStorage.

**Context:** Need stateless authentication that works across Django backend and Next.js frontend.

**Rationale:**
- Stateless: no server-side session storage needed
- Works well with API-first architecture
- SimpleJWT is well-maintained Django package
- Token rotation and blacklisting supported

**Consequences:**
- Tokens must be managed on client side
- XSS vulnerability if localStorage is compromised
- Token refresh logic needed in frontend
- Logout requires token blacklisting or short expiry

---

## AD-006: SQLite for Development, PostgreSQL for Production

**Decision:** Use SQLite as the default development database, with PostgreSQL as the production target.

**Context:** Need easy local development without requiring database setup, but production-grade database for deployment.

**Rationale:**
- SQLite requires zero configuration for developers
- PostgreSQL handles concurrency and scale better
- Environment variables switch database engine
- Common pattern for Django projects

**Consequences:**
- Some PostgreSQL-specific features can't be used (or need fallbacks)
- Must test with PostgreSQL before production
- Migration behavior may differ slightly
- `db.sqlite3` file included in development

---

## AD-007: Role-Based Access Control with JSON Permissions

**Decision:** Store granular permissions as a JSON object on the Role model rather than using Django's built-in permission system.

**Context:** Need flexible, organization-specific permission sets that can be customized per clinic.

**Rationale:**
- More flexible than Django's model-level permissions
- Allows custom permission structures per organization
- Easier to add new permission types without migrations
- Can represent complex access rules

**Consequences:**
- Must implement permission checking manually
- No Django admin permission integration
- Permission structure not enforced by schema
- Need frontend logic to check permissions

---

## AD-008: SaaS Layer Built Into Core Application

**Decision:** Build subscription management, billing, and multi-org administration as part of the same Django project (saas app).

**Context:** Need to manage subscriptions, onboard clinics, and provide SaaS admin capabilities.

**Rationale:**
- Shared user model simplifies authentication
- Can leverage existing Organization model
- Single deployment artifact
- Impersonation feature enables support workflows

**Consequences:**
- SaaS and clinic concerns intermixed
- Must carefully separate SaaS admin from clinic admin
- Same codebase handles both billing types (SaaS and clinic)
- Scaling must consider both workloads

---

## AD-009: Service Layer for Business Logic

**Decision:** Place complex business logic in service modules (e.g., `billing/services.py`, `accounting/services.py`) rather than in views or models.

**Context:** Complex workflows like invoice generation involve multiple models and side effects.

**Rationale:**
- Keeps views thin and focused on HTTP handling
- Keeps models focused on data structure
- Services can be tested independently
- Reusable across different entry points (API, admin, management commands)

**Consequences:**
- Need to remember to use services instead of direct model manipulation
- Service layer adds a layer to understand
- Must document which operations require services

---

## AD-010: shadcn/ui Component Pattern

**Decision:** Use shadcn/ui-style component architecture (copy-paste components, Radix UI primitives, Tailwind styling).

**Context:** Need a consistent, modern UI component library that's fully customizable.

**Rationale:**
- Full control over component code (not a black-box library)
- Radix UI provides accessible primitives
- Tailwind enables rapid styling
- Active community and well-documented patterns

**Consequences:**
- Components must be maintained in-project
- Updates require manual merging
- Team must understand Tailwind and Radix
- `components/ui/` directory grows over time

---

## AD-011: Server Components as Default

**Decision:** Use React Server Components by default in Next.js, with 'use client' only where interactivity is needed.

**Context:** Next.js 16 App Router defaults to Server Components.

**Rationale:**
- Better performance (less JavaScript shipped)
- Direct data fetching without client-side state
- Simpler mental model for data loading
- Progressive enhancement possible

**Consequences:**
- Must explicitly mark interactive components
- Can't use hooks in server components
- Data fetching patterns differ from traditional React
- Learning curve for team familiar with client-only React

---

## AD-012: Invoice Types and Mixed Billing

**Decision:** Support multiple invoice types (CONSULTATION, TREATMENT_PLAN, PRODUCT, MIXED, OTHER) rather than strictly typed invoices.

**Context:** Clinics need flexibility in what they bill together.

**Rationale:**
- Real-world billing often combines services and products
- MIXED type allows any combination
- Type serves as hint for UI presentation
- Appointment-linked invoices support progressive billing

**Consequences:**
- Invoice processing must handle all types
- UI must adapt to different content types
- Reporting must aggregate across types
- Type inference needed when generating invoices

---

## AD-013: Prescription to Invoice Deduplication

**Decision:** Track which prescription items have been billed via `billed_invoice` FK, preventing double-billing.

**Context:** Partial billing means some items may be billed later; need to prevent billing same item twice.

**Rationale:**
- Clear link between prescription and invoice
- Query unbilled items easily
- Prevents accidental duplicate charges
- Supports "bill now, bill later" workflows

**Consequences:**
- Must check `billed_invoice` before billing
- Refund scenarios need careful handling
- FK creates coupling between billing and clinical modules

---

## AD-014: Mobile Financial Services Payment Methods

**Decision:** Include BKASH and NAGAD as first-class payment methods alongside CASH and CARD.

**Context:** Bangladesh market uses mobile financial services extensively.

**Rationale:**
- Reflects local payment landscape
- Simplifies reporting by payment method
- Prepares for future gateway integration
- Explicit rather than using "OTHER"

**Consequences:**
- Payment method enum is region-specific
- May need localization for other markets
- Gateway integration needed for digital verification

---

## AD-015: Git Workflow

**Decision:** Use a simplified trunk-based workflow with feature branches and sprint tags.

**Context:** Solo developer working through 4 planned sprints. Need a workflow that's lightweight but maintains history and allows rollback.

**Rationale:**
- Solo development doesn't need complex branching (no parallel teams)
- Trunk-based keeps things simple and avoids merge hell
- Feature branches provide isolation for work-in-progress
- Sprint tags create clear milestones for reference

### Branch Structure

```
main                    ← Always deployable, protected
  └── feature/xxx       ← Short-lived feature branches
```

### Workflow Rules

1. **main is always deployable**
   - Never commit directly to main
   - All work goes through feature branches
   - Merge only when feature is complete and tested

2. **Feature branch naming**
   ```
   feature/rbac-enforcement
   feature/file-upload
   feature/patient-checkin
   ```
   - Prefix with `feature/`
   - Use kebab-case
   - Keep names short but descriptive

3. **Commit conventions**
   ```
   feat: add patient check-in tablet mode
   fix: resolve org resolution in multi-tenant context
   docs: update STATUS.md after RBAC completion
   refactor: extract permission checking to middleware
   ```
   - Use conventional commits (feat/fix/docs/refactor/test/chore)
   - Keep commits atomic and focused

4. **Sprint tags**
   ```
   git tag -a v0.1.0 -m "Sprint 1: Infrastructure complete"
   git tag -a v0.2.0 -m "Sprint 2: Core Clinical UX complete"
   git tag -a v0.3.0 -m "Sprint 3: Operations complete"
   git tag -a v0.4.0 -m "Sprint 4: Growth complete"
   ```
   - Tag main after each sprint completes
   - Use semantic versioning (0.x.0 for sprints, 0.x.y for patches)

5. **Daily workflow**
   ```bash
   # Start feature
   git checkout main
   git pull
   git checkout -b feature/patient-checkin

   # Work on feature (multiple commits OK)
   git add -p
   git commit -m "feat: add tablet check-in route"

   # Complete feature
   git checkout main
   git pull
   git merge feature/patient-checkin
   git push
   git branch -d feature/patient-checkin
   ```

6. **When to branch**
   - One branch per feature from the roadmap
   - Small fixes can go directly to main (use judgment)
   - If a feature takes >2 days, consider breaking it into smaller branches

### What We're NOT Using

- **No develop branch** — Adds overhead without benefit for solo dev
- **No release branches** — Sprint tags serve this purpose
- **No GitFlow** — Overkill for this project size
- **No squash merges** — Keep full history for context

**Consequences:**
- Simple mental model
- Full commit history preserved
- Easy to rollback to any sprint
- No merge conflicts with yourself
- Can add complexity later if team grows

---

## AD-016: Production Hosting — Linode Singapore + Cloudflare

**Decision:** Host on a Linode 4GB VPS in Singapore with Cloudflare for DNS and HTTPS.

**Context:** Needed affordable production hosting with low latency from Dhaka, Bangladesh. The primary user base (clinic staff) is in Dhaka. Evaluated several options before deciding.

**Considered:**
- **Oracle Free Tier** — Eliminated: persistent capacity availability issues in the region; unreliable for production
- **Hetzner** — Eliminated: no Singapore data centre; nearest is Singapore via partner (higher latency), EU DC too far from BD
- **Vercel (frontend) + Railway/Render (backend)** — Eliminated: added complexity of split deployment; Vercel pricing scales poorly for file uploads

**Chose:** Linode 4GB Singapore ($24/mo) + Cloudflare free tier

**Consequences:**
- ~50ms latency from Dhaka (Singapore is the closest major DC to Bangladesh)
- Simple VPS management — no container orchestration needed at current scale
- Cloudflare handles SSL termination and provides DDoS protection for free
- Single server means database and app share resources — acceptable until user growth requires separation
- Manual deployment workflow (no CI/CD yet); `git pull` + `systemctl restart` on server

---

## Decisions Pending / Open Questions [VERIFY]

1. ~~**File Storage Strategy**~~ **RESOLVED** — Using local filesystem (`media/`) in production. S3 config is wired in `settings.py` via `AWS_STORAGE_BUCKET_NAME` env var for future migration.

2. **Notification System**: Email/SMS not implemented; need to choose providers and patterns

3. **Caching Strategy**: No explicit caching layer; may need Redis for performance

4. **Search Infrastructure**: Basic filtering exists; full-text search may need Elasticsearch

5. **Testing Strategy**: No test suite; need to decide on coverage targets and tooling

---

*These decisions should be reviewed and validated with stakeholders. Update as actual rationale is clarified.*

---

## AD-021: Entitlement-to-Session Linking Strategy

**Decision:** Sessions created from the patient Entitlements tab auto-link the entitlement at creation time. The entitlement selector on the session detail page is a fallback for sessions created without one (e.g., from Django admin or future API consumers).

**Context:** A `ProcedureSession` must have a linked `Entitlement` before it can be started. Two creation paths exist: (1) from the patient's Entitlements tab, which pre-sets the entitlement; (2) from Django admin or direct API calls, which may not set it.

**Rationale:**
- Auto-linking on creation is the cleanest UX — therapist never needs to think about entitlements
- Fallback selector prevents sessions from being permanently stuck if created without one
- Backend enforcement via `enforce_entitlement_for_session()` remains the source of truth

**Consequences:**
- Frontend must pass `entitlement` when creating sessions from the Entitlements tab
- Session detail page must handle both the linked and unlinked states
- The `canStart` guard in the frontend mirrors backend enforcement for immediate feedback

## AD-022: Session Date Filtering by scheduled_at

**Decision:** The sessions list API filters by `scheduled_at__date` when `?date=` is provided. Sessions without a `scheduled_at` (e.g., admin-created) do not appear in daily views.

**Context:** Daily sessions list needs to show sessions scheduled for a specific date. `scheduled_at` is optional on the model for legacy compatibility.

**Rationale:** Filtering by creation date (`created_at`) is meaningless for scheduling. Sessions without `scheduled_at` are edge cases (admin-created) and should not pollute daily views.

**Consequences:** Any session created without `scheduled_at` will not appear on the daily list. The session is still accessible via direct URL. The session list column shows `(created)` annotation when falling back to `created_at` for display.

## AD-023: "Packages" Tab Renamed to "Entitlements"

**Decision:** The "Packages" tab on the patient detail page was renamed to "Entitlements" and now shows inactive/expired entitlements in addition to active ones.

**Context:** "Packages" was a marketing term that didn't match the data model. Staff found it confusing that sessions and entitlements were separate concepts with no visible connection on the patient page.

**Rationale:** Aligns UI terminology with the data model and backend API. Showing expired entitlements gives reception staff full history when patients query their package usage.

---

## AD-024: Entitlement Consumed on Session Completion, Not Start

**Date:** April 13, 2026

**Decision:** `entitlement.used_qty` increments (and `remaining_qty` decrements) when a `ProcedureSession` transitions to `COMPLETED`, not when it transitions to `STARTED`.

**Context:** The original design consumed entitlement quantity at session start. In clinic practice, therapists occasionally hit "Start" by mistake or start a session that gets aborted for clinical reasons (patient reaction, equipment failure). Under the old model, an accidental start permanently consumed a session unit with no recovery path short of a manual DB edit.

**Rationale:**
- An entitlement represents a paid, completed service unit — completion is the correct semantic trigger.
- Accidental or aborted starts can be corrected: status can be reverted to PLANNED without consuming the entitlement.
- Over-starting is still prevented: `enforce_entitlement_for_session` counts in-flight STARTED sessions against `remaining_qty` before allowing a new start.
- The cancellation guard (AD-025) provides the complementary control: once consumables are issued, the session cannot be cancelled and must be completed.

**Affected files:** `clinical/views.py` (`perform_update`, `start_session`), `billing/services.py` (`enforce_entitlement_for_session`)

---

## AD-025: Session Cancellation Blocked When Consumables Issued

**Date:** April 13, 2026

**Decision:** A `ProcedureSession` cannot be set to `CANCELLED` if it has any linked `InventoryRequisition` with status `APPROVED` or `FULFILLED`.

**Context:** Consumables dispensed from stock for a session represent real inventory movements. Allowing cancellation after consumables are issued would leave the stock ledger in an inconsistent state (items deducted but session voided with no return workflow).

**Rationale:**
- Enforces data integrity between clinical and inventory modules.
- Forces staff to either complete the session or explicitly return consumables through the requisition workflow before cancelling.
- Error message directs staff to the correct resolution path.

**Affected files:** `clinical/views.py` (`perform_update`)
