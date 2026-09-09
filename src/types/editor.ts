export type EditorLanguage = 'javascript' | 'typescript' | 'python' | 'java' | 'cpp' | 'html' | 'css' | 'json';

export interface EditorFile {
  id: string;
  name: string;
  language: EditorLanguage;
  content: string;
}

export interface EditorSettings {
  fontSize: number;
  wordWrap: boolean;
  minimap: boolean;
}

export interface EditorOutputEntry {
  id: string;
  text: string;
  type: 'info' | 'success' | 'error';
}
