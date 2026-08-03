export const CLEANER_SCHEMA_VERSION = 1 as const;

export type CleanerSchemaVersion = typeof CLEANER_SCHEMA_VERSION;
export type CleanerId = string;
export type CleanerVersion = string;
export type ProposalId = string;
export type SourceRevision = string;
export type NodeId = string;

export type CleanerPatch =
  | RemoveLinkPatch
  | UpdateUrlPatch
  | RenameLinkPatch
  | MoveNodePatch
  | MergeFolderPatch
  | RemoveFolderPatch;

export type CleanerPatchKind = CleanerPatch['kind'];

export interface RemoveLinkPatch {
  readonly kind: 'remove-link';
  readonly linkId: NodeId;
}

export interface UpdateUrlPatch {
  readonly kind: 'update-url';
  readonly linkId: NodeId;
  readonly url: string;
}

export interface RenameLinkPatch {
  readonly kind: 'rename-link';
  readonly linkId: NodeId;
  readonly title: string;
}

export interface MoveNodePatch {
  readonly kind: 'move-node';
  readonly nodeId: NodeId;
  readonly destinationFolderId: NodeId;
  readonly position?: number;
}

export interface MergeFolderPatch {
  readonly kind: 'merge-folder';
  readonly sourceFolderId: NodeId;
  readonly destinationFolderId: NodeId;
}

export interface RemoveFolderPatch {
  readonly kind: 'remove-folder';
  readonly folderId: NodeId;
  readonly mode: 'empty-only' | 'recursive';
}

export type ConfidenceLevel = 'certain' | 'high' | 'medium' | 'low';

export interface CleanerConfidence {
  readonly level: ConfidenceLevel;
  /** A normalized score in the inclusive range 0..1. */
  readonly score: number;
  readonly rationale: string;
}

export type ImpactLevel = 'low' | 'medium' | 'high';

export interface CleanerImpact {
  readonly level: ImpactLevel;
  readonly affectedNodeCount: number;
  readonly description: string;
}

export type CleanerEvidence = LocalCleanerEvidence | CloudCleanerEvidence;

export interface LocalCleanerEvidence {
  readonly source: 'local';
  readonly code: string;
  readonly summary: string;
}

export interface CloudCleanerEvidence {
  readonly source: 'cloud';
  readonly code: string;
  readonly summary: string;
  readonly provider: string;
  /** An ISO-8601 observation time supplied by the cloud-assist boundary. */
  readonly observedAt: string;
}

export type BulkDecisionStatus = 'accepted' | 'rejected' | 'skipped';

export type BulkReviewPolicy =
  | {
      readonly mode: 'never';
    }
  | {
      readonly mode: 'allowed';
      readonly allowedDecisions: readonly BulkDecisionStatus[];
      readonly requiresConfirmation: boolean;
    };

export interface CleanerReference {
  readonly id: CleanerId;
  readonly version: CleanerVersion;
}

export interface CleanerDefinitionV1 {
  readonly schemaVersion: CleanerSchemaVersion;
  readonly id: CleanerId;
  readonly version: CleanerVersion;
  readonly name: string;
  readonly description: string;
  readonly execution: 'local' | 'cloud-assisted';
  readonly patchKinds: readonly CleanerPatchKind[];
  readonly bulkReviewPolicy: BulkReviewPolicy;
}

/** A versioned union so future contract versions can be added without changing consumers silently. */
export type CleanerDefinition = CleanerDefinitionV1;

export interface CleanerProposalV1 {
  readonly schemaVersion: CleanerSchemaVersion;
  readonly proposalId: ProposalId;
  readonly sourceRevision: SourceRevision;
  readonly cleaner: CleanerReference;
  readonly summary: string;
  readonly patch: CleanerPatch;
  readonly confidence: CleanerConfidence;
  readonly impact: CleanerImpact;
  readonly evidence: readonly CleanerEvidence[];
  readonly dependencies: readonly ProposalId[];
  readonly conflicts: readonly ProposalId[];
  readonly bulkReviewPolicy: BulkReviewPolicy;
}

/** Proposals never interpret proposal IDs or source revisions; both remain opaque strings. */
export type CleanerProposal = CleanerProposalV1;

export type ReviewStatus =
  | 'unreviewed'
  | 'accepted'
  | 'rejected'
  | 'modified'
  | 'skipped'
  | 'superseded'
  | 'conflicted';

interface ProposalDecisionBase {
  readonly proposalId: ProposalId;
}

export interface UnreviewedDecision extends ProposalDecisionBase {
  readonly status: 'unreviewed';
}

export interface AcceptedProposalDecision extends ProposalDecisionBase {
  readonly status: 'accepted';
}

export interface RejectedProposalDecision extends ProposalDecisionBase {
  readonly status: 'rejected';
}

export interface ModifiedProposalDecision extends ProposalDecisionBase {
  readonly status: 'modified';
  readonly patch: CleanerPatch;
}

export interface SkippedProposalDecision extends ProposalDecisionBase {
  readonly status: 'skipped';
}

export interface SupersededProposalDecision extends ProposalDecisionBase {
  readonly status: 'superseded';
  readonly supersededByProposalId: ProposalId;
}

export interface ConflictedProposalDecision extends ProposalDecisionBase {
  readonly status: 'conflicted';
  readonly conflictingProposalIds: readonly ProposalId[];
}

export type ProposalDecision =
  | UnreviewedDecision
  | AcceptedProposalDecision
  | RejectedProposalDecision
  | ModifiedProposalDecision
  | SkippedProposalDecision
  | SupersededProposalDecision
  | ConflictedProposalDecision;

export interface DecisionBatchV1 {
  readonly schemaVersion: CleanerSchemaVersion;
  readonly batchId: string;
  readonly sourceRevision: SourceRevision;
  readonly kind: 'single' | 'bulk';
  readonly confirmed: boolean;
  readonly decisions: readonly ProposalDecision[];
}

export type DecisionBatch = DecisionBatchV1;

export interface DecisionHistory {
  readonly sourceRevision: SourceRevision;
  /** Complete active branch, including the redo tail after the cursor. */
  readonly batches: readonly DecisionBatch[];
  /** Number of batches currently applied; always in the range 0..batches.length. */
  readonly cursor: number;
}

export interface ProposalReview {
  readonly proposalId: ProposalId;
  readonly status: ReviewStatus;
  readonly decision?: ProposalDecision;
}

export interface AcceptedDecision {
  readonly proposalId: ProposalId;
  readonly status: 'accepted' | 'modified';
  readonly patch: CleanerPatch;
}

export interface ProjectedImpactCounts {
  readonly acceptedProposalCount: number;
  readonly totalPatchCount: number;
  readonly removedLinks: number;
  readonly updatedUrls: number;
  readonly renamedLinks: number;
  readonly movedNodes: number;
  readonly mergedFolders: number;
  readonly removedFolders: number;
}
