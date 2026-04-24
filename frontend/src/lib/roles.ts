/** Rol legacy de framework + super_admin: acceso a /admin/* (backoffice). */
const BACKOFFICE_ROLES = new Set<string>(['admin', 'super_admin']);

export function isBackofficeUser(role: string | null | undefined): boolean {
  return role != null && BACKOFFICE_ROLES.has(role);
}
