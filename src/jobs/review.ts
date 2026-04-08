import { TransformResult, ReviewResult } from '../types';
import { validateTransform, normalizeRecords, aggregateRecords, formatTransformResult } from './transform';

export function processReviewTransform(input: unknown): TransformResult {
  const validated = validateTransform(input);
  const normalized = normalizeRecords(validated);
  const aggregated = aggregateRecords(normalized);
  return formatTransformResult(aggregated);
}

export function createApprovalResult(processed: TransformResult): ReviewResult {
  return {
    processed,
    reviewStatus: 'approved',
    reviewedAt: new Date().toISOString(),
  };
}

export function createRejectionResult(processed: TransformResult): ReviewResult {
  return {
    processed,
    reviewStatus: 'rejected',
    reviewedAt: new Date().toISOString(),
  };
}
