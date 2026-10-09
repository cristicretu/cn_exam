/** localStorage that never throws (private mode, quota, blocked storage). */
export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): void {
  try {
    if (value === undefined || value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable; the app still works for this tab
  }
}

export const KEYS = {
  progress: "cn.progress.v1",
  session: "cn.session.v1",
  apiKey: "cn.geminiKey",
  theme: "cn.theme",
  examSize: "cn.examSize",
  examMinutes: "cn.examMinutes",
} as const;
