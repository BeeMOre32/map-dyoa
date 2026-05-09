export const REMINDER_SETTINGS_KEY = 'calendar:miss-reminder:v1';

export function getReminderEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(REMINDER_SETTINGS_KEY);
    if (!raw) return false;
    const parsed = JSON.parse(raw) as { enabled?: boolean };
    return parsed.enabled === true;
  } catch {
    return false;
  }
}

export function setReminderEnabled(enabled: boolean) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REMINDER_SETTINGS_KEY, JSON.stringify({ enabled }));
  window.dispatchEvent(
    new CustomEvent('reminder-settings-changed', { detail: { enabled } }),
  );
}
