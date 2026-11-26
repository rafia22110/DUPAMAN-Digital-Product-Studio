import { useEffect, useState } from 'react';
import { STUDIO_EXHIBITS, type StudioExhibitSample } from './studioSamples';

export const STUDIO_OWNER_EMAIL = 'rafiargsnti221169@gmail.com';
export const STUDIO_OWNER_NAME = 'רפאל ארגנטי';
export const STUDIO_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1ypSdymFV-oufB1YEKzNii9uvm05FwdmzN8K0fBkZxKI/edit?gid=445464849#gid=445464849';
export const STUDIO_CMS_TAB_URL =
  'https://docs.google.com/spreadsheets/d/1ypSdymFV-oufB1YEKzNii9uvm05FwdmzN8K0fBkZxKI/edit?gid=326580483#gid=326580483';

export const AUTH_STORAGE_KEY = 'dupaman_user_session_v1';
const LOCAL_CMS_EXHIBITS_KEY = 'dupaman_owner_cms_exhibits_v2';
const LOCAL_HIDDEN_IDS_KEY = 'dupaman_owner_hidden_ids_v2';
const LOCAL_SCRIPT_URL_KEY = 'dupaman_owner_sheet_script_url_v1';
const EXHIBITS_UPDATED_EVENT = 'dupaman_exhibits_updated';
const AUTH_UPDATED_EVENT = 'dupaman_auth_updated';

export interface StoredUserSession {
  email: string;
  name: string;
  isOwner?: boolean;
  adminPin?: string;
}

export interface SheetInboxRow {
  id: string;
  tabLabel: string;
  rowIndex: number;
  date: string;
  title: string;
  topic: string;
  summary: string;
  url: string;
  suggestedNodeCode: StudioExhibitSample['nodeCode'];
  suggestedTags?: string[];
}

let cachedServerExhibits: StudioExhibitSample[] | null = null;
let cachedServerHiddenIds: string[] = [];
let hasFetchedServer = false;

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
    // ignore
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

export function getLocalHiddenIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_HIDDEN_IDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

function setLocalHiddenIds(ids: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_HIDDEN_IDS_KEY, JSON.stringify(Array.from(new Set(ids))));
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent(EXHIBITS_UPDATED_EVENT));
}

export function getHiddenExhibitIds(): Set<string> {
  return new Set([...cachedServerHiddenIds, ...getLocalHiddenIds()]);
}

export function getActiveStudioExhibits(): StudioExhibitSample[] {
  const hidden = getHiddenExhibitIds();
  const map = new Map<string, StudioExhibitSample>();

  for (const ex of getLocalCustomExhibits()) {
    if (!hidden.has(ex.id)) {
      map.set(ex.id, ex);
    }
  }

  const baseSource = cachedServerExhibits ?? STUDIO_EXHIBITS;
  for (const ex of baseSource) {
    if (!hidden.has(ex.id) && !map.has(ex.id)) {
      map.set(ex.id, ex);
    }
  }

  return Array.from(map.values());
}

export async function refreshExhibitsFromServer(
  includeInbox = false,
  session?: StoredUserSession | null
): Promise<{
  exhibits: StudioExhibitSample[];
  sheetConnected: boolean;
  writeConfigured: boolean;
  sheetInbox: SheetInboxRow[];
  error?: string;
}> {
  const scriptUrl = getSavedSheetScriptUrl();
  const headers: Record<string, string> = {};
  if (scriptUrl) headers['x-sheet-script-url'] = scriptUrl;
  if (includeInbox && session?.email) headers['x-admin-email'] = session.email;
  if (includeInbox && session?.adminPin) headers['x-admin-pin'] = session.adminPin;

  try {
    const res = await fetch(`/api/exhibits${includeInbox ? '?inbox=1' : ''}`, { headers });
    const data = (await res.json()) as {
      ok?: boolean;
      exhibits?: StudioExhibitSample[];
      hiddenIds?: string[];
      sheetConnected?: boolean;
      writeConfigured?: boolean;
      sheetInbox?: SheetInboxRow[];
      error?: string;
    };
    if (!res.ok || !data.ok || !Array.isArray(data.exhibits)) {
      return {
        exhibits: getActiveStudioExhibits(),
        sheetConnected: false,
        writeConfigured: false,
        sheetInbox: [],
        error: data.error || 'לא ניתן לטעון את הגיליון.',
      };
    }
    cachedServerExhibits = data.exhibits;
    cachedServerHiddenIds = data.hiddenIds || [];
    hasFetchedServer = true;
    window.dispatchEvent(new CustomEvent(EXHIBITS_UPDATED_EVENT));
    return {
      exhibits: getActiveStudioExhibits(),
      sheetConnected: Boolean(data.sheetConnected),
      writeConfigured: Boolean(data.writeConfigured),
      sheetInbox: data.sheetInbox || [],
    };
  } catch {
    return {
      exhibits: getActiveStudioExhibits(),
      sheetConnected: false,
      writeConfigured: false,
      sheetInbox: [],
      error: 'שגיאת תקשורת בטעינת הגיליון.',
    };
  }
}

export async function upsertStudioExhibit(
  exhibit: StudioExhibitSample,
  session: StoredUserSession | null
): Promise<{ ok: boolean; persistedToSheet: boolean; message: string }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-admin-email': session?.email || '',
  };
  if (session?.adminPin) headers['x-admin-pin'] = session.adminPin;

  try {
    const res = await fetch('/api/exhibits', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'upsert',
        visibility: 'TRUE',
        ownerEmail: session?.email,
        adminPin: session?.adminPin,
        exhibit,
      }),
    });
    const data = (await res.json()) as { ok?: boolean; persistedToSheet?: boolean; error?: string };
    if (!res.ok || !data.ok || !data.persistedToSheet) {
      return {
        ok: false,
        persistedToSheet: false,
        message: data.error || 'הגיליון לא עודכן. התוכן לא פורסם.',
      };
    }

    setLocalHiddenIds(getLocalHiddenIds().filter((id) => id !== exhibit.id));
    cachedServerHiddenIds = cachedServerHiddenIds.filter((id) => id !== exhibit.id);
    const existing = getLocalCustomExhibits().filter((item) => item.id !== exhibit.id);
    setLocalCustomExhibits([exhibit, ...existing]);
    await refreshExhibitsFromServer(false);

    return {
      ok: true,
      persistedToSheet: true,
      message: 'האישור נשמר בגיליון והפריט פורסם באתר.',
    };
  } catch {
    return {
      ok: false,
      persistedToSheet: false,
      message: 'לא ניתן להתחבר לשרת. התוכן לא נשמר ולא פורסם.',
    };
  }
}

export async function removeOrHideExhibit(
  exhibit: StudioExhibitSample,
  session: StoredUserSession | null
): Promise<{ message: string }> {
  const isBuiltin = STUDIO_EXHIBITS.some((b) => b.id === exhibit.id);

  // Remove any custom override
  setLocalCustomExhibits(getLocalCustomExhibits().filter((item) => item.id !== exhibit.id));

  // Mark hidden so neither built-in nor sheet row shows on site
  setLocalHiddenIds([...getLocalHiddenIds(), exhibit.id]);

  const scriptUrl = getSavedSheetScriptUrl();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-admin-email': session?.email || '',
  };
  if (session?.adminPin) headers['x-admin-pin'] = session.adminPin;

  try {
    await fetch('/api/exhibits', {
      method: isBuiltin ? 'POST' : 'DELETE',
      headers,
      body: JSON.stringify({
        action: isBuiltin ? 'visibility' : 'delete',
        visibility: 'HIDDEN',
        id: exhibit.id,
        nodeCode: exhibit.nodeCode,
        title: exhibit.title,
        ownerEmail: session?.email,
        adminPin: session?.adminPin,
        scriptUrl,
      }),
    });
  } catch {
    // ignore
  }

  return {
    message: `התוכן "${exhibit.title}" הוסר מהתצוגה באתר.`,
  };
}

export async function restoreHiddenExhibit(
  exhibitId: string,
  session: StoredUserSession | null
): Promise<void> {
  setLocalHiddenIds(getLocalHiddenIds().filter((id) => id !== exhibitId));
  cachedServerHiddenIds = cachedServerHiddenIds.filter((id) => id !== exhibitId);
  window.dispatchEvent(new CustomEvent(EXHIBITS_UPDATED_EVENT));

  const scriptUrl = getSavedSheetScriptUrl();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-admin-email': session?.email || '',
  };
  if (session?.adminPin) headers['x-admin-pin'] = session.adminPin;

  try {
    await fetch('/api/exhibits', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        action: 'visibility',
        visibility: 'TRUE',
        id: exhibitId,
        ownerEmail: session?.email,
        adminPin: session?.adminPin,
        scriptUrl,
      }),
    });
  } catch {
    // ignore
  }
}

export function useStudioExhibits(): StudioExhibitSample[] {
  const [exhibits, setExhibits] = useState<StudioExhibitSample[]>(() => getActiveStudioExhibits());

  useEffect(() => {
    const sync = () => setExhibits(getActiveStudioExhibits());
    window.addEventListener(EXHIBITS_UPDATED_EVENT, sync);
    window.addEventListener('storage', sync);

    if (!hasFetchedServer) {
      void refreshExhibitsFromServer(false);
    }

    return () => {
      window.removeEventListener(EXHIBITS_UPDATED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return exhibits;
}
