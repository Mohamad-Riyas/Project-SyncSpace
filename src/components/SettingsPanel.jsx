import "./SettingsPanel.css";

function SettingsPanel({ splitRatio, hasBothTools, onSplitRatioChange, onDownload }) {
	return (
		<section className="settings-panel">
			<div className="settings-heading">
				<div>
					<h2>Workspace settings</h2>
					<p>Arrange the collaboration surface for your team.</p>
				</div>
			</div>
			{hasBothTools ? (
				<label className="setting-control">
					<span><strong>Panel balance</strong><small>Whiteboard {splitRatio}% / Code Editor {100 - splitRatio}%</small></span>
					<input type="range" min="20" max="80" value={splitRatio} onChange={(event) => onSplitRatioChange(Number(event.target.value))} />
				</label>
			) : (
				<div className="setting-control setting-control-disabled">
					<strong>Full-size workspace</strong>
					<small>The available {hasBothTools ? 'tools' : 'tool'} automatically fills the workspace.</small>
				</div>
			)}
			<button className="download-project-btn" type="button" onClick={onDownload}>Download workspace project</button>
			<p className="settings-note">Exports the current files, canvas objects, collaborators, and activity history as a JSON project file.</p>
		</section>
	);
}

export default SettingsPanel;
