export type JobType = 'transform' | 'report' | 'review';
export type JobStatus = 'pending' | 'processing' | 'review' | 'complete' | 'failed' | 'rejected';

export interface Job {
  id: string;
  type: JobType;
  status: JobStatus;
  input: unknown;
  result?: unknown;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransformInput {
  records: Array<{ name: string; value: number; category: string }>;
}

export interface NormalizedRecords {
  records: Array<{ name: string; value: number; category: string }>;
}

export interface AggregatedData {
  summary: Array<{
    category: string;
    count: number;
    sum: number;
    average: number;
  }>;
  totalRecords: number;
}

export interface TransformResult {
  summary: Array<{
    category: string;
    count: number;
    sum: number;
    average: number;
  }>;
  totalRecords: number;
  processedAt: string;
}

export interface ReportInput {
  reportType: 'sales' | 'inventory' | 'combined';
  dateRange?: { start: string; end: string };
}

export interface SalesData {
  items: Array<{ product: string; quantity: number; revenue: number }>;
  total: number;
}

export interface InventoryData {
  items: Array<{ product: string; inStock: number; reorderLevel: number }>;
}

export interface CustomerData {
  totalCustomers: number;
  activeCustomers: number;
  topCustomers: Array<{ name: string; spend: number }>;
}

export interface MergedReport {
  reportType: string;
  sales?: SalesData;
  inventory?: InventoryData;
  customers?: CustomerData;
  crossReference?: Array<{
    product: string;
    quantity: number;
    revenue: number;
    inStock: number;
    reorderLevel: number;
    lowStock: boolean;
  }>;
}

export interface ReportResult {
  sources: {
    sales?: SalesData;
    inventory?: InventoryData;
    customers?: CustomerData;
  };
  merged: MergedReport;
  generatedAt: string;
}

export interface ReviewInput {
  records: Array<{ name: string; value: number; category: string }>;
  reviewer?: string;
}

export interface ReviewResult {
  processed: TransformResult;
  reviewStatus: 'approved' | 'rejected';
  reviewedAt?: string;
}
