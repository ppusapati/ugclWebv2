// Third-party integration types

export type IntegrationStatus = 'active' | 'inactive' | 'suspended';

export type DataScope =
  | 'partner.dprsite.read'
  | 'partner.wrapping.read'
  | 'partner.eway.read'
  | 'partner.water.read'
  | 'partner.stock.read'
  | 'partner.dairysite.read'
  | 'partner.payment.read'
  | 'partner.material.read'
  | 'partner.mnr.read'
  | 'partner.nmr_vehicle.read'
  | 'partner.contractor.read'
  | 'partner.painting.read'
  | 'partner.diesel.read'
  | 'partner.tasks.read'
  | 'partner.vehiclelog.read'
  | 'integration.dropdown.proxy'
  | 'integration.document.ai.use';

export const DATA_SCOPE_LABELS: Record<DataScope, string> = {
  'partner.dprsite.read': 'DPR Site Reports',
  'partner.wrapping.read': 'Wrapping Reports',
  'partner.eway.read': 'E-Way Reports',
  'partner.water.read': 'Water Tanker Reports',
  'partner.stock.read': 'Stock Reports',
  'partner.dairysite.read': 'Dairy Site Reports',
  'partner.payment.read': 'Payment Reports',
  'partner.material.read': 'Material Reports',
  'partner.mnr.read': 'MNR Reports',
  'partner.nmr_vehicle.read': 'NMR Vehicle Reports',
  'partner.contractor.read': 'Contractor Reports',
  'partner.painting.read': 'Painting Reports',
  'partner.diesel.read': 'Diesel Reports',
  'partner.tasks.read': 'Task Reports',
  'partner.vehiclelog.read': 'Vehicle Log Reports',
  'integration.dropdown.proxy': 'External Dropdown Proxy Access',
  'integration.document.ai.use': 'Document AI Processing',
};

export const ALL_DATA_SCOPES: DataScope[] = Object.keys(DATA_SCOPE_LABELS) as DataScope[];

export interface ThirdPartyIntegration {
  id: string;
  name: string;
  description?: string;
  status: IntegrationStatus;
  provider?: string;
  endpoint_url?: string;
  model?: string;
  auth_header?: string;
  auth_scheme?: string;
  has_secret?: boolean;
  api_key_prefix?: string;
  api_key?: string; // returned once on creation, masked afterwards
  allowed_urls: string[];
  allowed_ips: string[];
  data_scopes: DataScope[];
  contact_email?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  last_accessed_at?: string;
  access_count?: number;
}

export interface CreateIntegrationRequest {
  name: string;
  description?: string;
  provider?: string;
  endpoint_url?: string;
  model?: string;
  auth_header?: string;
  auth_scheme?: string;
  secret?: string;
  allowed_urls: string[];
  allowed_ips: string[];
  data_scopes: DataScope[];
  contact_email?: string;
}

export interface UpdateIntegrationRequest extends Partial<CreateIntegrationRequest> {
  status?: IntegrationStatus;
}

export interface IntegrationListResponse {
  integrations: ThirdPartyIntegration[];
  total: number;
}

export interface RegenerateKeyResponse {
  api_key: string;
}
