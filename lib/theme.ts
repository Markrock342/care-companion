export const THEME_KEY = "cc-theme";
export type ThemeName = "light" | "dark";

export function applyTheme(theme: ThemeName) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* private mode */
  }
}

export function readStoredTheme(): ThemeName | null {
  try {
    const value = localStorage.getItem(THEME_KEY);
    if (value === "dark" || value === "light") return value;
  } catch {
    /* private mode */
  }
  return null;
}
