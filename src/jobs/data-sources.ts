import { SalesData, InventoryData, CustomerData } from '../types';

export function fetchSalesData(): SalesData {
  return {
    items: [
      { product: 'Widget A', quantity: 150, revenue: 4500 },
      { product: 'Widget B', quantity: 85, revenue: 3400 },
      { product: 'Gadget X', quantity: 200, revenue: 10000 },
      { product: 'Gadget Y', quantity: 45, revenue: 2700 },
      { product: 'Gizmo Z', quantity: 300, revenue: 6000 },
    ],
    total: 26600,
  };
}

export function fetchInventoryData(): InventoryData {
  return {
    items: [
      { product: 'Widget A', inStock: 500, reorderLevel: 100 },
      { product: 'Widget B', inStock: 50, reorderLevel: 100 },
      { product: 'Gadget X', inStock: 1000, reorderLevel: 200 },
      { product: 'Gadget Y', inStock: 10, reorderLevel: 50 },
      { product: 'Gizmo Z', inStock: 750, reorderLevel: 150 },
    ],
  };
}

export function fetchCustomerData(): CustomerData {
  return {
    totalCustomers: 1250,
    activeCustomers: 890,
    topCustomers: [
      { name: 'Acme Corp', spend: 15000 },
      { name: 'Globex Inc', spend: 12000 },
      { name: 'Initech', spend: 8500 },
    ],
  };
}
