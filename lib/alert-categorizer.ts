export type AlertType = 
  | 'DEPLETION'
  | 'MAINTENANCE'
  | 'URGENT_NEED'
  | 'EQUIPMENT_BREAKDOWN'
  | 'FACILITY_ISSUE'
  | 'INVENTORY_CHANGE'
  | 'RESOURCE_MOVEMENT'
  | 'BOOK_LENDING';

export type UrgencyLevel = 'URGENT' | 'SERIOUS' | 'DAY_TO_DAY';

export function categorizeUrgency(alertType: AlertType, message?: string): UrgencyLevel {
  // Urgent - equipment breakdowns and urgent needs (RED)
  if (alertType === 'EQUIPMENT_BREAKDOWN' || alertType === 'URGENT_NEED') {
    return 'URGENT';
  }
  
  // Serious - maintenance, facility issues, and depletion
  if (alertType === 'MAINTENANCE' || alertType === 'FACILITY_ISSUE' || alertType === 'DEPLETION') {
    return 'SERIOUS';
  }
  
  // Day-to-day - routine operations
  if (alertType === 'INVENTORY_CHANGE' || alertType === 'RESOURCE_MOVEMENT' || alertType === 'BOOK_LENDING') {
    return 'DAY_TO_DAY';
  }
  
  // Default to serious
  return 'SERIOUS';
}

export function getUrgencyLabel(urgency: UrgencyLevel | string): string {
  const urgencyStr = urgency.toUpperCase();
  if (urgencyStr === 'URGENT') return 'Urgent';
  if (urgencyStr === 'SERIOUS') return 'Serious';
  if (urgencyStr === 'DAY_TO_DAY' || urgencyStr === 'DAY-TO-DAY') return 'Day-to-Day';
  
  // Legacy support
  if (urgencyStr === 'CRITICAL') return 'Urgent';
  if (urgencyStr === 'HIGH' || urgencyStr === 'MEDIUM') return 'Serious';
  if (urgencyStr === 'LOW') return 'Day-to-Day';
  
  return 'Serious';
}

export function getUrgencyGroup(urgency: UrgencyLevel | string): 'urgent' | 'serious' | 'day-to-day' {
  const urgencyStr = urgency.toUpperCase();
  if (urgencyStr === 'URGENT' || urgencyStr === 'CRITICAL') return 'urgent';
  if (urgencyStr === 'SERIOUS' || urgencyStr === 'HIGH' || urgencyStr === 'MEDIUM') return 'serious';
  if (urgencyStr === 'DAY_TO_DAY' || urgencyStr === 'DAY-TO-DAY' || urgencyStr === 'LOW') return 'day-to-day';
  return 'serious';
}

