import { ReportInput, SalesData, InventoryData, CustomerData, MergedReport, ReportResult } from '../types';
import { ValidationError } from '../utils';
import { fetchSalesData, fetchInventoryData, fetchCustomerData } from './data-sources';

export function validateReport(input: unknown): ReportInput {
  if (!input || typeof input !== 'object') {
    throw new ValidationError('Input must be an object');
  }

  const obj = input as Record<string, unknown>;
  const validTypes = ['sales', 'inventory', 'combined'];
  if (!validTypes.includes(obj.reportType as string)) {
    throw new ValidationError(`reportType must be one of: ${validTypes.join(', ')}`);
  }

  return obj as unknown as ReportInput;
}

export function gatherSalesData(): SalesData {
  return fetchSalesData();
}

export function gatherInventoryData(): InventoryData {
  return fetchInventoryData();
}

export function gatherCustomerData(): CustomerData {
  return fetchCustomerData();
}

export function mergeReportData(
  reportType: string,
  sales?: SalesData,
  inventory?: InventoryData,
  customers?: CustomerData
): MergedReport {
  const merged: MergedReport = { reportType };

  if (sales) merged.sales = sales;
  if (inventory) merged.inventory = inventory;
  if (customers) merged.customers = customers;

  if (reportType === 'combined' && sales && inventory) {
    merged.crossReference = sales.items.map((sale) => {
      const inv = inventory.items.find((i) => i.product === sale.product);
      return {
        product: sale.product,
        quantity: sale.quantity,
        revenue: sale.revenue,
        inStock: inv?.inStock ?? 0,
        reorderLevel: inv?.reorderLevel ?? 0,
        lowStock: inv ? inv.inStock <= inv.reorderLevel : true,
      };
    });
  }

  return merged;
}

export function formatReportResult(
  sources: { sales?: SalesData; inventory?: InventoryData; customers?: CustomerData },
  merged: MergedReport
): ReportResult {
  return {
    sources,
    merged,
    generatedAt: new Date().toISOString(),
  };
}

export function processReport(input: unknown): ReportResult {
  const validated = validateReport(input);

  let sales: SalesData | undefined;
  let inventory: InventoryData | undefined;
  let customers: CustomerData | undefined;

  if (validated.reportType === 'sales' || validated.reportType === 'combined') {
    sales = gatherSalesData();
  }
  if (validated.reportType === 'inventory' || validated.reportType === 'combined') {
    inventory = gatherInventoryData();
  }
  if (validated.reportType === 'combined') {
    customers = gatherCustomerData();
  }

  const sources = { sales, inventory, customers };
  const merged = mergeReportData(validated.reportType, sales, inventory, customers);
  return formatReportResult(sources, merged);
}
