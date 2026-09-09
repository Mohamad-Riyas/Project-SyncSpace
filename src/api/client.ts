const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const request = async <T>(path: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
  });
  if (!response.ok) throw new Error(`API request failed: ${response.status}`);
  return response.json() as Promise<T>;
};

export const apiClient = {
  getState: () => request('/state'),
  saveState: (state: unknown) => request('/state', { method: 'PUT', body: JSON.stringify(state) }),
  saveDocument: (workspaceId: number, document: unknown) => request(`/workspaces/${workspaceId}/document`, { method: 'PUT', body: JSON.stringify(document) }),
  addHistory: (workspaceId: number, entry: unknown) => request(`/workspaces/${workspaceId}/history`, { method: 'POST', body: JSON.stringify(entry) }),
  savePreferences: (workspaceId: number, preferences: unknown) => request(`/workspaces/${workspaceId}/preferences`, { method: 'PUT', body: JSON.stringify(preferences) }),
  health: () => request<{ status: string }>('/health'),
};
