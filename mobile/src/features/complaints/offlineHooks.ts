import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import * as FileSystem from 'expo-file-system';
import { apiClient } from '../../api';
import {
  saveDraft,
  getDrafts,
  deleteDraft,
  cacheComplaintsList,
  getCachedComplaintsList,
  DraftReport,
} from '../../utils/storage';
import { queryKeys } from '../../api/queryKeys';

export function useNetworkState() {
  const queryClient = useQueryClient();
  const unsubscribeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    unsubscribeRef.current = NetInfo.addEventListener((state) => {
      if (state.isConnected && state.isInternetReachable) {
        queryClient.invalidateQueries();
        retryPendingDrafts();
      }
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['networkState'],
    queryFn: async () => {
      const state = await NetInfo.fetch();
      return {
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable ?? false,
      };
    },
    refetchInterval: 5000,
  });
}

export function useDrafts() {
  const query = useQuery({
    queryKey: ['drafts'],
    queryFn: getDrafts,
    refetchInterval: 3000,
  });

  const deleteMutation = useDeleteDraft();

  const retryDraft = async (draft: DraftReport) => {
    try {
      await submitDraft(draft);
      query.refetch();
      return true;
    } catch {
      return false;
    }
  };

  return {
    ...query,
    drafts: query.data || [],
    retryDraft,
    deleteDraft: (id: string) => deleteMutation.mutateAsync(id),
    isRetrying: false,
    refreshDrafts: () => query.refetch(),
  };
}

export function useSaveDraft() {
  return useMutation({
    mutationFn: saveDraft,
  });
}

export function useDeleteDraft() {
  return useMutation({
    mutationFn: deleteDraft,
  });
}

export function useMyIssuesWithCache(page: number, status?: string) {
  const { data: networkData } = useNetworkState();

  return useQuery({
    queryKey: queryKeys.issues.myIssuesPage(page, status),
    queryFn: async () => {
      try {
        const { data } = await apiClient.get('/issues/myIssues', {
          params: { page, status },
        });
        await cacheComplaintsList(data);
        return data;
      } catch (err) {
        if (!networkData?.isConnected) {
          const cached = await getCachedComplaintsList();
          if (cached) return cached;
        }
        throw err;
      }
    },
    enabled: networkData?.isConnected !== false || page === 1,
  });
}

async function retryPendingDrafts() {
  try {
    const drafts = await getDrafts();
    const pendingDrafts = drafts.filter((d) => d.error);

    for (const draft of pendingDrafts) {
      try {
        await submitDraft(draft);
      } catch (err) {
        console.error(`Failed to retry draft ${draft.id}:`, err);
      }
    }
  } catch (err) {
    console.error('Failed to retry drafts:', err);
  }
}

export async function submitDraft(draft: any) {
  const formData = new FormData();
  formData.append('category', draft.category);
  formData.append('description', draft.description);
  formData.append('latitude', draft.latitude.toString());
  formData.append('longitude', draft.longitude.toString());
  formData.append('address', draft.address || '');
  formData.append('clientId', draft.clientId);

  if (draft.imageFileName) {
    const imagePath = draft.imageFileName.startsWith('file://')
      ? draft.imageFileName
      : `${FileSystem.documentDirectory}${draft.imageFileName}`;
    const filename = draft.imageFileName.split('/').pop() || 'photo.jpg';
    formData.append('image', {
      uri: imagePath,
      name: filename,
      type: 'image/jpeg',
    } as any);
  }

  const response = await apiClient.post('/issues/create', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    transformRequest: (data) => data,
  });

  await deleteDraft(draft.id);
  return response.data;
}
