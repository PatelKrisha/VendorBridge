export type UserRole = 'ADMIN' | 'OFFICER' | 'APPROVER' | 'FINANCE' | 'VENDOR';

export type ERPAction =
  | 'CREATE_RFQ'
  | 'INVITE_VENDORS'
  | 'SUBMIT_QUOTATION'
  | 'COMPARE_QUOTATIONS'
  | 'INITIATE_APPROVAL'
  | 'APPROVE_REJECT_PO'
  | 'GENERATE_PO'
  | 'CREATE_GRN'
  | 'GENERATE_INVOICE'
  | 'MARK_INVOICE_PAID'
  | 'RECORD_PARTIAL_PAYMENT'
  | 'VIEW_INVOICES'
  | 'MANAGE_VENDORS'
  | 'VIEW_AUDIT_LOGS'
  | 'EXPORT_REPORTS'
  | 'MANAGE_USERS'
  | 'SYSTEM_CONFIG';

const PERMISSIONS: Record<UserRole, Set<ERPAction>> = {
  ADMIN: new Set<ERPAction>([
    'CREATE_RFQ',
    'INVITE_VENDORS',
    'COMPARE_QUOTATIONS',
    'INITIATE_APPROVAL',
    'APPROVE_REJECT_PO',
    'GENERATE_PO',
    'CREATE_GRN',
    'GENERATE_INVOICE',
    'MARK_INVOICE_PAID',
    'RECORD_PARTIAL_PAYMENT',
    'VIEW_INVOICES',
    'MANAGE_VENDORS',
    'VIEW_AUDIT_LOGS',
    'EXPORT_REPORTS',
    'MANAGE_USERS',
    'SYSTEM_CONFIG',
  ]),
  OFFICER: new Set<ERPAction>([
    'CREATE_RFQ',
    'INVITE_VENDORS',
    'COMPARE_QUOTATIONS',
    'INITIATE_APPROVAL',
    'GENERATE_PO',
    'CREATE_GRN',
    'GENERATE_INVOICE',
    'VIEW_INVOICES',
    'MANAGE_VENDORS', // Create only is enforced at endpoint logic
    'EXPORT_REPORTS',
  ]),
  APPROVER: new Set<ERPAction>([
    'COMPARE_QUOTATIONS', // View only is checked in UI/API reads
    'APPROVE_REJECT_PO',
    'VIEW_INVOICES',
    'EXPORT_REPORTS',
  ]),
  FINANCE: new Set<ERPAction>([
    'MARK_INVOICE_PAID',
    'RECORD_PARTIAL_PAYMENT',
    'VIEW_INVOICES',
    'EXPORT_REPORTS',
  ]),
  VENDOR: new Set<ERPAction>([
    'SUBMIT_QUOTATION',
    'VIEW_INVOICES', // Own invoices only (enforced in Row-Level Security/Filter)
  ]),
};

/**
 * Check if a role is authorized to perform a given action
 */
export function hasPermission(role: UserRole, action: ERPAction): boolean {
  const rolePermissions = PERMISSIONS[role];
  if (!rolePermissions) return false;
  return rolePermissions.has(action);
}
