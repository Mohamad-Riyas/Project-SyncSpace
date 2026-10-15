"""Generate English narration WAVs with the local Windows SAPI voice (free, offline)."""
import json
import subprocess
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
OUT = ROOT / "demo-output"
AUDIO = OUT / "audio"

SCENES = [
    ("intro", "Welcome to SyncSpace, a real-time collaborative workspace with a shared whiteboard, a live code editor, and team presence. Let's take a complete tour of the platform."),
    ("auth", "Everything starts with secure authentication. Users register with email verification, then sign in with their credentials. Invalid sign in attempts are rejected with a clear error message."),
    ("dash", "After signing in, the dashboard shows your workspaces, collaborators and interview activity, with quick actions to create a workspace or join one with an invite code."),
    ("rbac", "SyncSpace enforces role based access control. Here, a standard user tries to open the admin console, and is immediately redirected back to the dashboard. Admin and interviewer pages stay protected."),
    ("sync", "Now the core feature: real time collaboration. Two different users, each in their own browser session, open the same workspace. When the first user draws, the shapes appear instantly for the second user, with no page refresh. And it works the other way around too."),
    ("code", "Every workspace also includes a Monaco based code editor, with a project explorer. Write some JavaScript, press Run, and the output appears right in the built in terminal."),
    ("panels", "The workspace sidebar shows who is online, a history of changes, and workspace settings, so the whole team always knows who is in the room."),
    ("account", "The activity history keeps an audit trail of events, the profile page manages your account, and the interviews page lists interview sessions."),
    ("outro", "That is SyncSpace. A real time whiteboard, shared coding, live presence and secure role based access, built with React, Node, Socket I O and Yjs. Thanks for watching."),
]

PS = r'''
Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$s.SelectVoice("Microsoft Zira Desktop")
$s.Rate = -1
$s.SetOutputToWaveFile($args[0])
$s.Speak([IO.File]::ReadAllText($args[1]))
$s.Dispose()
'''


def main():
    AUDIO.mkdir(parents=True, exist_ok=True)
    ps1 = AUDIO / "_tts.ps1"
    ps1.write_text(PS, encoding="utf-8")
    durs = {}
    script = ["# SyncSpace narration script\n"]
    for name, text in SCENES:
        txt = AUDIO / f"{name}.txt"
        txt.write_text(text, encoding="utf-8")
        wav = AUDIO / f"{name}.wav"
        subprocess.run(["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", str(ps1), str(wav), str(txt)], check=True)
        with wave.open(str(wav)) as w:
            durs[name] = round(w.getnframes() / w.getframerate(), 2)
        script.append(f"## {name} ({durs[name]}s)\n{text}\n")
        txt.unlink()
    ps1.unlink()
    (OUT / "narration_script.md").write_text("\n".join(script), encoding="utf-8")
    (AUDIO / "durations.json").write_text(json.dumps(durs, indent=2))
    print(durs)


if __name__ == "__main__":
    main()
