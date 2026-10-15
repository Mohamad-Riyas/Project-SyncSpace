import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Plus, FolderPlus, Trash2, Save, FileCode2, Folder, ChevronRight, ChevronDown, Play, Terminal, X, RefreshCw } from 'lucide-react';
import { workspaceFilesApi } from '../api/client';
import { useToast } from '../context/ToastContext';
import './CodeEditor.css';

const languageFromName = (name) => {
  const ext = name.split('.').pop()?.toLowerCase();
  return ({ js:'javascript', jsx:'javascript', mjs:'javascript', ts:'typescript', tsx:'typescript', py:'python', java:'java', cpp:'cpp', c:'c', html:'html', css:'css', json:'json', md:'markdown' })[ext] || 'plaintext';
};

const runJavaScript = (source) => new Promise((resolve) => {
  const workerCode = `
    self.onmessage = ({ data }) => {
      const logs = [];
      let outputLength = 0;
      const stringify = (value) => { try { return typeof value === 'string' ? value : JSON.stringify(value, null, 2); } catch { return String(value); } };
      const write = (level, values) => {
        if (logs.length >= 500) throw new Error('Output limit reached (500 lines).');
        const line = level + values.map(stringify).join(' ');
        if (outputLength + line.length > 20000) throw new Error('Output limit reached (20,000 characters).');
        logs.push(line);
        outputLength += line.length;
      };
      const consoleProxy = {
        log: (...values) => write('', values),
        info: (...values) => write('', values),
        warn: (...values) => write('[warn] ', values),
        error: (...values) => write('[error] ', values),
      };
      try {
        new Function('console', data.code)(consoleProxy);
        self.postMessage({ ok: true, output: logs.join('\\n') || 'Program finished with no console output.' });
      } catch (error) {
        self.postMessage({ ok: false, output: [...logs, error?.message || String(error)].join('\\n') });
      }
    };
  `;
  const blob = new Blob([workerCode], { type: 'text/javascript' });
  const workerUrl = URL.createObjectURL(blob);
  const worker = new Worker(workerUrl);
  let settled = false;
  let timer;
  const finish = (result) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    worker.terminate();
    URL.revokeObjectURL(workerUrl);
    resolve(result);
  };
  timer = setTimeout(() => finish({ ok: false, output: 'Execution timed out after 2 seconds.' }), 2000);
  worker.onmessage = (event) => finish(event.data);
  worker.onerror = (event) => finish({ ok: false, output: event.message || 'Could not run JavaScript.' });
  worker.postMessage({ code: source });
});

let pythonWorker;
let pythonRequestSequence = 0;

const runPython = (source, stdin, onStatus) => new Promise((resolve) => {
  const worker = pythonWorker || (pythonWorker = new Worker(new URL('./pythonRunner.worker.js', import.meta.url), { type: 'module' }));
  const requestId = ++pythonRequestSequence;
  let timeout;
  let settled = false;

  const finish = (result, terminate = false) => {
    if (settled) return;
    settled = true;
    clearTimeout(timeout);
    worker.removeEventListener('message', handleMessage);
    worker.removeEventListener('error', handleError);
    if (terminate) {
      worker.terminate();
      if (pythonWorker === worker) pythonWorker = undefined;
    }
    resolve(result);
  };

  const setExecutionTimeout = (milliseconds, message) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => finish({ ok: false, output: message }, true), milliseconds);
  };

  const handleMessage = ({ data }) => {
    if (data.requestId !== requestId) return;
    if (data.type === 'status') {
      onStatus(data.status);
      const running = data.status === 'Running Python…';
      setExecutionTimeout(
        running ? 10000 : 60000,
        running ? 'Python execution timed out after 10 seconds.' : 'Python runtime loading timed out. Check your network and try again.'
      );
      return;
    }
    finish(data);
  };

  const handleError = (event) => finish({ ok: false, output: event.message || 'Could not start the Python runtime.' }, true);

  worker.addEventListener('message', handleMessage);
  worker.addEventListener('error', handleError);
  setExecutionTimeout(60000, 'Python runtime loading timed out. Check your network and try again.');
  worker.postMessage({ requestId, code: source, stdin });
});

function CodeEditor({ workspaceId, roomId, onActivity }) {
  const { showToast } = useToast();
  const [items, setItems] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [output, setOutput] = useState('');
  const [runStatus, setRunStatus] = useState('idle');
  const [stdin, setStdin] = useState('');
  const [expanded, setExpanded] = useState({});
  const starterFileRequestRef = useRef(null);

  const files = useMemo(() => items.filter((x) => x.kind === 'file'), [items]);
  const folders = useMemo(() => items.filter((x) => x.kind === 'folder'), [items]);
  const activeFile = files.find((x) => x.id === activeId) || files[0] || null;

  const load = useCallback(async () => {
    if (!workspaceId || !/^[a-f0-9]{24}$/i.test(String(workspaceId))) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { files: remote } = await workspaceFilesApi.list(workspaceId);
      let next = remote || [];
      if (!next.length) {
        const workspaceKey = String(workspaceId);
        if (starterFileRequestRef.current?.workspaceId !== workspaceKey) {
          const promise = workspaceFilesApi.create(workspaceId, {
            name: 'index.js',
            language: 'javascript',
            content: 'function hello() {\n  console.log("Hello SyncSpace!");\n}\n\nhello();',
          });
          starterFileRequestRef.current = { workspaceId: workspaceKey, promise };
          promise.catch(() => {
            if (starterFileRequestRef.current?.promise === promise) starterFileRequestRef.current = null;
          });
        }
        const a = await starterFileRequestRef.current.promise;
        next = [a.file];
      }
      setItems(next);
      const first = next.find((x) => x.kind === 'file');
      if (first) { setActiveId(first.id); setCode(first.content || ''); }
      setOutput('');
      setRunStatus('idle');
    } catch (err) {
      showToast(err.message || 'Could not load project files', 'error');
    } finally { setLoading(false); }
  }, [showToast, workspaceId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (activeFile) setCode(activeFile.content || '');
  }, [activeFile]);

  useEffect(() => {
    if (!workspaceId || !/^[a-f0-9]{24}$/i.test(String(workspaceId))) return undefined;
    const onRemoteUpdate = (event) => {
      const file = event.detail;
      if (!file || String(file.workspace || workspaceId) !== String(workspaceId)) return;
      setItems((prev) => prev.some((x) => x.id === file.id) ? prev.map((x) => x.id === file.id ? file : x) : [...prev, file]);
    };
    const onRemoteDelete = (event) => {
      const deleted = event.detail;
      if (!deleted?.id) return;
      setItems((prev) => prev.filter((x) => x.id !== deleted.id && !String(x.path).startsWith(`${deleted.path}/`)));
      if (activeId === deleted.id) {
        setActiveId(null);
        setCode('');
      }
    };
    window.addEventListener('syncspace:file-updated', onRemoteUpdate);
    window.addEventListener('syncspace:file-deleted', onRemoteDelete);
    return () => {
      window.removeEventListener('syncspace:file-updated', onRemoteUpdate);
      window.removeEventListener('syncspace:file-deleted', onRemoteDelete);
    };
  }, [activeId, workspaceId]);

  const selectFile = (file) => { setActiveId(file.id); setCode(file.content || ''); setOutput(''); setRunStatus('idle'); };

  const addFolder = async (parentPath = '') => {
    const name = window.prompt(parentPath ? `New folder inside ${parentPath}:` : 'Folder name:')?.trim();
    if (!name) return;
    try {
      const { file } = await workspaceFilesApi.create(workspaceId, { name, kind: 'folder', parentPath });
      setItems((prev) => [...prev, file]);
      setExpanded((prev) => ({ ...prev, [file.path]: true, [parentPath]: true }));
      showToast(`Folder “${file.name}” created`, 'success');
    } catch (err) { showToast(err.message || 'Could not create folder', 'error'); }
  };

  const addFile = async (parentPath = '') => {
    const name = window.prompt(parentPath ? `New file inside ${parentPath} (example: App.jsx):` : 'File name (example: App.jsx):')?.trim();
    if (!name) return;
    try {
      const { file } = await workspaceFilesApi.create(workspaceId, { name, kind: 'file', parentPath, language: languageFromName(name), content: '' });
      setItems((prev) => [...prev, file]);
      setActiveId(file.id); setCode(''); setExpanded((prev) => ({ ...prev, [parentPath]: true }));
      showToast(`File “${file.name}” created`, 'success');
    } catch (err) { showToast(err.message || 'Could not create file', 'error'); }
  };

  const save = async () => {
    if (!activeFile || saving) return;
    setSaving(true);
    try {
      const { file } = await workspaceFilesApi.update(workspaceId, activeFile.id, { content: code });
      setItems((prev) => prev.map((x) => x.id === file.id ? file : x));
      showToast(`Saved ${file.name}`, 'success');
    } catch (err) { showToast(err.message || 'Could not save file', 'error'); }
    finally { setSaving(false); }
  };

  const run = async () => {
    if (!activeFile || running) return;
    setRunning(true); setOutput('Running…'); setRunStatus('running');
    try {
      if (activeFile.language === 'javascript') {
        const result = await runJavaScript(code);
        setOutput(result.output); setRunStatus(result.ok ? 'success' : 'error');
        onActivity?.(`Ran ${activeFile.path}`, 'code');
      } else if (activeFile.language === 'python') {
        const result = await runPython(code, stdin, (status) => { setOutput(status); setRunStatus('running'); });
        setOutput(result.output); setRunStatus(result.ok ? 'success' : 'error');
        onActivity?.(`Ran ${activeFile.path}`, 'code');
      } else if (activeFile.language === 'html') {
        const win = window.open('', '_blank', 'noopener,noreferrer');
        if (win) { win.document.write(code); win.document.close(); setOutput('HTML preview opened in a new tab.'); setRunStatus('success'); }
        else { setOutput('Your browser blocked the preview tab. Allow pop-ups for SyncSpace.'); setRunStatus('error'); }
        onActivity?.(`Previewed ${activeFile.path}`, 'code');
      } else {
        setOutput(`Run is available for JavaScript, Python, and HTML. The ${activeFile.language || 'current'} file can still be edited and saved.`);
        setRunStatus('idle');
      }
    } catch (err) { setOutput(err.message || 'Could not run code.'); setRunStatus('error'); }
    finally { setRunning(false); }
  };

  const deleteItem = async (item) => {
    if (!window.confirm(`Delete ${item.kind} “${item.path}”${item.kind === 'folder' ? ' and everything inside it' : ''}?`)) return;
    try {
      await workspaceFilesApi.remove(workspaceId, item.id);
      setItems((prev) => prev.filter((x) => x.id !== item.id && !String(x.path).startsWith(`${item.path}/`)));
      if (activeId === item.id) {
        const next = files.find((x) => x.id !== item.id && !String(x.path).startsWith(`${item.path}/`));
        setActiveId(next?.id || null); setCode(next?.content || '');
      }
      showToast(`${item.kind === 'folder' ? 'Folder' : 'File'} deleted`, 'success');
    } catch (err) { showToast(err.message || 'Could not delete item', 'error'); }
  };

  const folderChildren = (folder) => items.filter((x) => x.parentPath === folder.path);
  const rootFiles = files.filter((x) => !x.parentPath);
  const rootFolders = folders.filter((x) => !x.parentPath);

  const FileRow = ({ file }) => (
    <div className={`file-row group ${activeId === file.id ? 'active' : ''}`} onClick={() => selectFile(file)} title={file.path}>
      <FileCode2 className="file-icon" />
      <span className="file-name">{file.name}</span>
      <button type="button" aria-label={`Delete ${file.name}`} onClick={(e) => { e.stopPropagation(); deleteItem(file); }} className="item-action delete-action"><Trash2 /></button>
    </div>
  );

  const FolderRow = ({ folder }) => {
    const open = expanded[folder.path] !== false;
    const children = folderChildren(folder);
    return (
      <div className="tree-node">
        <div className="folder-row">
          <button type="button" className="tree-chevron" onClick={() => setExpanded((p) => ({ ...p, [folder.path]: !open }))} aria-label={open ? 'Collapse folder' : 'Expand folder'}>
            {open ? <ChevronDown /> : <ChevronRight />}
          </button>
          <Folder className="folder-icon" />
          <button type="button" className="tree-label" onClick={() => setExpanded((p) => ({ ...p, [folder.path]: !open }))}>{folder.name}</button>
          <div className="tree-actions">
            <button type="button" title="New file in folder" onClick={() => addFile(folder.path)}><Plus /></button>
            <button type="button" title="New folder in folder" onClick={() => addFolder(folder.path)}><FolderPlus /></button>
            <button type="button" title="Delete folder" onClick={() => deleteItem(folder)}><Trash2 /></button>
          </div>
        </div>
        {open && <div className="tree-children">{children.map((x) => x.kind === 'folder' ? <FolderRow key={x.id} folder={x} /> : <FileRow key={x.id} file={x} />)}</div>}
      </div>
    );
  };

  if (loading) return <div className="editor-loading"><RefreshCw className="spin" /> Loading project files…</div>;

  return (
    <div className="editor-container">
      <div className="editor-explorer-bar">
        <div><div className="explorer-title">Project Explorer</div><div className="explorer-subtitle">{items.length} item{items.length === 1 ? '' : 's'} · {roomId ? `Room ${roomId}` : 'Local workspace'}</div></div>
        <div className="explorer-actions">
          <button type="button" className="explorer-button" onClick={() => addFolder('')}><FolderPlus /> New Folder</button>
          <button type="button" className="explorer-button" onClick={() => addFile('')}><Plus /> New File</button>
        </div>
      </div>
      <div className="editor-workbench">
        <aside className="file-tree">
          {rootFolders.map((x) => <FolderRow key={x.id} folder={x} />)}
          {rootFiles.map((x) => <FileRow key={x.id} file={x} />)}
          {!items.length && <div className="empty-files">No project files yet.<br />Create a file or folder above.</div>}
        </aside>
        <section className="editor-code-area">
          <div className="editor-filebar">
            <div className="active-file-name"><FileCode2 /> <span>{activeFile?.path || 'No file selected'}</span></div>
            <div className="editor-actions">
              <button type="button" className="toolbar-button run-button" disabled={!activeFile || running} onClick={run}><Play /> {running ? 'Running…' : 'Run'}</button>
              <button type="button" className="toolbar-button save-button" disabled={!activeFile || saving} onClick={save}><Save /> {saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
          <div className="monaco-wrap"><Editor height="100%" language={activeFile?.language || 'plaintext'} value={code} theme="vs-dark" onChange={(v) => setCode(v || '')} options={{ fontSize: 14, minimap: { enabled: false }, automaticLayout: true, wordWrap: 'on', scrollBeyondLastLine: false, padding: { top: 12, bottom: 12 }, smoothScrolling: true }} /></div>
          <div className={`editor-output ${runStatus} ${activeFile?.language === 'python' ? 'has-stdin' : ''}`}>
            <div className="output-header"><div><Terminal /> Terminal</div><button type="button" onClick={() => { setOutput(''); setRunStatus('idle'); }} title="Clear terminal"><X /></button></div>
            {activeFile?.language === 'python' && <label className="program-input"><span>Program input · one response per line</span><textarea value={stdin} onChange={(event) => setStdin(event.target.value)} placeholder={'Calculator example: enter each response on a new line\n1\n8\n2\n7'} spellCheck="false" /></label>}
            <pre className="output-content">{output || 'Run a JavaScript, Python, or HTML file to see output here.'}</pre>
          </div>
        </section>
      </div>
    </div>
  );
}
export default CodeEditor;
