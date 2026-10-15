import { lazy, Suspense } from 'react';
import { Plus, UserPlus, ArrowRight } from 'lucide-react';
import { Button } from '../ui/Button';
const InteractiveLaptop = lazy(() => import('./InteractiveLaptop').then((module) => ({ default: module.InteractiveLaptop })));
export const WelcomeSection = ({ onCreateWorkspace, onJoinWorkspace, readOnly = false, showLaptop = true }) => (
    <section className="dashboard-welcome">
        <div className="dashboard-welcome-copy">
            <p className="dashboard-eyebrow"><span /> A clearer way to collaborate</p>
            <h2>Good work happens<br className="hidden sm:block" /> <span>in sync.</span></h2>
            <p className="dashboard-welcome-description">Bring your team’s planning, code, and conversations into one considered workspace.</p>
        </div>
        {showLaptop && <Suspense fallback={<div className="interactive-laptop-loading" aria-hidden="true"><img src="/SyncSpace%20Logo.png" alt="" /></div>}>
            <InteractiveLaptop />
        </Suspense>}
        {!readOnly && <div className="dashboard-welcome-actions">
            <Button variant="thunder" size="lg" icon={<Plus className="w-4 h-4" />} onClick={onCreateWorkspace}>Create Workspace</Button>
            <Button variant="outline" size="lg" icon={<UserPlus className="w-4 h-4" />} onClick={onJoinWorkspace}>Join with a code</Button>
            <span className="dashboard-welcome-note">Start a space or pick up where your team left off <ArrowRight className="h-3.5 w-3.5" /></span>
        </div>}
    </section>
);
