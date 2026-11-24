import { useEffect, useState } from 'react';
import {
  STUDIO_EXHIBITS,
  type ExhibitMediaType,
  type StudioExhibitSample,
} from './studioSamples';

export const STUDIO_OWNER_EMAIL = 'rafiargsnti221169@gmail.com';
export const STUDIO_OWNER_NAME = 'רפאל ארגנטי';
export const STUDIO_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1ypSdymFV-oufB1YEKzNii9uvm05FwdmzN8K0fBkZxKI/edit?gid=445464849#gid=445464849';

export const AUTH_STORAGE_KEY = 'dupaman_user_session_v1';
const LOCAL_CMS_EXHIBITS_KEY = 'dupaman_owner_cms_exhibits_v1';
const LOCAL_SCRIPT_URL_KEY = 'dupaman_owner_sheet_script_url_v1';
const EXHIBITS_UPDATED_EVENT = 'dupaman_exhibits_updated';
const AUTH_UPDATED_EVENT = 'dupaman_auth_updated';

export interface StoredUserSession {
  email: string;
  name: string;
  isOwner?: boolean;
  adminPin?: string;
  googleIdToken?: string;
}

export interface SheetInboxRow {
  rowIndex: number;
  date: string;
  title: string;
  topic: string;
  subtopic: string;
  source: string;
  summary: string;
  highlights: string[];
  lifeQuote: string;
  question: string;
  url: string;
  suggestedNodeCode: StudioExhibitSample['nodeCode'];
  mediaType: ExhibitMediaType;
  mediaBadge: string;
}

let cachedRemoteExhibits: StudioExhibitSample[] = [];
let hasFetchedRemote = false;

export function isOwnerEmail(email: string | null | undefined): boolean {
  return String(email ?? '').trim().toLowerCase() === STUDIO_OWNER_EMAIL;
}

export function getStoredSession(): StoredUserSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredUserSession;
    if (!parsed?.email) return null;
    return {
      ...parsed,
      isOwner: isOwnerEmail(parsed.email),
    };
  } catch {
    return null;
  }
}

export function saveStoredSession(session: StoredUserSession | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (session) {
      localStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify({ ...session, isOwner: isOwnerEmail(session.email) })
      );
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch {
    // ignore storage errors
  }
  window.dispatchEvent(new CustomEvent(AUTH_UPDATED_EVENT));
}

export function useOwnerSession(): StoredUserSession | null {
  const [session, setSession] = useState<StoredUserSession | null>(() => getStoredSession());

  useEffect(() => {
    const sync = () => setSession(getStoredSession());
    window.addEventListener(AUTH_UPDATED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(AUTH_UPDATED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return session;
}

export function getSavedSheetScriptUrl(): string {
  if (typeof window === 'undefined') return '';
  try {
    return localStorage.getItem(LOCAL_SCRIPT_URL_KEY) || '';
  } catch {
    return '';
  }
}

export function saveSheetScriptUrl(url: string): void {
  if (typeof window === 'undefined') return;
  try {
    const trimmed = url.trim();
    if (trimmed) localStorage.setItem(LOCAL_SCRIPT_URL_KEY, trimmed);
    else localStorage.removeItem(LOCAL_SCRIPT_URL_KEY);
  } catch {
    // ignore
  }
}

export function getLocalCustomExhibits(): StudioExhibitSample[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_CMS_EXHIBITS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as StudioExhibitSample[]) : [];
  } catch {
    return [];
  }
}

function setLocalCustomExhibits(list: StudioExhibitSample[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_CMS_EXHIBITS_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent(EXHIBITS_UPDATED_EVENT));
}

export function getMergedExhibits(): StudioExhibitSample[] {
  const map = new Map<string, StudioExhibitSample>();
  for (const ex of getLocalCustomExhibits()) {
    map.set(ex.id, ex);
  }
  for (const ex of cachedRemoteExhibits) {
    if (!map.has(ex.id)) map.set(ex.id, ex);
  }
  for (const ex of STUDIO_EXHIBITS) {
    if (!map.has(ex.id)) map.set(ex.id, ex);
  }
  return Array.from(map.values());
}

export async function refreshExhibitsFromServer(includeInbox = false): Promise<{
  exhibits: StudioExhibitSample[];
  sheetConnected: boolean;
  sheetInbox: SheetInboxRow[];
}> {
  const scriptUrl = getSavedSheetScriptUrl();
  const headers: Record<string, string> = {};
  if (scriptUrl) headers['x-sheet-script-url'] = scriptUrl;

  try {
    const res = await fetch(`/api/exhibits${includeInbox ? '?inbox=1' : ''}`, { headers });
    if (res.ok) {
      const data = (await res.json()) as {
        ok?: boolean;
        exhibits?: StudioExhibitSample[];
        sheetConnected?: boolean;
        sheetInbox?: SheetInboxRow[];
      };
      if (data.ok && Array.isArray(data.exhibits)) {
        cachedRemoteExhibits = data.exhibits;
        hasFetchedRemote = true;
        window.dispatchEvent(new CustomEvent(EXHIBITS_UPDATED_EVENT));
        return {
          exhibits: getMergedExhibits(),
          sheetConnected: Boolean(data.sheetConnected),
          sheetInbox: data.sheetInbox || [],
        };
      }
    }
  } catch {
    // fall back to local + built-in
  }

  return {
    exhibits: getMergedExhibits(),
    sheetConnected: false,
    sheetInbox: [],
  };
}

export async function upsertStudioExhibit(
  exhibit: StudioExhibitSample,
  session: StoredUserSession | null
): Promise<{ ok: boolean; persistedToSheet: boolean; message: string }> {
  // Always update locally immediately for zero-latency studio feedback
  const existing = getLocalCustomExhibits().filter((item) => item.id !== exhibit.id);
  setLocalCustomExhibits([exhibit, ...existing]);

  const scriptUrl = getSavedSheetScriptUrl();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-admin-email': session?.email || '',
  };
  if (session?.adminPin) headers['x-admin-pin'] = session.adminPin;
  if (session?.googleIdToken) headers.Authorization = `Bearer ${session.googleIdToken}`;

  try {
    const res = await fetch('/api/exhibits', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ownerEmail: session?.email,
        adminPin: session?.adminPin,
        scriptUrl,
        exhibit,
      }),
    });
    const data = (await res.json()) as {
      ok?: boolean;
      persistedToSheet?: boolean;
      error?: string;
      note?: string;
    };
    if (!res.ok || !data.ok) {
      return {
        ok: true,
        persistedToSheet: false,
        message: data.error || 'נשמר בסטודיו המקומי (בדוק חיבור גיליון לסנכרון לכל המבקרים).',
      };
    }
    if (data.persistedToSheet) {
      cachedRemoteExhibits = [
        exhibit,
        ...cachedRemoteExhibits.filter((item) => item.id !== exhibit.id),
      ];
      window.dispatchEvent(new CustomEvent(EXHIBITS_UPDATED_EVENT));
      return {
        ok: true,
        persistedToSheet: true,
        message: 'נשמר ישירות בגיליון Google Sheets ופורסם באתר החי!',
      };
    }
    return {
      ok: true,
      persistedToSheet: false,
      message:
        data.note ||
        'פורסם מיד בתצוגת הסטודיו! לכתיבה אוטומטית בגיליון לכל המבקרים, חבר את Apps Script בלשונית חיבור.',
    };
  } catch {
    return {
      ok: true,
      persistedToSheet: false,
      message: 'פורסם בתצוגת הסטודיו המקומית.',
    };
  }
}

export async function deleteStudioExhibit(
  id: string,
  session: StoredUserSession | null
): Promise<void> {
  setLocalCustomExhibits(getLocalCustomExhibits().filter((item) => item.id !== id));
  cachedRemoteExhibits = cachedRemoteExhibits.filter((item) => item.id !== id);
  window.dispatchEvent(new CustomEvent(EXHIBITS_UPDATED_EVENT));

  const scriptUrl = getSavedSheetScriptUrl();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-admin-email': session?.email || '',
  };
  if (session?.adminPin) headers['x-admin-pin'] = session.adminPin;
  if (session?.googleIdToken) headers.Authorization = `Bearer ${session.googleIdToken}`;

  try {
    await fetch('/api/exhibits', {
      method: 'DELETE',
      headers,
      body: JSON.stringify({
        ownerEmail: session?.email,
        adminPin: session?.adminPin,
        scriptUrl,
        id,
      }),
    });
  } catch {
    // ignore
  }
}

export function useStudioExhibits(): StudioExhibitSample[] {
  const [exhibits, setExhibits] = useState<StudioExhibitSample[]>(() => getMergedExhibits());

  useEffect(() => {
    const sync = () => setExhibits(getMergedExhibits());
    window.addEventListener(EXHIBITS_UPDATED_EVENT, sync);
    window.addEventListener('storage', sync);

    if (!hasFetchedRemote) {
      void refreshExhibitsFromServer(false);
    }

    return () => {
      window.removeEventListener(EXHIBITS_UPDATED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return exhibits;
}

export function searchAllExhibits(
  exhibits: StudioExhibitSample[],
  query: string
): StudioExhibitSample | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;

  return (
    exhibits.find(
      (ex) =>
        ex.code?.toLowerCase() === q ||
        ex.title.toLowerCase().includes(q) ||
        ex.sectionLabel.toLowerCase().includes(q) ||
        ex.summary.toLowerCase().includes(q) ||
        ex.techTags.some((t) => t.toLowerCase().includes(q)) ||
        ex.nodeTitle.toLowerCase().includes(q) ||
        ex.nodeCode === q
    ) || undefined
  );
}
