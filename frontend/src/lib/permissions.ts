/**
 * Centralised permission constants — mirrors backend core/permissions.py.
 *
 * For the framework starter kit, only generic CRUD permissions are included.
 * Add your app-specific permission modules here as you build on the framework.
 */
export const P = {
  USERS: {
    VIEW: 'users.view',
    CREATE: 'users.create',
    EDIT: 'users.edit',
    DELETE: 'users.delete',
  },
  TASKS: {
    VIEW: 'tasks.view',
    CREATE: 'tasks.create',
    EDIT: 'tasks.edit',
    DELETE: 'tasks.delete',
  },
} as const;

/** Flat union type of all permission codes */
type DeepValues<T> = T extends object ? DeepValues<T[keyof T]> : T;
export type PermissionCode = DeepValues<typeof P>;
