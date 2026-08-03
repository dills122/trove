import {
  CLEANER_SCHEMA_VERSION,
  type BulkDecisionStatus,
  type BulkReviewPolicy,
  type CleanerDefinition,
  type CleanerEvidence,
  type CleanerPatch,
  type CleanerPatchKind,
  type CleanerProposal,
  type DecisionBatch,
  type ProposalDecision,
  type SourceRevision,
} from './cleaner-contracts';

export type ValidationIssueCode =
  | 'invalid-value'
  | 'unsupported-schema-version'
  | 'duplicate-proposal-id'
  | 'unknown-cleaner'
  | 'unknown-proposal-id'
  | 'source-revision-mismatch'
  | 'invalid-modified-patch'
  | 'bulk-review-not-allowed'
  | 'bulk-decision-not-allowed'
  | 'bulk-confirmation-required';

export interface ValidationIssue {
  readonly code: ValidationIssueCode;
  readonly path: string;
  readonly message: string;
}

export type ValidationResult<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly issues: readonly ValidationIssue[] };

export interface ProposalSetValidationOptions {
  readonly definitions?: readonly CleanerDefinition[];
  readonly sourceRevision?: SourceRevision;
}

export interface DecisionBatchValidationContext {
  readonly sourceRevision: SourceRevision;
  readonly proposals: readonly CleanerProposal[];
}

type UnknownRecord = Record<string, unknown>;

const PATCH_KINDS: readonly CleanerPatchKind[] = [
  'remove-link',
  'update-url',
  'rename-link',
  'move-node',
  'merge-folder',
  'remove-folder',
];
const BULK_DECISIONS: readonly BulkDecisionStatus[] = ['accepted', 'rejected', 'skipped'];
const CONFIDENCE_LEVELS = ['certain', 'high', 'medium', 'low'] as const;
const IMPACT_LEVELS = ['low', 'medium', 'high'] as const;
const REVIEW_STATUSES = [
  'unreviewed',
  'accepted',
  'rejected',
  'modified',
  'skipped',
  'superseded',
  'conflicted',
] as const;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

const isString = (value: unknown): value is string => typeof value === 'string';

const isNonNegativeInteger = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0;

const hasOnlyUniqueStrings = (values: readonly string[]): boolean =>
  new Set(values).size === values.length;

const invalid = (path: string, message: string): ValidationIssue => ({
  code: 'invalid-value',
  path,
  message,
});

const validateStringArray = (
  value: unknown,
  path: string,
  issues: ValidationIssue[]
): value is readonly string[] => {
  if (!Array.isArray(value) || !value.every(isNonEmptyString)) {
    issues.push(invalid(path, 'Expected an array of non-empty strings.'));
    return false;
  }
  return true;
};

const validateSchemaVersion = (
  value: unknown,
  path: string,
  issues: ValidationIssue[]
): boolean => {
  if (value !== CLEANER_SCHEMA_VERSION) {
    issues.push({
      code: 'unsupported-schema-version',
      path,
      message: `Expected cleaner schema version ${CLEANER_SCHEMA_VERSION}.`,
    });
    return false;
  }
  return true;
};

const validateBulkReviewPolicy = (
  value: unknown,
  path: string,
  issues: ValidationIssue[]
): value is BulkReviewPolicy => {
  if (!isRecord(value)) {
    issues.push(invalid(path, 'Expected a bulk review policy object.'));
    return false;
  }
  if (value['mode'] === 'never') {
    return true;
  }
  if (value['mode'] !== 'allowed') {
    issues.push(invalid(`${path}.mode`, 'Expected "never" or "allowed".'));
    return false;
  }

  let valid = true;
  if (
    !Array.isArray(value['allowedDecisions']) ||
    value['allowedDecisions'].length === 0 ||
    !value['allowedDecisions'].every(
      (decision): decision is BulkDecisionStatus =>
        typeof decision === 'string' && BULK_DECISIONS.includes(decision as BulkDecisionStatus)
    ) ||
    !hasOnlyUniqueStrings(value['allowedDecisions'])
  ) {
    issues.push(
      invalid(
        `${path}.allowedDecisions`,
        'Expected unique accepted, rejected, or skipped decisions.'
      )
    );
    valid = false;
  }
  if (typeof value['requiresConfirmation'] !== 'boolean') {
    issues.push(invalid(`${path}.requiresConfirmation`, 'Expected a boolean.'));
    valid = false;
  }
  return valid;
};

const isPolicyWithinDefinition = (
  policy: BulkReviewPolicy,
  definitionPolicy: BulkReviewPolicy
): boolean => {
  if (policy.mode === 'never') {
    return true;
  }
  if (definitionPolicy.mode === 'never') {
    return false;
  }
  return (
    policy.allowedDecisions.every((decision) =>
      definitionPolicy.allowedDecisions.includes(decision)
    ) &&
    (!definitionPolicy.requiresConfirmation || policy.requiresConfirmation)
  );
};

export const isCleanerPatch = (value: unknown): value is CleanerPatch => {
  if (!isRecord(value)) {
    return false;
  }

  switch (value['kind']) {
    case 'remove-link':
      return isNonEmptyString(value['linkId']);
    case 'update-url':
      return isNonEmptyString(value['linkId']) && isNonEmptyString(value['url']);
    case 'rename-link':
      return isNonEmptyString(value['linkId']) && isString(value['title']);
    case 'move-node':
      return (
        isNonEmptyString(value['nodeId']) &&
        isNonEmptyString(value['destinationFolderId']) &&
        value['nodeId'] !== value['destinationFolderId'] &&
        (value['position'] === undefined || isNonNegativeInteger(value['position']))
      );
    case 'merge-folder':
      return (
        isNonEmptyString(value['sourceFolderId']) &&
        isNonEmptyString(value['destinationFolderId']) &&
        value['sourceFolderId'] !== value['destinationFolderId']
      );
    case 'remove-folder':
      return (
        isNonEmptyString(value['folderId']) &&
        (value['mode'] === 'empty-only' || value['mode'] === 'recursive')
      );
    default:
      return false;
  }
};

const validateConfidence = (value: unknown, path: string, issues: ValidationIssue[]): boolean => {
  if (!isRecord(value)) {
    issues.push(invalid(path, 'Expected a confidence object.'));
    return false;
  }
  let valid = true;
  if (!CONFIDENCE_LEVELS.includes(value['level'] as (typeof CONFIDENCE_LEVELS)[number])) {
    issues.push(invalid(`${path}.level`, 'Expected a supported confidence level.'));
    valid = false;
  }
  if (
    typeof value['score'] !== 'number' ||
    !Number.isFinite(value['score']) ||
    value['score'] < 0 ||
    value['score'] > 1
  ) {
    issues.push(invalid(`${path}.score`, 'Expected a finite score in the range 0..1.'));
    valid = false;
  }
  if (!isNonEmptyString(value['rationale'])) {
    issues.push(invalid(`${path}.rationale`, 'Expected a non-empty rationale.'));
    valid = false;
  }
  return valid;
};

const validateImpact = (value: unknown, path: string, issues: ValidationIssue[]): boolean => {
  if (!isRecord(value)) {
    issues.push(invalid(path, 'Expected an impact object.'));
    return false;
  }
  let valid = true;
  if (!IMPACT_LEVELS.includes(value['level'] as (typeof IMPACT_LEVELS)[number])) {
    issues.push(invalid(`${path}.level`, 'Expected a supported impact level.'));
    valid = false;
  }
  if (!isNonNegativeInteger(value['affectedNodeCount'])) {
    issues.push(invalid(`${path}.affectedNodeCount`, 'Expected a non-negative integer.'));
    valid = false;
  }
  if (!isNonEmptyString(value['description'])) {
    issues.push(invalid(`${path}.description`, 'Expected a non-empty description.'));
    valid = false;
  }
  return valid;
};

const validateEvidence = (
  value: unknown,
  path: string,
  issues: ValidationIssue[]
): value is CleanerEvidence => {
  if (!isRecord(value)) {
    issues.push(invalid(path, 'Expected an evidence object.'));
    return false;
  }
  let valid = true;
  if (!isNonEmptyString(value['code'])) {
    issues.push(invalid(`${path}.code`, 'Expected a non-empty code.'));
    valid = false;
  }
  if (!isNonEmptyString(value['summary'])) {
    issues.push(invalid(`${path}.summary`, 'Expected a non-empty summary.'));
    valid = false;
  }
  if (value['source'] === 'local') {
    return valid;
  }
  if (value['source'] !== 'cloud') {
    issues.push(invalid(`${path}.source`, 'Expected "local" or "cloud".'));
    return false;
  }
  if (!isNonEmptyString(value['provider'])) {
    issues.push(invalid(`${path}.provider`, 'Expected a non-empty provider.'));
    valid = false;
  }
  if (!isNonEmptyString(value['observedAt'])) {
    issues.push(invalid(`${path}.observedAt`, 'Expected a non-empty observation time.'));
    valid = false;
  }
  return valid;
};

export const validateCleanerDefinition = (value: unknown): ValidationResult<CleanerDefinition> => {
  const issues: ValidationIssue[] = [];
  if (!isRecord(value)) {
    return { ok: false, issues: [invalid('$', 'Expected a cleaner definition object.')] };
  }

  validateSchemaVersion(value['schemaVersion'], '$.schemaVersion', issues);
  for (const field of ['id', 'version', 'name', 'description'] as const) {
    if (!isNonEmptyString(value[field])) {
      issues.push(invalid(`$.${field}`, 'Expected a non-empty string.'));
    }
  }
  if (value['execution'] !== 'local' && value['execution'] !== 'cloud-assisted') {
    issues.push(invalid('$.execution', 'Expected "local" or "cloud-assisted".'));
  }
  if (
    !Array.isArray(value['patchKinds']) ||
    value['patchKinds'].length === 0 ||
    !value['patchKinds'].every(
      (kind): kind is CleanerPatchKind =>
        typeof kind === 'string' && PATCH_KINDS.includes(kind as CleanerPatchKind)
    ) ||
    !hasOnlyUniqueStrings(value['patchKinds'])
  ) {
    issues.push(invalid('$.patchKinds', 'Expected unique supported patch kinds.'));
  }
  validateBulkReviewPolicy(value['bulkReviewPolicy'], '$.bulkReviewPolicy', issues);

  return issues.length === 0
    ? { ok: true, value: value as unknown as CleanerDefinition }
    : { ok: false, issues };
};

export const validateCleanerProposal = (value: unknown): ValidationResult<CleanerProposal> => {
  const issues: ValidationIssue[] = [];
  if (!isRecord(value)) {
    return { ok: false, issues: [invalid('$', 'Expected a cleaner proposal object.')] };
  }

  validateSchemaVersion(value['schemaVersion'], '$.schemaVersion', issues);
  for (const field of ['proposalId', 'sourceRevision', 'summary'] as const) {
    if (!isNonEmptyString(value[field])) {
      issues.push(invalid(`$.${field}`, 'Expected a non-empty string.'));
    }
  }
  if (!isRecord(value['cleaner'])) {
    issues.push(invalid('$.cleaner', 'Expected a cleaner reference.'));
  } else {
    if (!isNonEmptyString(value['cleaner']['id'])) {
      issues.push(invalid('$.cleaner.id', 'Expected a non-empty cleaner ID.'));
    }
    if (!isNonEmptyString(value['cleaner']['version'])) {
      issues.push(invalid('$.cleaner.version', 'Expected a non-empty cleaner version.'));
    }
  }
  if (!isCleanerPatch(value['patch'])) {
    issues.push(invalid('$.patch', 'Expected a valid cleaner patch.'));
  }
  validateConfidence(value['confidence'], '$.confidence', issues);
  validateImpact(value['impact'], '$.impact', issues);
  if (!Array.isArray(value['evidence'])) {
    issues.push(invalid('$.evidence', 'Expected an evidence array.'));
  } else {
    value['evidence'].forEach((item, index) =>
      validateEvidence(item, `$.evidence[${index}]`, issues)
    );
  }
  const dependencies = value['dependencies'];
  const conflicts = value['conflicts'];
  const dependenciesValid = validateStringArray(dependencies, '$.dependencies', issues);
  const conflictsValid = validateStringArray(conflicts, '$.conflicts', issues);
  if (dependenciesValid && !hasOnlyUniqueStrings(dependencies)) {
    issues.push(invalid('$.dependencies', 'Expected unique proposal IDs.'));
  }
  if (conflictsValid && !hasOnlyUniqueStrings(conflicts)) {
    issues.push(invalid('$.conflicts', 'Expected unique proposal IDs.'));
  }
  validateBulkReviewPolicy(value['bulkReviewPolicy'], '$.bulkReviewPolicy', issues);

  return issues.length === 0
    ? { ok: true, value: value as unknown as CleanerProposal }
    : { ok: false, issues };
};

export const validateCleanerProposals = (
  values: readonly unknown[],
  options: ProposalSetValidationOptions = {}
): ValidationResult<readonly CleanerProposal[]> => {
  const issues: ValidationIssue[] = [];
  const proposals: CleanerProposal[] = [];

  values.forEach((value, index) => {
    const result = validateCleanerProposal(value);
    if (result.ok) {
      proposals.push(result.value);
    } else {
      issues.push(
        ...result.issues.map((issue) => ({ ...issue, path: `$[${index}]${issue.path.slice(1)}` }))
      );
    }
  });

  if (issues.length > 0) {
    return { ok: false, issues };
  }

  const proposalsById = new Map<string, CleanerProposal>();
  proposals.forEach((proposal, index) => {
    if (proposalsById.has(proposal.proposalId)) {
      issues.push({
        code: 'duplicate-proposal-id',
        path: `$[${index}].proposalId`,
        message: `Duplicate proposal ID "${proposal.proposalId}".`,
      });
    } else {
      proposalsById.set(proposal.proposalId, proposal);
    }
  });

  const definitionsByKey = new Map(
    options.definitions?.map((definition) => [
      `${definition.id}\u0000${definition.version}`,
      definition,
    ]) ?? []
  );

  proposals.forEach((proposal, index) => {
    if (
      options.sourceRevision !== undefined &&
      proposal.sourceRevision !== options.sourceRevision
    ) {
      issues.push({
        code: 'source-revision-mismatch',
        path: `$[${index}].sourceRevision`,
        message: 'Proposal source revision does not match the expected source revision.',
      });
    }
    if (options.definitions !== undefined) {
      const definition = definitionsByKey.get(
        `${proposal.cleaner.id}\u0000${proposal.cleaner.version}`
      );
      if (!definition) {
        issues.push({
          code: 'unknown-cleaner',
          path: `$[${index}].cleaner`,
          message: 'Proposal references an unknown cleaner definition or version.',
        });
      } else {
        if (!definition.patchKinds.includes(proposal.patch.kind)) {
          issues.push(
            invalid(
              `$[${index}].patch.kind`,
              'Proposal patch kind is not supported by its cleaner definition.'
            )
          );
        }
        if (!isPolicyWithinDefinition(proposal.bulkReviewPolicy, definition.bulkReviewPolicy)) {
          issues.push(
            invalid(
              `$[${index}].bulkReviewPolicy`,
              'Proposal bulk policy cannot grant permissions beyond its cleaner definition.'
            )
          );
        }
      }
    }
    for (const [field, references] of [
      ['dependencies', proposal.dependencies],
      ['conflicts', proposal.conflicts],
    ] as const) {
      references.forEach((proposalId, referenceIndex) => {
        if (proposalId === proposal.proposalId || !proposalsById.has(proposalId)) {
          issues.push({
            code: 'unknown-proposal-id',
            path: `$[${index}].${field}[${referenceIndex}]`,
            message:
              proposalId === proposal.proposalId
                ? 'A proposal cannot reference itself.'
                : `Unknown proposal ID "${proposalId}".`,
          });
        }
      });
    }
  });

  return issues.length === 0 ? { ok: true, value: proposals } : { ok: false, issues };
};

const validateDecision = (
  value: unknown,
  path: string,
  issues: ValidationIssue[]
): value is ProposalDecision => {
  if (!isRecord(value)) {
    issues.push(invalid(path, 'Expected a proposal decision object.'));
    return false;
  }
  let valid = true;
  if (!isNonEmptyString(value['proposalId'])) {
    issues.push(invalid(`${path}.proposalId`, 'Expected a non-empty proposal ID.'));
    valid = false;
  }
  if (!REVIEW_STATUSES.includes(value['status'] as (typeof REVIEW_STATUSES)[number])) {
    issues.push(invalid(`${path}.status`, 'Expected a supported review status.'));
    return false;
  }
  if (value['status'] === 'modified' && !isCleanerPatch(value['patch'])) {
    issues.push({
      code: 'invalid-modified-patch',
      path: `${path}.patch`,
      message: 'Modified decisions require a valid cleaner patch.',
    });
    valid = false;
  }
  if (value['status'] === 'superseded' && !isNonEmptyString(value['supersededByProposalId'])) {
    issues.push(invalid(`${path}.supersededByProposalId`, 'Expected a proposal ID.'));
    valid = false;
  }
  if (value['status'] === 'conflicted') {
    const conflictingProposalIds = value['conflictingProposalIds'];
    const conflictsValid = validateStringArray(
      conflictingProposalIds,
      `${path}.conflictingProposalIds`,
      issues
    );
    if (
      conflictsValid &&
      (conflictingProposalIds.length === 0 || !hasOnlyUniqueStrings(conflictingProposalIds))
    ) {
      issues.push(
        invalid(`${path}.conflictingProposalIds`, 'Expected at least one unique proposal ID.')
      );
      valid = false;
    }
  }
  return valid;
};

const samePatchTarget = (original: CleanerPatch, modified: CleanerPatch): boolean => {
  if (original.kind !== modified.kind) {
    return false;
  }
  switch (original.kind) {
    case 'remove-link':
    case 'update-url':
    case 'rename-link':
      return 'linkId' in modified && original.linkId === modified.linkId;
    case 'move-node':
      return 'nodeId' in modified && original.nodeId === modified.nodeId;
    case 'merge-folder':
      return 'sourceFolderId' in modified && original.sourceFolderId === modified.sourceFolderId;
    case 'remove-folder':
      return 'folderId' in modified && original.folderId === modified.folderId;
  }
};

export const validateDecisionBatch = (
  value: unknown,
  context: DecisionBatchValidationContext
): ValidationResult<DecisionBatch> => {
  const issues: ValidationIssue[] = [];
  if (!isRecord(value)) {
    return { ok: false, issues: [invalid('$', 'Expected a decision batch object.')] };
  }

  validateSchemaVersion(value['schemaVersion'], '$.schemaVersion', issues);
  if (!isNonEmptyString(value['batchId'])) {
    issues.push(invalid('$.batchId', 'Expected a non-empty batch ID.'));
  }
  if (!isNonEmptyString(value['sourceRevision'])) {
    issues.push(invalid('$.sourceRevision', 'Expected a non-empty source revision.'));
  } else if (value['sourceRevision'] !== context.sourceRevision) {
    issues.push({
      code: 'source-revision-mismatch',
      path: '$.sourceRevision',
      message: 'Decision batch source revision does not match the history source revision.',
    });
  }
  if (value['kind'] !== 'single' && value['kind'] !== 'bulk') {
    issues.push(invalid('$.kind', 'Expected "single" or "bulk".'));
  }
  if (typeof value['confirmed'] !== 'boolean') {
    issues.push(invalid('$.confirmed', 'Expected a boolean.'));
  }
  if (!Array.isArray(value['decisions']) || value['decisions'].length === 0) {
    issues.push(invalid('$.decisions', 'Expected at least one decision.'));
  } else {
    value['decisions'].forEach((decision, index) =>
      validateDecision(decision, `$.decisions[${index}]`, issues)
    );
    if (value['kind'] === 'single' && value['decisions'].length !== 1) {
      issues.push(invalid('$.decisions', 'Single batches require exactly one decision.'));
    }
  }

  // Do not cast or inspect the batch as a domain contract until its entire base shape is valid.
  if (issues.length > 0) {
    return { ok: false, issues };
  }

  const batch = value as unknown as DecisionBatch;
  const proposalsById = new Map(
    context.proposals.map((proposal) => [proposal.proposalId, proposal])
  );
  const seen = new Set<string>();

  batch.decisions.forEach((decision, index) => {
    const proposal = proposalsById.get(decision.proposalId);
    if (!proposal) {
      issues.push({
        code: 'unknown-proposal-id',
        path: `$.decisions[${index}].proposalId`,
        message: `Unknown proposal ID "${decision.proposalId}".`,
      });
      return;
    }
    if (seen.has(decision.proposalId)) {
      issues.push({
        code: 'duplicate-proposal-id',
        path: `$.decisions[${index}].proposalId`,
        message: `Proposal "${decision.proposalId}" appears more than once in the batch.`,
      });
    }
    seen.add(decision.proposalId);

    if (proposal.sourceRevision !== context.sourceRevision) {
      issues.push({
        code: 'source-revision-mismatch',
        path: `$.decisions[${index}].proposalId`,
        message: 'Proposal source revision does not match the history source revision.',
      });
    }
    if (decision.status === 'modified' && !samePatchTarget(proposal.patch, decision.patch)) {
      issues.push({
        code: 'invalid-modified-patch',
        path: `$.decisions[${index}].patch`,
        message: 'A modified patch must preserve the proposal patch kind and target.',
      });
    }
    if (decision.status === 'superseded') {
      if (
        decision.supersededByProposalId === decision.proposalId ||
        !proposalsById.has(decision.supersededByProposalId)
      ) {
        issues.push({
          code: 'unknown-proposal-id',
          path: `$.decisions[${index}].supersededByProposalId`,
          message: 'Superseded decisions must reference another known proposal.',
        });
      }
    }
    if (decision.status === 'conflicted') {
      decision.conflictingProposalIds.forEach((proposalId, conflictIndex) => {
        if (proposalId === decision.proposalId || !proposalsById.has(proposalId)) {
          issues.push({
            code: 'unknown-proposal-id',
            path: `$.decisions[${index}].conflictingProposalIds[${conflictIndex}]`,
            message: 'Conflicted decisions must reference another known proposal.',
          });
        }
      });
    }

    if (batch.kind === 'bulk') {
      const policy = proposal.bulkReviewPolicy;
      if (policy.mode === 'never') {
        issues.push({
          code: 'bulk-review-not-allowed',
          path: `$.decisions[${index}]`,
          message: `Proposal "${decision.proposalId}" does not allow bulk review.`,
        });
      } else if (!BULK_DECISIONS.includes(decision.status as BulkDecisionStatus)) {
        issues.push({
          code: 'bulk-decision-not-allowed',
          path: `$.decisions[${index}].status`,
          message: 'This review state cannot be applied in bulk.',
        });
      } else if (!policy.allowedDecisions.includes(decision.status as BulkDecisionStatus)) {
        issues.push({
          code: 'bulk-decision-not-allowed',
          path: `$.decisions[${index}].status`,
          message: `The proposal policy does not allow bulk ${decision.status}.`,
        });
      } else if (policy.requiresConfirmation && !batch.confirmed) {
        issues.push({
          code: 'bulk-confirmation-required',
          path: '$.confirmed',
          message: 'At least one proposal requires explicit confirmation for bulk review.',
        });
      }
    }
  });

  return issues.length === 0 ? { ok: true, value: batch } : { ok: false, issues };
};
