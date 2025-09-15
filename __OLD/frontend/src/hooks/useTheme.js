import { useState, useEffect } from 'react';

// Dark theme colors based on Discord
export const darkTheme = {
  // Background colors
  bgPrimary: 'var(--discord-bg-primary)',
  bgSecondary: 'var(--discord-bg-secondary)', 
  bgTertiary: 'var(--discord-bg-tertiary)',
  bgQuaternary: 'var(--discord-bg-quaternary)',
  bgElevation1: 'var(--discord-bg-elevation-1)',
  bgElevation2: 'var(--discord-bg-elevation-2)',
  bgElevation3: 'var(--discord-bg-elevation-3)',
  
  // Text colors
  textPrimary: 'var(--discord-text-primary)',
  textSecondary: 'var(--discord-text-secondary)',
  textMuted: 'var(--discord-text-muted)',
  textLink: 'var(--discord-text-link)',
  
  // Interactive colors
  interactiveNormal: 'var(--discord-interactive-normal)',
  interactiveHover: 'var(--discord-interactive-hover)',
  interactiveActive: 'var(--discord-interactive-active)',
  interactiveMuted: 'var(--discord-interactive-muted)',
  
  // Button colors
  buttonPrimary: 'var(--discord-button-primary)',
  buttonPrimaryHover: 'var(--discord-button-primary-hover)',
  buttonSuccess: 'var(--discord-button-success)',
  buttonSuccessHover: 'var(--discord-button-success-hover)',
  buttonDanger: 'var(--discord-button-danger)',
  buttonDangerHover: 'var(--discord-button-danger-hover)',
  buttonSecondary: 'var(--discord-button-secondary)',
  buttonSecondaryHover: 'var(--discord-button-secondary-hover)',
  
  // Border colors
  borderPrimary: 'var(--discord-border-primary)',
  borderSecondary: 'var(--discord-border-secondary)',
  borderTertiary: 'var(--discord-border-tertiary)',
  
  // Status colors
  statusOnline: 'var(--discord-status-online)',
  statusWarning: 'var(--discord-status-warning)',
  statusDanger: 'var(--discord-status-danger)',
  statusInfo: 'var(--discord-status-info)',
};

export function useTheme() {
  const [theme, setTheme] = useState('dark'); // Always dark for Discord theme

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return {
    theme: darkTheme,
    isDark: true,
    colors: darkTheme
  };
}

export default useTheme;
