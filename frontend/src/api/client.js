// Base URL for the real Express/Mongo backend (auth, interviews, admin).
// Distinct from API_BASE_URL below, which some legacy demo endpoints
// (/state, /workspaces/*) point at a mock/local API layer.
const AUTH_API_URL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:5000/api';
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const TOKEN_KEY = 'syncspace-token';
export const getToken = () => window.localStorage.getItem(TOKEN_KEY) || '';

// Guests (share-link visitors) keep a separate, workspace-scoped token so /auth/me never sees it.
const GUEST_KEY = 'syncspace-guest';
export const getGuestSession = () => {
    try {
        return JSON.parse(window.localStorage.getItem(GUEST_KEY) || 'null');
    } catch {
        return null;
    }
};
export const saveGuestSession = (session) => window.localStorage.setItem(GUEST_KEY, JSON.stringify(session));
export const clearGuestSession = () => window.localStorage.removeItem(GUEST_KEY);
export const getAccessToken = () => getToken() || getGuestSession()?.token || '';

class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
    }
}

const authRequest = async (path, options = {}) => {
    const token = getAccessToken();
    const response = await fetch(`${AUTH_API_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers || {}),
        },
    });
    let data = null;
    try {
        data = await response.json();
    } catch (err) {
        // no JSON body (e.g. 204)
    }
    if (!response.ok) {
        throw new ApiError(data?.message || `Request failed (${response.status})`, response.status);
    }
    return data;
};

const request = async (path, options) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers: { 'Content-Type': 'application/json', ...(options?.headers || {}) },
    });
    if (!response.ok)
        throw new Error(`API request failed: ${response.status}`);
    return response.json();
};

export const authApi = {
    login: (email, password) => authRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    googleLogin: (credential) => authRequest('/auth/google', { method: 'POST', body: JSON.stringify({ credential }) }),
    signup: (name, email, password, role) => authRequest('/auth/signup', { method: 'POST', body: JSON.stringify({ name, email, password, role }) }),
    me: () => authRequest('/auth/me'),
    updateProfile: (payload) => authRequest('/auth/me', { method: 'PATCH', body: JSON.stringify(payload) }),
};

export const interviewsApi = {
    create: (payload) => authRequest('/interviews', { method: 'POST', body: JSON.stringify(payload) }),
    list: () => authRequest('/interviews'),
    getByCode: (code) => authRequest(`/interviews/code/${encodeURIComponent(code)}`),
    join: (code) => authRequest(`/interviews/${encodeURIComponent(code)}/join`, { method: 'POST' }),
    joinAsGuest: (code, name) => authRequest(`/interviews/${encodeURIComponent(code)}/guest`, { method: 'POST', body: JSON.stringify({ name }) }),
    getById: (id) => authRequest(`/interviews/${id}`),
    updateCandidate: (id, candidateEmail) => authRequest(`/interviews/${id}/candidate`, { method: 'PATCH', body: JSON.stringify({ candidateEmail }) }),
    addCandidate: (id, email) => authRequest(`/interviews/${id}/candidates`, { method: 'POST', body: JSON.stringify({ email }) }),
    removeCandidate: (id, candidateId) => authRequest(`/interviews/${id}/candidates/${encodeURIComponent(candidateId)}`, { method: 'DELETE' }),
    removeCandidateByEmail: (id, email) => authRequest(`/interviews/${id}/candidates/by-email/${encodeURIComponent(email)}`, { method: 'DELETE' }),
    updateNotes: (id, notes) => authRequest(`/interviews/${id}/notes`, { method: 'PATCH', body: JSON.stringify({ notes }) }),
    end: (id) => authRequest(`/interviews/${id}/end`, { method: 'POST' }),
    start: (id) => authRequest(`/interviews/${id}/start`, { method: 'POST' }),
    update: (id, payload) => authRequest(`/interviews/${id}/notes`, { method: 'PATCH', body: JSON.stringify(payload) }),
    score: (id, payload) => authRequest(`/interviews/${id}/score`, { method: 'PATCH', body: JSON.stringify(payload) }),
};

export const workspaceApi = {
    list: () => authRequest('/workspaces'),
    get: (id) => authRequest(`/workspaces/${id}`),
    getActivity: (id) => authRequest(`/workspaces/${id}/activity`),
    recordActivity: (id, action, source) => authRequest(`/workspaces/${id}/activity`, { method: 'POST', body: JSON.stringify({ action, source }) }),
    findByCode: (code) => authRequest(`/workspaces/code/${encodeURIComponent(code)}`),
    create: (payload) => authRequest('/workspaces', { method: 'POST', body: JSON.stringify(payload) }),
    join: (code) => authRequest(`/workspaces/${encodeURIComponent(code)}/join`, { method: 'POST' }),
    joinAsGuest: (code, name) => authRequest(`/workspaces/${encodeURIComponent(code)}/guest`, { method: 'POST', body: JSON.stringify({ name }) }),
    updateMember: (id, memberId, role) => authRequest(`/workspaces/${id}/members/${encodeURIComponent(memberId)}`, { method: 'PATCH', body: JSON.stringify({ role }) }),
    removeMember: (id, memberId) => authRequest(`/workspaces/${id}/members/${encodeURIComponent(memberId)}`, { method: 'DELETE' }),
    update: (id, payload) => authRequest(`/workspaces/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
    remove: (id) => authRequest(`/workspaces/${id}`, { method: 'DELETE' }),
};

export const workspaceFilesApi = {
    list: (workspaceId) => authRequest(`/workspaces/${workspaceId}/files`),
    create: (workspaceId, payload) => authRequest(`/workspaces/${workspaceId}/files`, { method: 'POST', body: JSON.stringify(payload) }),
    update: (workspaceId, fileId, payload) => authRequest(`/workspaces/${workspaceId}/files/${fileId}`, { method: 'PATCH', body: JSON.stringify(payload) }),
    remove: (workspaceId, fileId) => authRequest(`/workspaces/${workspaceId}/files/${fileId}`, { method: 'DELETE' }),
};

export const auditApi = {
    list: (limit = 200) => authRequest(`/audit?limit=${limit}`),
};

export const recordingsApi = {
    start: (interviewId, mimeType) => authRequest('/recordings/start', { method: 'POST', body: JSON.stringify({ interviewId, mimeType }) }),
    chunk: (id, data) => authRequest(`/recordings/${id}/chunk`, { method: 'POST', body: JSON.stringify({ data }) }),
    finalize: (id, durationSeconds) => authRequest(`/recordings/${id}/finalize`, { method: 'POST', body: JSON.stringify({ durationSeconds }) }),
    discard: (id) => authRequest(`/recordings/${id}`, { method: 'DELETE' }),
    list: () => authRequest('/recordings'),
    share: (id) => authRequest(`/recordings/${id}/share`, { method: 'POST' }),
    stream: async (id) => {
        const response = await fetch(`${AUTH_API_URL}/recordings/${id}`, {
            headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (!response.ok) throw new Error(`Recording request failed (${response.status})`);
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    },
};

export const adminApi = {
    listUsers: () => authRequest('/admin/users'),
    updateUserRole: (id, role) => authRequest(`/admin/users/${id}/role`, { method: 'PATCH', body: JSON.stringify({ role }) }),
    deleteUser: (id) => authRequest(`/admin/users/${id}`, { method: 'DELETE' }),
    listInterviews: () => authRequest('/admin/interviews'),
    stats: () => authRequest('/admin/stats'),
};

export const apiClient = {
    getState: () => request('/state'),
    saveState: (state) => request('/state', { method: 'PUT', body: JSON.stringify(state) }),
    saveDocument: (workspaceId, document) => request(`/workspaces/${workspaceId}/document`, { method: 'PUT', body: JSON.stringify(document) }),
    addHistory: (workspaceId, entry) => request(`/workspaces/${workspaceId}/history`, { method: 'POST', body: JSON.stringify(entry) }),
    savePreferences: (workspaceId, preferences) => request(`/workspaces/${workspaceId}/preferences`, { method: 'PUT', body: JSON.stringify(preferences) }),
    health: () => request('/health'),
};
