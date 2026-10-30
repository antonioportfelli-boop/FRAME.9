# FRAME.9 — Trinity Control Surface UI System

Status: implementation specification for the development branch. This is not a claim that the Figma canvas or deployed product UI is complete.

## Product intent

A calm, high-density engineering workspace for exploring source-grounded textual structures, reviewing interpretive alternatives, inspecting synthetic observations, and validating agent command blocks. It must make provenance and permission state visible before action.

## Information architecture

1. **Overview** — health of modules, recent runs, validation status, alerts and next review queue.
2. **Corpus Explorer** — edition and passage selector, source text, annotations, source citations and version metadata.
3. **Genealogy Graph** — people/entities, sourced relationship edges, disputed/proposed/attested filters, timeline, edge inspector.
4. **Interpretation Lab** — evidence panel, rule catalogue, candidate comparison, missing evidence, reviewer decision and decision history.
5. **Signal Lab** — synthetic-only observations, device metadata, timestamp/units, validity checks and provenance. A persistent “SYNTHETIC DATA” label is mandatory.
6. **Kratt Command Blocks** — manifest, requested capabilities, dry-run output, approval gate, audit trail and rollback state.
7. **Plugins** — registry, version, compatibility, scopes, health, enable/disable and dependency graph.
8. **Audit & Settings** — identity, roles, consent, retention, export controls, event history and feature flags.

## Navigation model

Desktop: fixed 248 px left navigation, compact top bar with global search and environment label, flexible content canvas, optional 320 px contextual inspector. Collapsible sidebar; route state preserved.

Tablet: compact 72 px icon rail with labels in a drawer; inspector becomes a side sheet.

Mobile: single-column views, bottom navigation for Overview / Explore / Review / More, inspector as a full-height sheet, graph uses fit-to-screen and accessible list alternative.

## Visual design direction

- Visual language: precision instrument / research workstation; not “hacker terminal”.
- Dark-first neutral graphite surfaces, restrained blue-cyan accent, green/yellow/red reserved for actual status.
- Typography: system sans-serif with clear numeric/tabular treatment.
- Grid: 8 px spacing scale; 12-column desktop content grid; 4-column mobile grid.
- Surfaces: subtle borders, minimal shadows, clear elevation; no excessive glow or animated noise.
- Density: compact tables with generous row hit targets; dense data is progressive-disclosure, not tiny text.

## Core reusable components

- AppShell, SidebarNav, MobileNav, TopBar, Breadcrumbs.
- PageHeader, SectionHeader, MetricCard, StatusPill, EmptyState, ErrorState, Skeleton.
- DataTable, FilterBar, SearchField, DateRange, Pagination.
- SourceCitation, EvidenceChip, ConfidenceLabel, ProvenancePanel.
- GraphCanvas, GraphLegend, EntityCard, RelationshipEdge, EdgeInspector.
- CandidateCard, CandidateDiff, RuleBadge, MissingEvidenceList, ReviewDecisionBar.
- SyntheticDataBanner, ObservationCard, UnitLabel, SignalTimeline.
- CommandBlockCard, CapabilityList, DryRunConsole, ApprovalGate, RollbackBadge.
- PluginCard, VersionBadge, DependencyGraph, CompatibilityMatrix.
- AuditEvent, PermissionMatrix, ConsentNotice.

## Canonical interaction flows

### Review an interpretation
Select passage → inspect source context → select candidate(s) → inspect matched/missing evidence → compare alternatives → human reviewer records accept/reject/needs-evidence plus rationale → immutable review event is created. Never silently collapse alternatives.

### Inspect a genealogy edge
Open graph or entity → select relationship edge → show source passage, assertion status, source edition, provenance, and dispute history → allow correction/proposal without rewriting original evidence.

### Run a Kratt block
Open manifest → show capability diff and scope → validate → preview dry-run → explicit user approval → execute only allowed local semantic operation → append audit event → expose rollback where meaningful. No unattended or hidden execution.

### Signal lab
Only synthetic fixtures by default. Label all synthetic content at page, chart and export levels. No device pairing, stimulation, clinical diagnosis or decision support.

## Responsive breakpoints

- Mobile: 0–639 px
- Tablet: 640–1023 px
- Desktop: 1024–1439 px
- Wide: 1440 px+

At every breakpoint: avoid horizontal page overflow, preserve critical action visibility, and provide an accessible non-canvas representation of graph data.

## Accessibility requirements

WCAG 2.2 AA target. Keyboard-first operation, visible focus, semantic landmarks, adequate contrast, reduced-motion support, labels and descriptions for charts/graphs, status never conveyed by color alone, and no inaccessible drag-only interactions.

## Data boundaries

Textual-semantic records and biomedical/synthetic observations remain distinct schemas and storage boundaries. Cross-domain association is an explicitly reviewed link, not an inference. No interpretation may be presented as a clinical fact.

## UI acceptance checklist

- Routes and panels are permission-aware and have loading/empty/error states.
- Candidate comparisons retain evidence and alternatives.
- All genealogy edges can be inspected as a semantic list, not only a canvas.
- Every signal datum is visibly synthetic.
- Command capabilities are deny-by-default and visible before approval.
- Responsive keyboard / screen-reader workflows pass.
- No physical device or clinical actions are exposed.
