import { useQuery, useMutation, useInfiniteQuery } from '@tanstack/react-query';
import { getMyIssuesApi, getIssueByIdApi, confirmIssueApi, createIssueApi } from './api';
import { CreateIssueInput } from './types';
import { queryKeys } from '../../api/queryKeys';
import { useAppState } from '../../hooks/useAppState';

export function useMyIssues(page: number, status?: string) {
  return useQuery({
    queryKey: queryKeys.issues.myIssuesPage(page, status),
    queryFn: () => getMyIssuesApi(page, 20, status),
  });
}

export function useMyIssuesInfinite(status?: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.issues.myIssues(),
    queryFn: ({ pageParam = 1 }) => getMyIssuesApi(pageParam, 20, status),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  });
}

export function useIssueDetail(id: string) {
  const appState = useAppState();

  const query = useQuery({
    queryKey: queryKeys.issues.detail(id),
    queryFn: () => getIssueByIdApi(id),
    refetchInterval: appState === 'active' ? 20000 : false,
  });

  return query;
}

export function useCreateIssue() {
  return useMutation({
    mutationFn: (input: CreateIssueInput) => createIssueApi(input),
  });
}

export function useConfirmIssue() {
  return useMutation({
    mutationFn: ({
      id,
      confirmed,
      rating,
      feedback,
    }: {
      id: string;
      confirmed: boolean;
      rating?: number;
      feedback?: string;
    }) => confirmIssueApi(id, confirmed, rating, feedback),
  });
}

export { useDrafts } from './offlineHooks';
