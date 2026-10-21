export type IssueCategory =
  | 'road_damage'
  | 'garbage'
  | 'streetlight'
  | 'water'
  | 'drainage';

export type IssueStatus =
  | 'Submitted'
  | 'Under Review'
  | 'Assigned'
  | 'In Progress'
  | 'Resolved'
  | 'Rejected';

export type IssuePriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface CategoryItem {
  value: IssueCategory;
  label: string;
  icon: string;
  description: string;
}

export interface StatusItem {
  value: IssueStatus;
  label: string;
  colour: string;
  backgroundColour: string;
}

export interface PriorityItem {
  value: IssuePriority;
  label: string;
  colour: string;
  backgroundColour: string;
}

export const CATEGORIES: CategoryItem[] = [
  {
    value: 'road_damage',
    label: 'Road Damage',
    icon: 'hammer',
    description: 'Potholes, cracks, broken pavers, or cave-ins',
  },
  {
    value: 'garbage',
    label: 'Garbage & Waste',
    icon: 'trash',
    description: 'Overflowing dumpsters, illegal dumping, uncollected litter',
  },
  {
    value: 'streetlight',
    label: 'Street Lighting',
    icon: 'bulb',
    description: 'Non-functional streetlights, flickering lamps, exposed wires',
  },
  {
    value: 'water',
    label: 'Water Supply',
    icon: 'water',
    description: 'Broken mains, low pressure, water contamination, leakages',
  },
  {
    value: 'drainage',
    label: 'Drainage & Sewage',
    icon: 'rainy',
    description: 'Clogged storm drains, sewage overflows, open manholes',
  },
];

export const STATUSES: Record<IssueStatus, StatusItem> = {
  Submitted: {
    value: 'Submitted',
    label: 'Submitted',
    colour: '#2563EB',
    backgroundColour: '#DBEAFE',
  },
  'Under Review': {
    value: 'Under Review',
    label: 'Under Review',
    colour: '#7C3AED',
    backgroundColour: '#EDE9FE',
  },
  Assigned: {
    value: 'Assigned',
    label: 'Assigned',
    colour: '#D97706',
    backgroundColour: '#FEF3C7',
  },
  'In Progress': {
    value: 'In Progress',
    label: 'In Progress',
    colour: '#0284C7',
    backgroundColour: '#E0F2FE',
  },
  Resolved: {
    value: 'Resolved',
    label: 'Resolved',
    colour: '#059669',
    backgroundColour: '#D1FAE5',
  },
  Rejected: {
    value: 'Rejected',
    label: 'Rejected',
    colour: '#DC2626',
    backgroundColour: '#FEE2E2',
  },
};

export const PRIORITIES: Record<IssuePriority, PriorityItem> = {
  Low: {
    value: 'Low',
    label: 'Low',
    colour: '#059669',
    backgroundColour: '#D1FAE5',
  },
  Medium: {
    value: 'Medium',
    label: 'Medium',
    colour: '#D97706',
    backgroundColour: '#FEF3C7',
  },
  High: {
    value: 'High',
    label: 'High',
    colour: '#EA580C',
    backgroundColour: '#FFEDD5',
  },
  Critical: {
    value: 'Critical',
    label: 'Critical',
    colour: '#DC2626',
    backgroundColour: '#FEE2E2',
  },
};

export function getCategoryMeta(category: string): CategoryItem {
  const item = CATEGORIES.find((c) => c.value === category);
  if (item) return item;
  return {
    value: 'road_damage',
    label: category,
    icon: 'alert-circle',
    description: '',
  };
}

export function getStatusMeta(status: string): StatusItem {
  const item = STATUSES[status as IssueStatus];
  if (item) return item;
  return {
    value: 'Submitted',
    label: status,
    colour: '#64748B',
    backgroundColour: '#F1F5F9',
  };
}

export function getPriorityMeta(priority: string): PriorityItem {
  const item = PRIORITIES[priority as IssuePriority];
  if (item) return item;
  return {
    value: 'Low',
    label: priority || 'Low',
    colour: '#64748B',
    backgroundColour: '#F1F5F9',
  };
}
