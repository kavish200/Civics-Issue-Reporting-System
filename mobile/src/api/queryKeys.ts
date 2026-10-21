export const queryKeys = {
  issues: {
    all: ['issues'] as const,
    myIssues: () => [...queryKeys.issues.all, 'myIssues'] as const,
    myIssuesPage: (page: number, status?: string) =>
      [...queryKeys.issues.myIssues(), { page, status }] as const,
    detail: (id: string) => [...queryKeys.issues.all, 'detail', id] as const,
    nearby: () => [...queryKeys.issues.all, 'nearby'] as const,
    assigned: () => [...queryKeys.issues.all, 'assigned'] as const,
    assignedFiltered: (status?: string) =>
      [...queryKeys.issues.assigned(), { status }] as const,
  },
  notifications: {
    all: ['notifications'] as const,
    list: (unread?: boolean) => [...queryKeys.notifications.all, { unread }] as const,
    detail: (id: string) => [...queryKeys.notifications.all, 'detail', id] as const,
  },
};
