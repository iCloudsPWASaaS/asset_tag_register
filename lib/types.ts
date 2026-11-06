export type AssetStatus = "active" | "archived" | "removed";

export type Premises = {
  id: string;
  name: string;
  addressLine1: string;
  addressLine2: string;
  addressLine3: string;
  postcode: string;
  placeId?: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type AssetSummary = {
  id: string;
  tag: string;
  premisesId: string;
  premisesName: string;
  location: string;
  type: string;
  make: string;
  model: string;
  serialNumber: string;
  status: AssetStatus;
  photoPath: string;
  createdAt: string;
  updatedAt: string;
  manualStatus: ManualResult["status"] | "none";
};

export type ManualSource = {
  title: string;
  url: string;
};

export type ManualResult = {
  status: "ai" | "search" | "found" | "none";
  summary: string;
  safety: string[];
  maintenance: string[];
  specs: string[];
  sources: ManualSource[];
  model?: string;
  generatedAt: string;
  provider?: string;
};

export type Asset = {
  id: string;
  userId: string;
  tag: string;
  premisesId: string;
  premisesName: string;
  premisesAddress: string;
  location: string;
  type: string;
  make: string;
  model: string;
  serialNumber: string;
  status: AssetStatus;
  photoPath: string;
  photoContentType: string;
  notes: string;
  engineer: string;
  installedAt: string;
  manual: ManualResult | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  aiExtracted: boolean;
};

export type UserIndex = {
  version: 1;
  userId: string;
  nextTagNumber: number;
  assets: AssetSummary[];
  premises: Premises[];
  updatedAt: string;
};

export type AssetInput = {
  premisesId?: string;
  premisesName: string;
  premisesAddress?: string;
  location: string;
  type: string;
  make: string;
  model: string;
  serialNumber: string;
  notes?: string;
  engineer?: string;
  installedAt?: string;
  photoPath?: string;
  photoContentType?: string;
  status?: AssetStatus;
  aiExtracted?: boolean;
};

export type PremisesInput = {
  name: string;
  addressLine1?: string;
  addressLine2?: string;
  addressLine3?: string;
  postcode?: string;
  placeId?: string;
  notes?: string;
};

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  company_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  gas_safe_id: string | null;
  role: string | null;
  created_at: string;
  updated_at: string;
};

export type Subscription = {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  billing_interval: string | null;
  trial_start: string | null;
  trial_end: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  created_at: string;
  updated_at: string;
};

export type AccessState = {
  allowed: boolean;
  reason: "dev" | "active" | "trialing" | "trial" | "expired" | "none";
  planId: string;
  status: string;
  endsAt: string | null;
  daysLeft: number;
};

export type AccountContext = {
  profile: Profile | null;
  subscription: Subscription | null;
  access: AccessState;
};

export type ExtractedFields = {
  premisesName?: string;
  location?: string;
  type?: string;
  make?: string;
  model?: string;
  serialNumber?: string;
  confidence?: number;
};

export type ManualInput = {
  make: string;
  model: string;
  type: string;
  serialNumber?: string;
};
