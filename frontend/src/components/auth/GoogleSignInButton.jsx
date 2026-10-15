import { useEffect, useRef, useState } from 'react';

const GOOGLE_SCRIPT_ID = 'google-identity-services';
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

export function GoogleSignInButton({ onCredential, onSetupRequired, disabled = false }) {
  const buttonRef = useRef(null);
  const callbackRef = useRef(onCredential);
  const [scriptReady, setScriptReady] = useState(Boolean(window.google?.accounts?.id));
  const [scriptError, setScriptError] = useState(false);

  useEffect(() => { callbackRef.current = onCredential; }, [onCredential]);

  useEffect(() => {
    if (!CLIENT_ID || window.google?.accounts?.id) {
      setScriptReady(Boolean(window.google?.accounts?.id));
      return undefined;
    }

    let script = document.getElementById(GOOGLE_SCRIPT_ID);
    const onLoad = () => setScriptReady(true);
    const onError = () => setScriptError(true);
    if (!script) {
      script = document.createElement('script');
      script.id = GOOGLE_SCRIPT_ID;
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
    script.addEventListener('load', onLoad);
    script.addEventListener('error', onError);
    if (window.google?.accounts?.id) onLoad();
    return () => {
      script.removeEventListener('load', onLoad);
      script.removeEventListener('error', onError);
    };
  }, []);

  useEffect(() => {
    if (!CLIENT_ID || !scriptReady || !buttonRef.current || !window.google?.accounts?.id) return;
    const google = window.google.accounts.id;
    google.initialize({
      client_id: CLIENT_ID,
      callback: ({ credential }) => {
        if (credential) callbackRef.current(credential);
      },
    });
    buttonRef.current.replaceChildren();
    google.renderButton(buttonRef.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      logo_alignment: 'left',
      width: Math.floor(buttonRef.current.clientWidth),
    });
  }, [scriptReady]);

  if (!CLIENT_ID) {
    return (
      <button type="button" className="google-login-unconfigured" onClick={onSetupRequired} disabled={disabled}>
        <span className="google-g" aria-hidden="true">G</span>
        Continue with Google
      </button>
    );
  }

  return (
    <div className={`google-signin-slot ${disabled ? 'is-disabled' : ''}`} aria-label="Continue with Google">
      {scriptError ? <p role="status">Google sign-in could not load. Check your connection and try again.</p> : <div ref={buttonRef} />}
    </div>
  );
}