import CodeEditor from '../../../components/CodeEditor';

/**
 * InterviewCodeEditor — thin wrapper around the existing CodeEditor component.
 */
export function InterviewCodeEditor({ workspaceId, roomId, onActivity }) {
  return (
    <div className="h-full w-full min-h-0 flex-1 flex flex-col">
      <CodeEditor workspaceId={workspaceId} roomId={roomId} onActivity={onActivity} />
    </div>
  );
}

export default InterviewCodeEditor;
