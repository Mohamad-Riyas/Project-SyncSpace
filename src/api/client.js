const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
const request = async (path, options) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    });
    if (!response.ok)
        throw new Error(`API request failed: ${response.status}`);
    return response.json();
};
export const apiClient = {
    getState: () => request('/state'),
    saveState: (state) => request('/state', { method: 'PUT', body: JSON.stringify(state) }),
    saveDocument: (workspaceId, document) => request(`/workspaces/${workspaceId}/document`, { method: 'PUT', body: JSON.stringify(document) }),
    addHistory: (workspaceId, entry) => request(`/workspaces/${workspaceId}/history`, { method: 'POST', body: JSON.stringify(entry) }),
    savePreferences: (workspaceId, preferences) => request(`/workspaces/${workspaceId}/preferences`, { method: 'PUT', body: JSON.stringify(preferences) }),
    health: () => request('/health'),
};
