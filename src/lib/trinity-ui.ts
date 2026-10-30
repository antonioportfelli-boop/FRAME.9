/**
 * FRAME.9 Trinity UI view-model contracts.
 * Keeps source assertions, interpretations, synthetic observations and commands
 * explicit at the presentation boundary.
 */

export type EvidenceStatus = "attested" | "disputed" | "proposed";
export type ReviewStatus = "pending" | "accepted" | "rejected" | "needs-evidence";

export interface SourceReference {
  passageId: string;
  editionId: string;
  label: string;
  uri?: string;
}

export interface GenealogyEdgeView {
  id: string;
  parentLabel: string;
  childLabel: string;
  status: EvidenceStatus;
  sources: SourceReference[];
  reviewerNote?: string;
}

export interface InterpretiveCandidateView {
  ruleId: string;
  method: string;
  summary: string;
  matchedEvidence: string[];
  missingEvidence: string[];
  reviewStatus: ReviewStatus;
  requiresHumanReview: true;
}

export interface SyntheticObservationView {
  id: string;
  deviceLabel: string;
  metric: string;
  value: number;
  unit: string;
  observedAt: string;
  provenance: "synthetic-fixture";
}

export interface CommandBlockView {
  id: string;
  mode: "dry-run";
  capabilities: string[];
  validation: "valid" | "blocked";
  humanApprovalRequired: true;
  rollbackAvailable: boolean;
}

export type TrinityWorkspaceTab =
  | "overview"
  | "corpus"
  | "genealogy"
  | "interpretation"
  | "signals"
  | "commands"
  | "plugins"
  | "audit";
