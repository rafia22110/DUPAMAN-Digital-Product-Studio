import { useEffect, useState } from 'react';
import { STUDIO_EXHIBITS, type StudioExhibitSample } from './studioSamples';

export const STUDIO_OWNER_EMAIL = 'rafiargsnti221169@gmail.com';
export const STUDIO_OWNER_NAME = 'רפאל ארגנטי';
export const STUDIO_SHEET_ID = '1bg7IQTV2QLhiOfN4Dex755wURn4jt7yfMOPLRqDx2u8';
export const STUDIO_SHEET_URL = `https://docs.google.com/spreadsheets/d/${STUDIO_SHEET_ID}/edit`;

export const AUTH_STORAGE_KEY = 'dupaman_user_session_v1';
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
  contentType?: string;
  title: string;
  topic: string;
  summary: string;
  url: string;
  stage?: string;
  siteApproval?: string;
  suggestedNodeCode: StudioExhibitSample['nodeCode'];
  suggestedTags?: string[];
  cardTemplate?: string;
  previewUrl?: string;
}

export interface SheetTagEntry {
  group: string;
  tag: string;
  definition: string;
  usage: string;
  status: string;
}

export interface SheetCounts {
  assets: number;
  content: number;
  tags: number;
  channels: number;
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

export function getHiddenExhibitIds(): Set<string> {
  return new Set(cachedServerHiddenIds);
}

export function getActiveStudioExhibits(): StudioExhibitSample[] {
  const hidden = getHiddenExhibitIds();
  const baseSource = cachedServerExhibits ?? STUDIO_EXHIBITS;
  return baseSource.filter((ex) => !hidden.has(ex.id));
}

export async function refreshExhibitsFromServer(
  includeInbox = false,
  session?: StoredUserSession | null
): Promise<{
  exhibits: StudioExhibitSample[];
  sheetConnected: boolean;
  writeConfigured: boolean;
  authError?: string;
  sheetInbox: SheetInboxRow[];
  tagDictionary: SheetTagEntry[];
  sheetCounts?: SheetCounts;
}> {
  const headers: Record<string, string> = {};
  const activeSession = session ?? getStoredSession();
  if (includeInbox && activeSession?.email) {
    headers['x-admin-email'] = activeSession.email;
    if (activeSession.adminPin) {
      headers['x-admin-pin'] = activeSession.adminPin;
    }
  }

  try {
    const res = await fetch(`/api/exhibits${includeInbox ? '?inbox=1' : ''}`, { headers });
    const data = (await res.json()) as {
      ok?: boolean;
      authError?: boolean;
      error?: string;
      exhibits?: StudioExhibitSample[];
      hiddenIds?: string[];
      sheetConnected?: boolean;
      writeConfigured?: boolean;
      sheetInbox?: SheetInboxRow[];
      tagDictionary?: SheetTagEntry[];
      sheetCounts?: SheetCounts;
    };

    if (res.status === 403 || data.authError) {
      return {
        exhibits: getActiveStudioExhibits(),
        sheetConnected: false,
        writeConfigured: Boolean(data.writeConfigured),
        authError: data.error || 'קוד המנהל אינו תקף.',
        sheetInbox: [],
        tagDictionary: [],
      };
    }

    if (res.ok && data.ok && Array.isArray(data.exhibits)) {
      cachedServerExhibits = data.exhibits;
      cachedServerHiddenIds = data.hiddenIds || [];
      hasFetchedServer = true;
      window.dispatchEvent(new CustomEvent(EXHIBITS_UPDATED_EVENT));
      return {
        exhibits: getActiveStudioExhibits(),
        sheetConnected: Boolean(data.sheetConnected),
        writeConfigured: Boolean(data.writeConfigured),
        sheetInbox: data.sheetInbox || [],
        tagDictionary: data.tagDictionary || [],
        sheetCounts: data.sheetCounts,
      };
    }
  } catch {
    // network error
  }

  return {
    exhibits: getActiveStudioExhibits(),
    sheetConnected: false,
    writeConfigured: false,
    sheetInbox: [],
    tagDictionary: [],
  };
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

    await refreshExhibitsFromServer(false, session);
    return {
      ok: true,
      persistedToSheet: true,
      message: 'האישור נשמר בגיליון החדש והפריט פורסם באתר.',
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
): Promise<{ ok: boolean; message: string }> {
  const isBuiltin = STUDIO_EXHIBITS.some((b) => b.id === exhibit.id);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-admin-email': session?.email || '',
  };
  if (session?.adminPin) headers['x-admin-pin'] = session.adminPin;

  try {
    const res = await fetch('/api/exhibits', {
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
      }),
    });
    const data = (await res.json()) as { ok?: boolean; persistedToSheet?: boolean; error?: string };
    if (!res.ok || !data.ok || !data.persistedToSheet) {
      return {
        ok: false,
        message: data.error || 'הסרת הפריט בגיליון נכשלה. התצוגה לא שונתה.',
      };
    }

    await refreshExhibitsFromServer(false, session);
    return {
      ok: true,
      message: `התוכן "${exhibit.title}" הוסר מהאתר ועודכן בגיליון.`,
    };
  } catch {
    return {
      ok: false,
      message: 'שגיאת רשת בעת הסרת התוכן מהגיליון.',
    };
  }
}

export async function restoreHiddenExhibit(
  exhibitId: string,
  session: StoredUserSession | null
): Promise<{ ok: boolean; message: string }> {
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
        action: 'visibility',
        visibility: 'TRUE',
        id: exhibitId,
        ownerEmail: session?.email,
        adminPin: session?.adminPin,
      }),
    });
    const data = (await res.json()) as { ok?: boolean; persistedToSheet?: boolean; error?: string };
    if (!res.ok || !data.ok || !data.persistedToSheet) {
      return {
        ok: false,
        message: data.error || 'שחזור הפריט בגיליון נכשל.',
      };
    }

    await refreshExhibitsFromServer(false, session);
    return {
      ok: true,
      message: 'הפריט הוחזר לתצוגה באתר ועודכן בגיליון.',
    };
  } catch {
    return {
      ok: false,
      message: 'שגיאת רשת בעת שחזור הפריט.',
    };
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
