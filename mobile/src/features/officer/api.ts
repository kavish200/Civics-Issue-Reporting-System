import { apiClient } from '../../api';
import { Issue } from '../complaints/types';

export interface UpdateProgressInput {
  id: string;
  status: 'In Progress' | 'Resolved';
  remark?: string;
  imageUri?: string;
}

export async function getAssignedIssuesApi(status?: string): Promise<Issue[]> {
  const params: Record<string, string> = {};
  if (status && status !== 'ALL') {
    params.status = status;
  }
  const response = await apiClient.get<{ issues: Issue[] }>(
    '/issues/assigned',
    { params },
  );
  return response.data.issues;
}

export async function updateProgressApi(
  input: UpdateProgressInput,
): Promise<Issue> {
  const formData = new FormData();
  formData.append('status', input.status);
  if (input.remark) {
    formData.append('remark', input.remark);
  }

  if (input.imageUri) {
    const filename = input.imageUri.split('/').pop() || 'progress.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('image', {
      uri: input.imageUri,
      name: filename,
      type,
    } as unknown as Blob);
  }

  const response = await apiClient.patch<{ issue: Issue }>(
    `/issues/progress/${input.id}`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  );
  return response.data.issue;
}
