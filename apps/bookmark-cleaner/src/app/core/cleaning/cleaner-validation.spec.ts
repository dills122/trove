import {
  CLEANER_SCHEMA_VERSION,
  type CleanerDefinition,
  type CleanerPatch,
  type CleanerProposal,
  type DecisionBatch,
} from './cleaner-contracts';
import {
  isCleanerPatch,
  validateCleanerDefinition,
  validateCleanerProposal,
  validateCleanerProposals,
  validateDecisionBatch,
} from './cleaner-validation';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const allowedBulk = {
  mode: 'allowed',
  allowedDecisions: ['accepted', 'rejected', 'skipped'],
  requiresConfirmation: true,
} as const;

const definition: CleanerDefinition = {
  schemaVersion: CLEANER_SCHEMA_VERSION,
  id: 'duplicate-link-cleaner',
  version: '1.0.0',
  name: 'Duplicate links',
  description: 'Proposes removal of exact duplicate links.',
  execution: 'local',
  patchKinds: ['remove-link'],
  bulkReviewPolicy: allowedBulk,
};

const createProposal = (
  proposalId: string,
  patch: CleanerPatch = { kind: 'remove-link', linkId: `link-${proposalId}` },
  overrides: Partial<CleanerProposal> = {}
): CleanerProposal => ({
  schemaVersion: CLEANER_SCHEMA_VERSION,
  proposalId,
  sourceRevision: 'source-revision-a',
  cleaner: { id: definition.id, version: definition.version },
  summary: `Review ${proposalId}`,
  patch,
  confidence: { level: 'certain', score: 1, rationale: 'Exact local match.' },
  impact: { level: 'low', affectedNodeCount: 1, description: 'Changes one node.' },
  evidence: [
    { source: 'local', code: 'exact-url', summary: 'Normalized URLs match.' },
    {
      source: 'cloud',
      code: 'redirect-target',
      summary: 'Both URLs resolve to the same target.',
      provider: 'link-health',
      observedAt: '2026-08-02T12:00:00.000Z',
    },
  ],
  dependencies: [],
  conflicts: [],
  bulkReviewPolicy: allowedBulk,
  ...overrides,
});

const createBatch = (
  decisions: DecisionBatch['decisions'],
  overrides: Partial<DecisionBatch> = {}
): DecisionBatch => ({
  schemaVersion: CLEANER_SCHEMA_VERSION,
  batchId: 'batch-a',
  sourceRevision: 'source-revision-a',
  kind: decisions.length === 1 ? 'single' : 'bulk',
  confirmed: true,
  decisions,
  ...overrides,
});

describe('cleaner contract validation', () => {
  it('accepts a versioned definition and rejects unsupported schema versions', () => {
    expect(validateCleanerDefinition(definition)).toEqual({ ok: true, value: definition });

    const result = validateCleanerDefinition({ ...definition, schemaVersion: 2 });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues).toContainEqual(
        expect.objectContaining({ code: 'unsupported-schema-version' })
      );
    }
  });

  it.each<CleanerPatch>([
    { kind: 'remove-link', linkId: 'link-a' },
    { kind: 'update-url', linkId: 'link-a', url: 'https://example.test/updated' },
    { kind: 'rename-link', linkId: 'link-a', title: '' },
    { kind: 'move-node', nodeId: 'link-a', destinationFolderId: 'folder-b', position: 0 },
    { kind: 'merge-folder', sourceFolderId: 'folder-a', destinationFolderId: 'folder-b' },
    { kind: 'remove-folder', folderId: 'folder-a', mode: 'empty-only' },
  ])('accepts the $kind patch contract', (patch) => {
    expect(isCleanerPatch(patch)).toBe(true);
    expect(validateCleanerProposal(createProposal(`proposal-${patch.kind}`, patch)).ok).toBe(true);
  });

  it('rejects malformed patches and invalid confidence without modifying the input', () => {
    const input = {
      ...createProposal('proposal-a'),
      patch: { kind: 'move-node', nodeId: 'same', destinationFolderId: 'same' },
      confidence: { level: 'high', score: 1.1, rationale: 'Too high.' },
    };
    const before = clone(input);

    const result = validateCleanerProposal(input);

    expect(result.ok).toBe(false);
    expect(input).toEqual(before);
  });

  it('validates dependencies, conflicts, cleaner versions, and source revisions as a set', () => {
    const proposalA = createProposal('proposal-a', undefined, {
      dependencies: ['missing-proposal'],
    });
    const proposalB = createProposal('proposal-b', undefined, {
      sourceRevision: 'source-revision-b',
      cleaner: { id: definition.id, version: 'missing-version' },
      conflicts: ['proposal-b'],
    });

    const result = validateCleanerProposals([proposalA, proposalB], {
      definitions: [definition],
      sourceRevision: 'source-revision-a',
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.map((issue) => issue.code)).toEqual(
        expect.arrayContaining([
          'unknown-proposal-id',
          'unknown-cleaner',
          'source-revision-mismatch',
        ])
      );
    }
  });

  it('rejects source revision mismatches, unknown proposals, and retargeted modified patches', () => {
    const proposal = createProposal('proposal-a', {
      kind: 'update-url',
      linkId: 'link-a',
      url: 'https://example.test/original',
    });
    const batch = createBatch(
      [
        {
          proposalId: 'proposal-a',
          status: 'modified',
          patch: {
            kind: 'update-url',
            linkId: 'different-link',
            url: 'https://example.test/modified',
          },
        },
        { proposalId: 'missing-proposal', status: 'accepted' },
      ],
      { sourceRevision: 'source-revision-b' }
    );

    const result = validateDecisionBatch(batch, {
      sourceRevision: 'source-revision-a',
      proposals: [proposal],
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.map((issue) => issue.code)).toEqual(
        expect.arrayContaining(['source-revision-mismatch'])
      );
    }

    const correctedRevision = validateDecisionBatch(
      { ...batch, sourceRevision: 'source-revision-a' },
      { sourceRevision: 'source-revision-a', proposals: [proposal] }
    );
    expect(correctedRevision.ok).toBe(false);
    if (!correctedRevision.ok) {
      expect(correctedRevision.issues.map((issue) => issue.code)).toEqual(
        expect.arrayContaining(['unknown-proposal-id', 'invalid-modified-patch'])
      );
    }
  });

  it('enforces proposal-level bulk eligibility and explicit confirmation', () => {
    const allowed = createProposal('allowed');
    const forbidden = createProposal('forbidden', undefined, {
      bulkReviewPolicy: { mode: 'never' },
    });
    const decisions: DecisionBatch['decisions'] = [
      { proposalId: 'allowed', status: 'accepted' },
      { proposalId: 'forbidden', status: 'accepted' },
    ];

    const forbiddenResult = validateDecisionBatch(createBatch(decisions), {
      sourceRevision: 'source-revision-a',
      proposals: [allowed, forbidden],
    });
    expect(forbiddenResult.ok).toBe(false);
    if (!forbiddenResult.ok) {
      expect(forbiddenResult.issues).toContainEqual(
        expect.objectContaining({ code: 'bulk-review-not-allowed' })
      );
    }

    const unconfirmedResult = validateDecisionBatch(
      createBatch(
        [
          { proposalId: 'allowed', status: 'accepted' },
          { proposalId: 'allowed-2', status: 'accepted' },
        ],
        { confirmed: false }
      ),
      {
        sourceRevision: 'source-revision-a',
        proposals: [allowed, createProposal('allowed-2')],
      }
    );
    expect(unconfirmedResult.ok).toBe(false);
    if (!unconfirmedResult.ok) {
      expect(unconfirmedResult.issues).toContainEqual(
        expect.objectContaining({ code: 'bulk-confirmation-required' })
      );
    }
  });

  it('accepts a confirmed bulk batch when every proposal policy permits its decision', () => {
    const proposals = [createProposal('proposal-a'), createProposal('proposal-b')];
    const batch = createBatch([
      { proposalId: 'proposal-a', status: 'accepted' },
      { proposalId: 'proposal-b', status: 'skipped' },
    ]);

    expect(
      validateDecisionBatch(batch, { sourceRevision: 'source-revision-a', proposals })
    ).toEqual({ ok: true, value: batch });
  });
});
