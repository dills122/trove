import {
  CLEANER_SCHEMA_VERSION,
  type CleanerPatch,
  type CleanerProposal,
  type DecisionBatch,
  type DecisionHistory,
} from './cleaner-contracts';
import {
  applyDecisionBatch,
  createDecisionHistory,
  deriveAcceptedDecisions,
  deriveProjectedImpactCounts,
  deriveProposalReviews,
  redoDecisionBatch,
  undoDecisionBatch,
} from './decision-history';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const bulkReviewPolicy = {
  mode: 'allowed',
  allowedDecisions: ['accepted', 'rejected', 'skipped'],
  requiresConfirmation: false,
} as const;

const createProposal = (proposalId: string, patch: CleanerPatch): CleanerProposal => ({
  schemaVersion: CLEANER_SCHEMA_VERSION,
  proposalId,
  sourceRevision: 'revision-1',
  cleaner: { id: 'test-cleaner', version: '1' },
  summary: proposalId,
  patch,
  confidence: { level: 'high', score: 0.9, rationale: 'Fixture evidence.' },
  impact: { level: 'low', affectedNodeCount: 1, description: 'One node.' },
  evidence: [{ source: 'local', code: 'fixture', summary: 'Fixture evidence.' }],
  dependencies: [],
  conflicts: [],
  bulkReviewPolicy,
});

const proposals: readonly CleanerProposal[] = [
  createProposal('remove', { kind: 'remove-link', linkId: 'link-remove' }),
  createProposal('url', {
    kind: 'update-url',
    linkId: 'link-url',
    url: 'https://example.test/one',
  }),
  createProposal('rename', { kind: 'rename-link', linkId: 'link-rename', title: 'New name' }),
  createProposal('move', {
    kind: 'move-node',
    nodeId: 'node-move',
    destinationFolderId: 'folder-target',
  }),
  createProposal('merge', {
    kind: 'merge-folder',
    sourceFolderId: 'folder-source',
    destinationFolderId: 'folder-target',
  }),
  createProposal('remove-folder', {
    kind: 'remove-folder',
    folderId: 'folder-empty',
    mode: 'empty-only',
  }),
];

let batchSequence = 0;
const createBatch = (
  decisions: DecisionBatch['decisions'],
  overrides: Partial<DecisionBatch> = {}
): DecisionBatch => {
  batchSequence += 1;
  return {
    schemaVersion: CLEANER_SCHEMA_VERSION,
    batchId: `batch-${batchSequence}`,
    sourceRevision: 'revision-1',
    kind: decisions.length === 1 ? 'single' : 'bulk',
    confirmed: true,
    decisions,
    ...overrides,
  };
};

const apply = (history: DecisionHistory, batch: DecisionBatch): DecisionHistory => {
  const result = applyDecisionBatch(history, batch, proposals);
  if (!result.ok) {
    throw new Error(result.issues.map((issue) => issue.message).join('\n'));
  }
  return result.value;
};

describe('decision history', () => {
  beforeEach(() => {
    batchSequence = 0;
  });

  it('starts every proposal as unreviewed without mutating proposals', () => {
    const before = clone(proposals);
    const history = createDecisionHistory('revision-1');

    expect(deriveProposalReviews(history, proposals)).toEqual(
      proposals.map((proposal) => ({ proposalId: proposal.proposalId, status: 'unreviewed' }))
    );
    expect(proposals).toEqual(before);
  });

  it('replays batches deterministically and lets the latest decision win', () => {
    const initial = createDecisionHistory('revision-1');
    const accepted = apply(initial, createBatch([{ proposalId: 'remove', status: 'accepted' }]));
    const rejected = apply(accepted, createBatch([{ proposalId: 'remove', status: 'rejected' }]));

    const firstReplay = deriveProposalReviews(rejected, proposals);
    const secondReplay = deriveProposalReviews(clone(rejected), clone(proposals));

    expect(firstReplay).toEqual(secondReplay);
    expect(firstReplay[0]).toEqual({
      proposalId: 'remove',
      status: 'rejected',
      decision: { proposalId: 'remove', status: 'rejected' },
    });
  });

  it('undoes and redoes whole batches with a stable cursor', () => {
    const batchOne = createBatch([{ proposalId: 'remove', status: 'accepted' }]);
    const batchTwo = createBatch([{ proposalId: 'rename', status: 'accepted' }]);
    const committed = apply(apply(createDecisionHistory('revision-1'), batchOne), batchTwo);

    const undone = undoDecisionBatch(committed);
    const redone = redoDecisionBatch(undone);

    expect(undone.cursor).toBe(1);
    expect(undone.batches).toBe(committed.batches);
    expect(deriveAcceptedDecisions(undone, proposals).map((item) => item.proposalId)).toEqual([
      'remove',
    ]);
    expect(redone.cursor).toBe(2);
    expect(deriveAcceptedDecisions(redone, proposals).map((item) => item.proposalId)).toEqual([
      'remove',
      'rename',
    ]);
    expect(undoDecisionBatch(createDecisionHistory('revision-1')).cursor).toBe(0);
    expect(redoDecisionBatch(committed)).toBe(committed);
  });

  it('truncates the redo tail when a new batch is committed after undo', () => {
    const first = createBatch([{ proposalId: 'remove', status: 'accepted' }]);
    const abandoned = createBatch([{ proposalId: 'rename', status: 'accepted' }]);
    const replacement = createBatch([{ proposalId: 'url', status: 'accepted' }]);
    const original = apply(apply(createDecisionHistory('revision-1'), first), abandoned);

    const branched = apply(undoDecisionBatch(original), replacement);

    expect(branched.batches).toEqual([first, replacement]);
    expect(branched.cursor).toBe(2);
    expect(deriveAcceptedDecisions(branched, proposals).map((item) => item.proposalId)).toEqual([
      'remove',
      'url',
    ]);
    expect(original.batches).toEqual([first, abandoned]);
  });

  it('uses a compatible modified patch as the effective accepted decision', () => {
    const modifiedPatch: CleanerPatch = {
      kind: 'update-url',
      linkId: 'link-url',
      url: 'https://example.test/two',
    };
    const history = apply(
      createDecisionHistory('revision-1'),
      createBatch([{ proposalId: 'url', status: 'modified', patch: modifiedPatch }])
    );

    expect(deriveAcceptedDecisions(history, proposals)).toEqual([
      { proposalId: 'url', status: 'modified', patch: modifiedPatch },
    ]);
  });

  it('can reset a reviewed proposal to unreviewed through replay', () => {
    const accepted = apply(
      createDecisionHistory('revision-1'),
      createBatch([{ proposalId: 'remove', status: 'accepted' }])
    );
    const reset = apply(accepted, createBatch([{ proposalId: 'remove', status: 'unreviewed' }]));

    expect(deriveProposalReviews(reset, proposals)[0]).toEqual({
      proposalId: 'remove',
      status: 'unreviewed',
    });
    expect(deriveAcceptedDecisions(reset, proposals)).toEqual([]);
  });

  it('replays every review state without treating non-accepted states as export decisions', () => {
    const decisions: readonly DecisionBatch['decisions'][number][] = [
      { proposalId: 'remove', status: 'accepted' },
      {
        proposalId: 'url',
        status: 'modified',
        patch: {
          kind: 'update-url',
          linkId: 'link-url',
          url: 'https://example.test/modified',
        },
      },
      { proposalId: 'rename', status: 'rejected' },
      { proposalId: 'move', status: 'skipped' },
      { proposalId: 'merge', status: 'superseded', supersededByProposalId: 'remove' },
      {
        proposalId: 'remove-folder',
        status: 'conflicted',
        conflictingProposalIds: ['remove'],
      },
    ];
    const history = decisions.reduce(
      (current, decision) => apply(current, createBatch([decision])),
      createDecisionHistory('revision-1')
    );

    expect(deriveProposalReviews(history, proposals).map((review) => review.status)).toEqual([
      'accepted',
      'modified',
      'rejected',
      'skipped',
      'superseded',
      'conflicted',
    ]);
    expect(
      deriveAcceptedDecisions(history, proposals).map((decision) => decision.proposalId)
    ).toEqual(['remove', 'url']);
  });

  it('applies a bulk batch atomically and projects counts from effective patches', () => {
    const batch = createBatch(
      proposals.map((proposal) => ({
        proposalId: proposal.proposalId,
        status: 'accepted' as const,
      }))
    );
    const history = apply(createDecisionHistory('revision-1'), batch);

    expect(deriveProjectedImpactCounts(history, proposals)).toEqual({
      acceptedProposalCount: 6,
      totalPatchCount: 6,
      removedLinks: 1,
      updatedUrls: 1,
      renamedLinks: 1,
      movedNodes: 1,
      mergedFolders: 1,
      removedFolders: 1,
    });
  });

  it('rejects invalid batches without changing history or inputs', () => {
    const history = createDecisionHistory('revision-1');
    const historyBefore = clone(history);
    const proposalsBefore = clone(proposals);
    const invalidBatch = createBatch([{ proposalId: 'missing', status: 'accepted' }], {
      sourceRevision: 'revision-2',
    });

    const result = applyDecisionBatch(history, invalidBatch, proposals);

    expect(result.ok).toBe(false);
    expect(history).toEqual(historyBefore);
    expect(proposals).toEqual(proposalsBefore);
    expect(invalidBatch.sourceRevision).toBe('revision-2');
  });
});
