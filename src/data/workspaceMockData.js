export const mockCollaborators = [
    { id: 'alex', name: 'Alex', status: 'online', activity: 'coding' },
    { id: 'sarah', name: 'Sarah', status: 'online', activity: 'drawing' },
    { id: 'john', name: 'John', status: 'idle', activity: 'idle' },
    { id: 'mike', name: 'Mike', status: 'offline' },
];
export const workspaceFiles = [
    {
        id: 'app',
        name: 'App.jsx',
        language: 'typescript',
        content: `export function App() {
  return (
    <main className="workspace-shell">
      <h1>SyncSpace</h1>
    </main>
  );
}`,
    },
    {
        id: 'main',
        name: 'main.jsx',
        language: 'typescript',
        content: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,
    },
    {
        id: 'styles',
        name: 'index.css',
        language: 'css',
        content: `body {
  margin: 0;
  font-family: Inter, sans-serif;
  background: #020817;
  color: #e2e8f0;
}`,
    },
    {
        id: 'package',
        name: 'package.json',
        language: 'json',
        content: `{
  "name": "syncspace-dashboard",
  "private": true,
  "scripts": {
    "dev": "vite"
  }
}`,
    },
];
