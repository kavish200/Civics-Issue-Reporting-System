import { apiClient } from '../../api';
import { CreateIssueInput, Issue } from './types';

export interface CreateIssueResponse {
  message: string;
  issue: Issue;
  duplicateCandidate: boolean;
}

export interface MyIssuesResponse {
  issues: Issue[];
  page: number;
  totalPages: number;
  count: number;
}

export async function createIssueApi(
  input: CreateIssueInput,
): Promise<CreateIssueResponse> {
  const formData = new FormData();
  formData.append('category', input.category);
  formData.append('description', input.description);
  formData.append('latitude', String(input.latitude));
  formData.append('longitude', String(input.longitude));

  if (input.address) {
    formData.append('address', input.address);
  }
  if (input.clientId) {
    formData.append('clientId', input.clientId);
  }

  if (input.imageUri) {
    const filename = input.imageUri.split('/').pop() || 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('image', {
      uri: input.imageUri,
      name: filename,
      type,
    } as unknown as Blob);
  }

  const response = await apiClient.post<CreateIssueResponse>(
    '/issues/create',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      transformRequest: (data) => data,
    },
  );
  return response.data;
}

export async function getMyIssuesApi(
  page: number = 1,
  limit: number = 20,
  status?: string,
): Promise<MyIssuesResponse> {
  const params: Record<string, string | number> = { page, limit };
  if (status && status !== 'ALL') {
    params.status = status;
  }
  const response = await apiClient.get<any>('/issues/myIssues', {
    params,
  });
  const data = response.data;
  const issues = Array.isArray(data?.issues) ? data.issues : Array.isArray(data) ? data : [];
  return {
    issues,
    page: data?.page ?? page,
    totalPages: data?.totalPages ?? 1,
    count: data?.count ?? issues.length,
  };
}

export async function getIssueByIdApi(id: string): Promise<Issue> {
  const response = await apiClient.get<{ issue: Issue }>(`/issues/getIssue/${id}`);
  return response.data.issue;
}

export async function getNearbyIssuesApi(
  lat: number,
  lng: number,
  radius: number = 1000,
  category?: string,
): Promise<Issue[]> {
  const params: Record<string, string | number> = { lat, lng, radius };
  if (category && category !== 'ALL') {
    params.category = category;
  }
  const response = await apiClient.get<{ issues: Issue[] }>('/issues/nearby', {
    params,
  });
  return response.data.issues;
}

export async function confirmIssueApi(
  id: string,
  confirmed: boolean,
  rating?: number,
  feedback?: string,
): Promise<Issue> {
  const response = await apiClient.post<{ issue: Issue }>(
    `/issues/confirm/${id}`,
    {
      confirmed,
      rating,
      feedback,
    },
  );
  return response.data.issue;
}
