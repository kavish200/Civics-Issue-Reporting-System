import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api';
import { queryKeys } from '../../api/queryKeys';

export function useAssignedIssues(status?: string) {
  return useQuery({
    queryKey: queryKeys.issues.assignedFiltered(status),
    queryFn: async () => {
      const params = status ? { status } : {};
      const { data } = await apiClient.get('/issues/assigned', { params });
      return data;
    },
  });
}

export function useUpdateProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      remark,
      image,
    }: {
      id: string;
      status: 'In Progress' | 'Resolved';
      remark: string;
      image?: { uri: string; type: string; name: string };
    }) => {
      const formData = new FormData();
      formData.append('status', status);
      formData.append('remark', remark);
      if (image) {
        formData.append('image', {
          uri: image.uri,
          type: image.type,
          name: image.name,
        } as any);
      }

      const { data } = await apiClient.patch(
        `/issues/progress/${id}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.all });
    },
  });
}

