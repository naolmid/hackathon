export type UserRole = 
  | 'universityadmin'
  | 'campusadmin'
  | 'librarian'
  | 'printpersonnel'
  | 'financestaff'
  | 'labmanager'
  | 'itstaff'
  | 'facilities'
  | 'security'
  | 'investigator'
  | 'maintenancestaff'
  | 'cafeteria';

export const STAFF_ROLES: UserRole[] = [
  'librarian',
  'printpersonnel',
  'financestaff',
  'labmanager',
  'itstaff',
  'facilities',
  'security',
  'investigator',
  'maintenancestaff',
  'cafeteria',
];

export const ADMIN_ROLES: UserRole[] = [
  'universityadmin',
  'campusadmin',
];

export function getUserRole(): UserRole | null {
  if (typeof window === 'undefined') return null;
  const userData = localStorage.getItem('user');
  if (!userData) return null;
  try {
    const user = JSON.parse(userData);
    return (user.role?.toLowerCase() || user.username?.toLowerCase()) as UserRole;
  } catch {
    return null;
  }
}

export function isAdmin(role?: UserRole): boolean {
  const userRole = role || getUserRole();
  if (!userRole) return false;
  return ADMIN_ROLES.includes(userRole as UserRole);
}

export function isStaff(role?: UserRole): boolean {
  const userRole = role || getUserRole();
  if (!userRole) return false;
  return STAFF_ROLES.includes(userRole as UserRole);
}

export function getRoleDashboardPath(role?: UserRole): string {
  const userRole = role || getUserRole();
  if (!userRole) return '/dashboard';
  
  if (isAdmin(userRole)) {
    return '/dashboard/admin';
  }
  
  // Map staff roles to their specific dashboards
  const roleMap: Record<string, string> = {
    'itstaff': '/dashboard/it-staff',
    'librarian': '/dashboard/librarian',
    'labmanager': '/dashboard/lab-manager',
    'cafeteria': '/dashboard/cafeteria',
    'printpersonnel': '/dashboard/print-personnel',
    'facilities': '/dashboard/cafeteria', // Facilities can use cafeteria dashboard
    'maintenancestaff': '/dashboard/maintenance',
    'maintenance_staff': '/dashboard/maintenance',
  };
  
  return roleMap[userRole] || '/dashboard';
}

export function canAccessFeature(feature: string, role?: UserRole): boolean {
  const userRole = role || getUserRole();
  if (!userRole) return false;
  
  if (isAdmin(userRole)) {
    return true; // Admins can access everything
  }
  
  // Staff-specific feature access
  const featureAccess: Record<string, UserRole[]> = {
    'submit-movement': ['itstaff'],
    'submit-equipment-issue': ['itstaff', 'labmanager', 'facilities'],
    'submit-inventory-change': ['itstaff', 'labmanager', 'cafeteria'],
    'track-book-lending': ['librarian'],
    'report-book-issue': ['librarian'],
    'submit-usage-data': ['labmanager', 'printpersonnel', 'cafeteria'],
    'report-depletion': ['printpersonnel'],
    'report-inventory': ['cafeteria'],
    'report-equipment-breakdown': ['cafeteria', 'facilities'],
  };
  
  const allowedRoles = featureAccess[feature] || [];
  return allowedRoles.includes(userRole as UserRole);
}

