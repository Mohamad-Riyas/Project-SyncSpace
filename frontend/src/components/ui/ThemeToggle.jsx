import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';

export const ThemeToggle = ({ className = '' }) => {
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();
  const isLightMode = theme === 'light';

  return (
    <button
      type="button"
      onClick={() => {
        setTheme(isLightMode ? 'dark' : 'light');
        showToast(isLightMode ? 'Dark mode enabled' : 'Light mode enabled', 'info');
      }}
      className={`app-icon-button rounded-lg p-2 transition-colors ${className}`}
      aria-label={isLightMode ? 'Switch to dark mode' : 'Switch to light mode'}
      title={isLightMode ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {isLightMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
};
