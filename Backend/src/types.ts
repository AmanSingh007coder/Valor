// Supplier Classification
export interface Supplier {
  id: string;
  name: string;
  base_price: number;
  current_price: number;
  lat: number;
  lng: number;
  status: SupplierStatus;
  status_detail?: string;
  tier?: "primary" | "secondary" | "tertiary";
  internet_news: string;
  gps_status: string;
  satellite_view: string;
  compliance_score?: number;
  risk_level?: "LOW" | "MEDIUM" | "HIGH";
}

export type SupplierStatus = 
  | "OPERATIONAL" 
  | "DISRUPTED" 
  | "CHILD_LABOR_RISK" 
  | "PRICE_GOUGING" 
  | "WEATHER_RISK" 
  | "COMPLIANCE_VIOLATION"
  | "BLOCKED"
  | "WARNING_ISSUED"
  | "CRITICAL_RISK"
  | "UNRECOVERABLE";

// Supplier Hierarchy
export interface SupplierHierarchy {
  primary: string;
  primaryName: string;
  secondary?: string;
  secondaryName?: string;
  tertiary?: string;
  tertiaryName?: string;
}

// Compliance Rules
export interface ComplianceRule {
  raw: string;
  priceThreshold: number;
  blockedTerms: string[];
  requiresCertification: boolean;
}

// World State
export interface WorldState {
  company_rules: string;
  compliance_rules: ComplianceRule;
  hq: { lat: number; lng: number };
  hierarchy: SupplierHierarchy;
  suppliers: Supplier[];
  active_node?: string;
  current_path?: string[];
  disruption_history?: DisruptionEvent[];
}

// Disruption Event
export interface DisruptionEvent {
  timestamp: string;
  supplierId: string;
  supplierName: string;
  reason: string;
  previousActive?: string;
  newActive: string;
  riskLevel: string;
}

// LangGraph State
export interface ValorGraphState {
  supplierId: string;
  newsIntel: any;
  financeIntel: any;
  complianceIntel: any;
  votes: Array<{ agent: string; vote: string; weight: number }>;
  simulations: any[];
  riskLevel: "HIGH" | "LOW";
  reasoning: string;
  complianceScore?: number;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface OnboardingRequest {
  suppliers: Supplier[];
  hqLocation: { lat: number; lng: number };
  hierarchy: SupplierHierarchy;
  rules: string;
  complianceRules: ComplianceRule;
}
