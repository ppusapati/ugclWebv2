// src/config/report-types.ts
import type { ReportKey } from '~/services';

export interface ReportFieldConfig {
  name: string;
  type: 'text' | 'email' | 'number' | 'tel' | 'date' | 'datetime' | 'time' | 'textarea' | 'select' | 'checkbox' | 'radio' | 'file' | 'file-multiple';
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: Array<{ value: string; label: string }> | string[];
  rows?: number;
  min?: number;
  max?: number;
  accept?: string;
}

export interface ReportConfig {
  displayName: string;
  icon: string;
  description: string;
  fields: ReportFieldConfig[];
}

export const REPORT_CONFIGS: Record<ReportKey, ReportConfig> = {
  dprsite: {
    displayName: 'DPR Site Reports',
    icon: '📋',
    description: 'Daily Progress Reports for construction sites',
    fields: [
      { name: 'date', type: 'date', label: 'Date', required: true },
      { name: 'shift', type: 'select', label: 'Shift', options: ['Morning', 'Evening', 'Night'] },
      { name: 'supervisor', type: 'text', label: 'Supervisor Name' },
      { name: 'workers_count', type: 'number', label: 'Workers Count', min: 0 },
      { name: 'work_description', type: 'textarea', label: 'Work Description', rows: 4 },
      { name: 'photos', type: 'file-multiple', label: 'Photos', accept: 'image/*' },
      { name: 'remarks', type: 'textarea', label: 'Remarks', rows: 3 },
    ],
  },
  water: {
    displayName: 'Water Tanker Reports',
    icon: '🚚',
    description: 'Water tanker delivery tracking',
    fields: [
      { name: 'date', type: 'date', label: 'Date', required: true },
      { name: 'tanker_number', type: 'text', label: 'Tanker Number', required: true },
      { name: 'capacity', type: 'number', label: 'Capacity (Liters)', required: true, min: 0 },
      { name: 'quantity_delivered', type: 'number', label: 'Quantity Delivered', required: true, min: 0 },
      { name: 'source', type: 'text', label: 'Source Location' },
      { name: 'destination', type: 'text', label: 'Destination' },
      { name: 'driver_name', type: 'text', label: 'Driver Name' },
      { name: 'delivery_time', type: 'time', label: 'Delivery Time' },
    ],
  },
  wrapping: {
    displayName: 'Wrapping Reports',
    icon: '📦',
    description: 'Material wrapping and packaging records',
    fields: [
      { name: 'date', type: 'date', label: 'Date', required: true },
      { name: 'material_type', type: 'text', label: 'Material Type', required: true },
      { name: 'quantity', type: 'number', label: 'Quantity', required: true, min: 0 },
      { name: 'wrapped_by', type: 'text', label: 'Wrapped By' },
      { name: 'quality_check', type: 'select', label: 'Quality Check', options: ['Pass', 'Fail', 'Pending'] },
      { name: 'remarks', type: 'textarea', label: 'Remarks', rows: 3 },
    ],
  },
  eway: {
    displayName: 'E-way Bills',
    icon: '📄',
    description: 'Electronic way bill documentation',
    fields: [
      { name: 'bill_number', type: 'text', label: 'Bill Number', required: true },
      { name: 'date', type: 'date', label: 'Date', required: true },
      { name: 'from_location', type: 'text', label: 'From Location', required: true },
      { name: 'to_location', type: 'text', label: 'To Location', required: true },
      { name: 'vehicle_number', type: 'text', label: 'Vehicle Number', required: true },
      { name: 'material_type', type: 'text', label: 'Material Type', required: true },
      { name: 'quantity', type: 'number', label: 'Quantity', required: true, min: 0 },
      { name: 'value', type: 'number', label: 'Value (₹)', required: true, min: 0 },
      { name: 'document_url', type: 'file', label: 'Upload Document', accept: '.pdf,.jpg,.png' },
    ],
  },
  material: {
    displayName: 'Material Reports',
    icon: '🏗️',
    description: 'Material inventory and usage tracking',
    fields: [
      { name: 'date', type: 'date', label: 'Date', required: true },
      { name: 'material_name', type: 'text', label: 'Material Name', required: true },
      { name: 'material_type', type: 'text', label: 'Material Type', required: true },
      { name: 'quantity', type: 'number', label: 'Quantity', required: true, min: 0 },
      { name: 'unit', type: 'select', label: 'Unit', options: ['Kg', 'Liters', 'Pieces', 'Meters', 'Tons'], required: true },
      { name: 'supplier', type: 'text', label: 'Supplier' },
      { name: 'rate', type: 'number', label: 'Rate per Unit', min: 0 },
      { name: 'total_amount', type: 'number', label: 'Total Amount', min: 0 },
      { name: 'remarks', type: 'textarea', label: 'Remarks', rows: 3 },
    ],
  },
  payment: {
    displayName: 'Payment Records',
    icon: '💰',
    description: 'Payment transactions and records',
    fields: [
      { name: 'date', type: 'date', label: 'Date', required: true },
      { name: 'payment_type', type: 'select', label: 'Payment Type', required: true, options: ['Salary', 'Material', 'Service', 'Other'] },
      { name: 'amount', type: 'number', label: 'Amount (₹)', required: true, min: 0 },
      { name: 'paid_to', type: 'text', label: 'Paid To', required: true },
      { name: 'payment_method', type: 'select', label: 'Payment Method', required: true, options: ['Cash', 'Cheque', 'Bank Transfer', 'UPI'] },
      { name: 'reference_number', type: 'text', label: 'Reference Number' },
      { name: 'description', type: 'textarea', label: 'Description', rows: 3 },
      { name: 'receipt_url', type: 'file', label: 'Upload Receipt', accept: '.pdf,.jpg,.png' },
    ],
  },
  stock: {
    displayName: 'Stock Reports',
    icon: '📊',
    description: 'Stock inventory management',
    fields: [
      { name: 'date', type: 'date', label: 'Date', required: true },
      { name: 'material_name', type: 'text', label: 'Material Name', required: true },
      { name: 'opening_stock', type: 'number', label: 'Opening Stock', required: true, min: 0 },
      { name: 'received', type: 'number', label: 'Received', required: true, min: 0 },
      { name: 'consumed', type: 'number', label: 'Consumed', required: true, min: 0 },
      { name: 'closing_stock', type: 'number', label: 'Closing Stock', required: true, min: 0 },
      { name: 'unit', type: 'select', label: 'Unit', options: ['Kg', 'Liters', 'Pieces', 'Meters', 'Tons'], required: true },
      { name: 'remarks', type: 'textarea', label: 'Remarks', rows: 3 },
    ],
  },
  dairysite: {
    displayName: 'Dairy Site Reports',
    icon: '🥛',
    description: 'Dairy operations and milk collection',
    fields: [
      { name: 'date', type: 'date', label: 'Date', required: true },
      { name: 'milk_collection', type: 'number', label: 'Milk Collection (Liters)', required: true, min: 0 },
      { name: 'temperature', type: 'number', label: 'Temperature (°C)', min: 0, max: 100 },
      { name: 'storage_status', type: 'select', label: 'Storage Status', options: ['Good', 'Fair', 'Poor'] },
      { name: 'remarks', type: 'textarea', label: 'Remarks', rows: 3 },
    ],
  },
  mnr: {
    displayName: 'MNR Reports',
    icon: '📝',
    description: 'MNR operational reports',
    fields: [
      { name: 'date', type: 'date', label: 'Date', required: true },
      { name: 'report_type', type: 'text', label: 'Report Type', required: true },
      { name: 'description', type: 'textarea', label: 'Description', required: true, rows: 4 },
      { name: 'quantity', type: 'number', label: 'Quantity', min: 0 },
      { name: 'value', type: 'number', label: 'Value', min: 0 },
      { name: 'status', type: 'select', label: 'Status', options: ['Pending', 'In Progress', 'Completed'] },
      { name: 'remarks', type: 'textarea', label: 'Remarks', rows: 3 },
    ],
  },
  nmr_vehicle: {
    displayName: 'NMR Vehicle Reports',
    icon: '🚙',
    description: 'NMR vehicle tracking and logs',
    fields: [
      { name: 'date', type: 'date', label: 'Date', required: true },
      { name: 'vehicle_number', type: 'text', label: 'Vehicle Number', required: true },
      { name: 'route', type: 'text', label: 'Route', required: true },
      { name: 'start_km', type: 'number', label: 'Start KM', required: true, min: 0 },
      { name: 'end_km', type: 'number', label: 'End KM', required: true, min: 0 },
      { name: 'distance', type: 'number', label: 'Distance (KM)', required: true, min: 0 },
      { name: 'fuel_consumed', type: 'number', label: 'Fuel Consumed (L)', min: 0 },
      { name: 'driver_name', type: 'text', label: 'Driver Name' },
      { name: 'remarks', type: 'textarea', label: 'Remarks', rows: 3 },
    ],
  },
  contractor: {
    displayName: 'Contractor Reports',
    icon: '👷',
    description: 'Contractor work progress and payments',
    fields: [
      { name: 'date', type: 'date', label: 'Date', required: true },
      { name: 'contractor_name', type: 'text', label: 'Contractor Name', required: true },
      { name: 'work_type', type: 'text', label: 'Work Type', required: true },
      { name: 'work_description', type: 'textarea', label: 'Work Description', required: true, rows: 4 },
      { name: 'workers_deployed', type: 'number', label: 'Workers Deployed', min: 0 },
      { name: 'completion_percentage', type: 'number', label: 'Completion %', min: 0, max: 100 },
      { name: 'amount_paid', type: 'number', label: 'Amount Paid (₹)', min: 0 },
      { name: 'status', type: 'select', label: 'Status', options: ['Not Started', 'In Progress', 'Completed', 'On Hold'] },
      { name: 'remarks', type: 'textarea', label: 'Remarks', rows: 3 },
    ],
  },
  painting: {
    displayName: 'Painting Reports',
    icon: '🎨',
    description: 'Painting work progress tracking',
    fields: [
      { name: 'date', type: 'date', label: 'Date', required: true },
      { name: 'area_painted', type: 'number', label: 'Area Painted (Sq.Ft)', required: true, min: 0 },
      { name: 'paint_type', type: 'text', label: 'Paint Type', required: true },
      { name: 'color', type: 'text', label: 'Color', required: true },
      { name: 'coats_applied', type: 'number', label: 'Coats Applied', required: true, min: 1 },
      { name: 'painter_name', type: 'text', label: 'Painter Name' },
      { name: 'quality_check', type: 'select', label: 'Quality Check', options: ['Pass', 'Fail', 'Pending'] },
      { name: 'remarks', type: 'textarea', label: 'Remarks', rows: 3 },
    ],
  },
  diesel: {
    displayName: 'Diesel Reports',
    icon: '⛽',
    description: 'Diesel consumption and fuel tracking',
    fields: [
      { name: 'date', type: 'date', label: 'Date', required: true },
      { name: 'vehicle_number', type: 'text', label: 'Vehicle Number', required: true },
      { name: 'quantity', type: 'number', label: 'Quantity (Liters)', required: true, min: 0 },
      { name: 'rate', type: 'number', label: 'Rate per Liter (₹)', required: true, min: 0 },
      { name: 'total_amount', type: 'number', label: 'Total Amount (₹)', required: true, min: 0 },
      { name: 'odometer_reading', type: 'number', label: 'Odometer Reading (KM)', min: 0 },
      { name: 'pump_name', type: 'text', label: 'Pump Name' },
      { name: 'bill_number', type: 'text', label: 'Bill Number' },
      { name: 'remarks', type: 'textarea', label: 'Remarks', rows: 3 },
    ],
  },
  tasks: {
    displayName: 'Tasks',
    icon: '✅',
    description: 'Task management and tracking',
    fields: [
      { name: 'title', type: 'text', label: 'Task Title', required: true },
      { name: 'description', type: 'textarea', label: 'Description', required: true, rows: 4 },
      { name: 'assigned_to', type: 'text', label: 'Assigned To' },
      { name: 'priority', type: 'select', label: 'Priority', required: true, options: ['Low', 'Medium', 'High', 'Critical'] },
      { name: 'status', type: 'select', label: 'Status', required: true, options: ['Pending', 'In Progress', 'Completed', 'Cancelled'] },
      { name: 'due_date', type: 'date', label: 'Due Date' },
      { name: 'completed_at', type: 'datetime', label: 'Completed At' },
      { name: 'attachments', type: 'file-multiple', label: 'Attachments' },
    ],
  },
  vehiclelog: {
    displayName: 'Vehicle Logs',
    icon: '🚗',
    description: 'Vehicle usage and maintenance logs',
    fields: [
      { name: 'date', type: 'date', label: 'Date', required: true },
      { name: 'vehicle_number', type: 'text', label: 'Vehicle Number', required: true },
      { name: 'driver_name', type: 'text', label: 'Driver Name', required: true },
      { name: 'start_time', type: 'time', label: 'Start Time', required: true },
      { name: 'end_time', type: 'time', label: 'End Time', required: true },
      { name: 'start_km', type: 'number', label: 'Start KM', required: true, min: 0 },
      { name: 'end_km', type: 'number', label: 'End KM', required: true, min: 0 },
      { name: 'purpose', type: 'text', label: 'Purpose', required: true },
      { name: 'fuel_consumed', type: 'number', label: 'Fuel Consumed (L)', min: 0 },
      { name: 'remarks', type: 'textarea', label: 'Remarks', rows: 3 },
    ],
  },
};

export function getReportConfig(reportType: ReportKey): ReportConfig {
  return REPORT_CONFIGS[reportType];
}

export function getAllReportTypes(): Array<{ key: ReportKey; config: ReportConfig }> {
  return Object.entries(REPORT_CONFIGS).map(([key, config]) => ({
    key: key as ReportKey,
    config,
  }));
}
