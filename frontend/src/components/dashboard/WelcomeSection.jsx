import { Plus, UserPlus, ArrowRight, LogIn, UserRoundPlus } from 'lucide-react';
import { Button } from '../ui/Button';
export const WelcomeSection = ({ onCreateWorkspace, onJoinWorkspace, onSignIn, onRegister, readOnly = false }) => (
    <section className="dashboard-welcome">
        <div className="dashboard-welcome-copy">
            <p className="dashboard-eyebrow"><span /> A focused space for better teamwork</p>
            <h2>Make room for<br className="hidden sm:block" /> <span>good work.</span></h2>
            <p className="dashboard-welcome-description">Bring shared coding, whiteboards, and interviews together in a workspace that keeps your team in sync.</p>
        </div>
        <div className="dashboard-welcome-actions">
            {readOnly ? (
                <>
                    <Button variant="thunder" size="lg" icon={<LogIn className="w-4 h-4" />} onClick={onSignIn}>Sign in</Button>
                    <Button variant="outline" size="lg" icon={<UserRoundPlus className="w-4 h-4" />} onClick={onRegister}>Create an account</Button>
                </>
            ) : (
                <>
                    <Button variant="thunder" size="lg" icon={<Plus className="w-4 h-4" />} onClick={onCreateWorkspace}>Create Workspace</Button>
                    <Button variant="outline" size="lg" icon={<UserPlus className="w-4 h-4" />} onClick={onJoinWorkspace}>Join with a code</Button>
                </>
            )}
            <span className="dashboard-welcome-note">
                {readOnly ? 'A calmer way to work together' : 'Start a space or pick up where your team left off'}
                <ArrowRight className="h-3.5 w-3.5" />
            </span>
        </div>
    </section>
);
