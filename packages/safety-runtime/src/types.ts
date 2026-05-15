export type SafetyMode = "adult" | "minor" | "strict" | "custom";

export type IdentityRole =
  | "companion"
  | "study_partner"
  | "productivity_assistant"
  | "fictional_character"
  | "coach"
  | "professional_role_limited"
  | "forbidden_identity";

export type PermissionName =
  | "memory_read"
  | "memory_write"
  | "memory_export"
  | "memory_delete"
  | "knowledge_read"
  | "model_provider_edit"
  | "network_request"
  | "file_read"
  | "file_write"
  | "shell_execute"
  | "desktop_control";

export interface ContentFilters {
  sexual: boolean;
  pornographic: boolean;
  eroticRoleplay: boolean;
  graphicViolence: boolean;
  gore: boolean;
  adultRomanticEscalation: boolean;
  manipulativeDependency: boolean;
}

export interface IdentityPolicy {
  role: IdentityRole;
  allowedClaims: string[];
  disallowedClaims: string[];
  professionalDisclaimerRequired: boolean;
  toolPermissions: PermissionName[];
  boundaries: string[];
}

export interface SafetyProfile {
  mode: SafetyMode;
  contentFilters: ContentFilters;
  identityPolicy: IdentityPolicy;
  permissions: Record<PermissionName, boolean>;
  blockedTopics: string[];
  escalationRules: string[];
}

export interface SafetyResult {
  allowed: boolean;
  mode: SafetyMode;
  blocked: boolean;
  reasons: string[];
  safeRedirect?: string;
  forcedPersonaCoreIds: string[];
  auditTags: string[];
}

export interface SafetyAuditEntry {
  id: string;
  timestamp: string;
  action: string;
  mode: SafetyMode;
  allowed: boolean;
  reasons: string[];
}
