import { createServer } from 'node:http';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const port = Number(process.env.PORT || 8787);
const root = dirname(fileURLToPath(import.meta.url));
const dataDirectory = join(root, 'data');
const dataFile = join(dataDirectory, 'state.json');

const emptyState = {
  workspaces: [],
  activities: [],
  sessions: [],
  documents: {},
  history: {},
  preferences: {},
};

const ensureStateFile = () => {
  if (!existsSync(dataDirectory)) mkdirSync(dataDirectory, { recursive: true });
  if (!existsSync(dataFile)) writeFileSync(dataFile, JSON.stringify(emptyState, null, 2));
};

const readState = () => {
  ensureStateFile();
  try {
    return { ...emptyState, ...JSON.parse(readFileSync(dataFile, 'utf8')) };
  } catch {
    return { ...emptyState };
  }
};

const writeState = (state) => {
  ensureStateFile();
  writeFileSync(dataFile, JSON.stringify(state, null, 2));
  return state;
};

const send = (response, status, body) => {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
  });
  response.end(JSON.stringify(body));
};

const readBody = async (request) => {
  let body = '';
  for await (const chunk of request) body += chunk;
  return body ? JSON.parse(body) : {};
};

const server = createServer(async (request, response) => {
  if (request.method === 'OPTIONS') return send(response, 204, {});
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
  const segments = url.pathname.split('/').filter(Boolean);
  const state = readState();

  try {
    if (request.method === 'GET' && url.pathname === '/api/health') return send(response, 200, { status: 'ok', service: 'syncspace-server' });
    if (request.method === 'GET' && url.pathname === '/api/state') return send(response, 200, state);

    if (segments[1] === 'workspaces' && segments[2]) {
      const workspaceId = segments[2];
      if (request.method === 'GET' && segments.length === 3) {
        return send(response, 200, state.workspaces.find((workspace) => String(workspace.id) === workspaceId) || null);
      }
      if (request.method === 'PUT' && segments[3] === 'document') {
        const body = await readBody(request);
        state.documents[workspaceId] = { ...(state.documents[workspaceId] || {}), ...body, updatedAt: new Date().toISOString() };
        return send(response, 200, writeState(state).documents[workspaceId]);
      }
      if (request.method === 'GET' && segments[3] === 'document') return send(response, 200, state.documents[workspaceId] || {});
      if (request.method === 'POST' && segments[3] === 'history') {
        const entry = await readBody(request);
        const history = state.history[workspaceId] || [];
        state.history[workspaceId] = [{ ...entry, id: `${workspaceId}-${Date.now()}`, createdAt: new Date().toISOString() }, ...history].slice(0, 100);
        return send(response, 201, state.history[workspaceId][0]);
      }
      if (request.method === 'GET' && segments[3] === 'history') return send(response, 200, state.history[workspaceId] || []);
      if (request.method === 'PUT' && segments[3] === 'preferences') {
        state.preferences[workspaceId] = await readBody(request);
        return send(response, 200, writeState(state).preferences[workspaceId]);
      }
    }

    if (request.method === 'PUT' && url.pathname === '/api/state') return send(response, 200, writeState(await readBody(request)));
    return send(response, 404, { error: 'Route not found' });
  } catch (error) {
    return send(response, 400, { error: error instanceof Error ? error.message : 'Request failed' });
  }
});

server.listen(port, () => console.log(`SyncSpace server listening on http://localhost:${port}`));
