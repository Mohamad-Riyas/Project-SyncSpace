# SyncSpace narration script

## intro (12.62s)
Welcome to SyncSpace, a real-time collaborative workspace with a shared whiteboard, a live code editor, and team presence. Let's take a complete tour of the platform.

## auth (13.87s)
Everything starts with secure authentication. Users register with email verification, then sign in with their credentials. Invalid sign in attempts are rejected with a clear error message.

## dash (11.72s)
After signing in, the dashboard shows your workspaces, collaborators and interview activity, with quick actions to create a workspace or join one with an invite code.

## rbac (15.52s)
SyncSpace enforces role based access control. Here, a standard user tries to open the admin console, and is immediately redirected back to the dashboard. Admin and interviewer pages stay protected.

## sync (20.93s)
Now the core feature: real time collaboration. Two different users, each in their own browser session, open the same workspace. When the first user draws, the shapes appear instantly for the second user, with no page refresh. And it works the other way around too.

## code (13.16s)
Every workspace also includes a Monaco based code editor, with a project explorer. Write some JavaScript, press Run, and the output appears right in the built in terminal.

## panels (10.21s)
The workspace sidebar shows who is online, a history of changes, and workspace settings, so the whole team always knows who is in the room.

## account (9.93s)
The activity history keeps an audit trail of events, the profile page manages your account, and the interviews page lists interview sessions.

## outro (15.46s)
That is SyncSpace. A real time whiteboard, shared coding, live presence and secure role based access, built with React, Node, Socket I O and Yjs. Thanks for watching.
