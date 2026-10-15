const PYODIDE_BASE_URL = 'https://cdn.jsdelivr.net/pyodide/v314.0.7/full/';
let pyodidePromise;
let output = '';
let outputTruncated = false;
const MAX_OUTPUT_LENGTH = 20000;

const appendOutput = (chunk) => {
  const text = String(chunk);
  const remaining = MAX_OUTPUT_LENGTH - output.length;
  if (remaining > 0) output += text.slice(0, remaining);
  if (text.length > remaining) outputTruncated = true;
};

const getPyodide = () => {
  pyodidePromise ||= import(/* @vite-ignore */ `${PYODIDE_BASE_URL}pyodide.mjs`)
    .then(({ loadPyodide }) => loadPyodide({ indexURL: PYODIDE_BASE_URL }))
    .catch((error) => {
      pyodidePromise = undefined;
      throw error;
    });
  return pyodidePromise;
};

self.onmessage = async ({ data }) => {
  const { requestId, code, stdin } = data;
  output = '';
  outputTruncated = false;
  let inputExhausted = false;

  try {
    self.postMessage({ requestId, type: 'status', status: 'Loading Python runtime…' });
    const pyodide = await getPyodide();
    const inputLines = stdin ? stdin.split(/\r?\n/) : [];
    let inputIndex = 0;

    pyodide.setStdout({ batched: appendOutput });
    pyodide.setStderr({ batched: appendOutput });
    pyodide.setStdin({
      stdin: () => {
        if (inputIndex >= inputLines.length) {
          inputExhausted = true;
          return null;
        }
        return inputLines[inputIndex++];
      },
    });

    self.postMessage({ requestId, type: 'status', status: 'Loading imported packages…' });
    await pyodide.loadPackagesFromImports(code);
    self.postMessage({ requestId, type: 'status', status: 'Running Python…' });
    await pyodide.runPythonAsync(code);

    if (outputTruncated) appendOutput('\nOutput truncated at 20,000 characters.');
    self.postMessage({
      requestId,
      type: 'result',
      ok: true,
      output: output || 'Program finished with no output.',
    });
  } catch (error) {
    const message = inputExhausted && String(error).includes('EOFError')
      ? 'Program requested more input. Add one response per line in Program input and run again.'
      : error?.message || String(error);
    appendOutput(`${output ? '\n' : ''}${message}`);
    if (outputTruncated) appendOutput('\nOutput truncated at 20,000 characters.');
    self.postMessage({ requestId, type: 'result', ok: false, output });
  }
};
