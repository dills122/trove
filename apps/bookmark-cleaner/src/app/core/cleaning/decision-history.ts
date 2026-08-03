import type {
  AcceptedDecision,
  CleanerProposal,
  DecisionHistory,
  ProjectedImpactCounts,
  ProposalDecision,
  ProposalReview,
  SourceRevision,
} from './cleaner-contracts';
import { type ValidationResult, validateDecisionBatch } from './cleaner-validation';

export const createDecisionHistory = (sourceRevision: SourceRevision): DecisionHistory => ({
  sourceRevision,
  batches: [],
  cursor: 0,
});

export const applyDecisionBatch = (
  history: DecisionHistory,
  batch: unknown,
  proposals: readonly CleanerProposal[]
): ValidationResult<DecisionHistory> => {
  const validation = validateDecisionBatch(batch, {
    sourceRevision: history.sourceRevision,
    proposals,
  });
  if (!validation.ok) {
    return validation;
  }

  const activeBranch = history.batches.slice(0, history.cursor);
  const batches = [...activeBranch, validation.value];
  return {
    ok: true,
    value: {
      sourceRevision: history.sourceRevision,
      batches,
      cursor: batches.length,
    },
  };
};

export const undoDecisionBatch = (history: DecisionHistory): DecisionHistory => {
  if (history.cursor === 0) {
    return history;
  }
  return { ...history, cursor: history.cursor - 1 };
};

export const redoDecisionBatch = (history: DecisionHistory): DecisionHistory => {
  if (history.cursor === history.batches.length) {
    return history;
  }
  return { ...history, cursor: history.cursor + 1 };
};

const replayDecisions = (history: DecisionHistory): ReadonlyMap<string, ProposalDecision> => {
  const decisions = new Map<string, ProposalDecision>();
  for (const batch of history.batches.slice(0, history.cursor)) {
    for (const decision of batch.decisions) {
      if (decision.status === 'unreviewed') {
        decisions.delete(decision.proposalId);
      } else {
        decisions.set(decision.proposalId, decision);
      }
    }
  }
  return decisions;
};

export const deriveProposalReviews = (
  history: DecisionHistory,
  proposals: readonly CleanerProposal[]
): readonly ProposalReview[] => {
  const decisions = replayDecisions(history);
  return proposals.map((proposal) => {
    const decision = decisions.get(proposal.proposalId);
    return decision
      ? {
          proposalId: proposal.proposalId,
          status: decision.status,
          decision,
        }
      : {
          proposalId: proposal.proposalId,
          status: 'unreviewed',
        };
  });
};

export const deriveAcceptedDecisions = (
  history: DecisionHistory,
  proposals: readonly CleanerProposal[]
): readonly AcceptedDecision[] => {
  const decisions = replayDecisions(history);
  const accepted: AcceptedDecision[] = [];

  for (const proposal of proposals) {
    const decision = decisions.get(proposal.proposalId);
    if (decision?.status === 'accepted') {
      accepted.push({
        proposalId: proposal.proposalId,
        status: 'accepted',
        patch: proposal.patch,
      });
    } else if (decision?.status === 'modified') {
      accepted.push({
        proposalId: proposal.proposalId,
        status: 'modified',
        patch: decision.patch,
      });
    }
  }

  return accepted;
};

export const projectImpactCounts = (
  acceptedDecisions: readonly AcceptedDecision[]
): ProjectedImpactCounts => {
  let removedLinks = 0;
  let updatedUrls = 0;
  let renamedLinks = 0;
  let movedNodes = 0;
  let mergedFolders = 0;
  let removedFolders = 0;

  for (const decision of acceptedDecisions) {
    switch (decision.patch.kind) {
      case 'remove-link':
        removedLinks += 1;
        break;
      case 'update-url':
        updatedUrls += 1;
        break;
      case 'rename-link':
        renamedLinks += 1;
        break;
      case 'move-node':
        movedNodes += 1;
        break;
      case 'merge-folder':
        mergedFolders += 1;
        break;
      case 'remove-folder':
        removedFolders += 1;
        break;
    }
  }

  return {
    acceptedProposalCount: acceptedDecisions.length,
    totalPatchCount: acceptedDecisions.length,
    removedLinks,
    updatedUrls,
    renamedLinks,
    movedNodes,
    mergedFolders,
    removedFolders,
  };
};

export const deriveProjectedImpactCounts = (
  history: DecisionHistory,
  proposals: readonly CleanerProposal[]
): ProjectedImpactCounts => projectImpactCounts(deriveAcceptedDecisions(history, proposals));
