import { TransformInput, NormalizedRecords, AggregatedData, TransformResult } from '../types';
import { ValidationError } from '../utils';

export function validateTransform(input: unknown): TransformInput {
  if (!input || typeof input !== 'object') {
    throw new ValidationError('Input must be an object');
  }

  const obj = input as Record<string, unknown>;
  if (!Array.isArray(obj.records) || obj.records.length === 0) {
    throw new ValidationError('Input must contain a non-empty "records" array');
  }

  for (let i = 0; i < obj.records.length; i++) {
    const record = obj.records[i];
    if (!record || typeof record !== 'object') {
      throw new ValidationError(`Record at index ${i} must be an object`);
    }
    if (typeof record.name !== 'string') {
      throw new ValidationError(`Record at index ${i} must have a string "name"`);
    }
    if (typeof record.value !== 'number') {
      throw new ValidationError(`Record at index ${i} must have a number "value"`);
    }
    if (typeof record.category !== 'string') {
      throw new ValidationError(`Record at index ${i} must have a string "category"`);
    }
  }

  return obj as unknown as TransformInput;
}

export function normalizeRecords(input: TransformInput): NormalizedRecords {
  return {
    records: input.records.map((record) => ({
      name: record.name.trim(),
      value: record.value < 0 ? 0 : record.value,
      category: record.category.trim().toLowerCase(),
    })),
  };
}

export function aggregateRecords(normalized: NormalizedRecords): AggregatedData {
  const groups = new Map<string, { count: number; sum: number }>();

  for (const record of normalized.records) {
    const existing = groups.get(record.category);
    if (existing) {
      existing.count += 1;
      existing.sum += record.value;
    } else {
      groups.set(record.category, { count: 1, sum: record.value });
    }
  }

  const summary = Array.from(groups.entries())
    .map(([category, { count, sum }]) => ({
      category,
      count,
      sum,
      average: Math.round((sum / count) * 100) / 100,
    }))
    .sort((a, b) => a.category.localeCompare(b.category));

  return {
    summary,
    totalRecords: normalized.records.length,
  };
}

export function formatTransformResult(data: AggregatedData): TransformResult {
  return {
    summary: data.summary,
    totalRecords: data.totalRecords,
    processedAt: new Date().toISOString(),
  };
}

export function processTransform(input: unknown): TransformResult {
  const validated = validateTransform(input);
  const normalized = normalizeRecords(validated);
  const aggregated = aggregateRecords(normalized);
  return formatTransformResult(aggregated);
}
