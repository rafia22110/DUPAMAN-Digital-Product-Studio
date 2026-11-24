export interface ResolvedMediaLinks {
  embedUrl: string | null;
  embedKind: 'slides' | 'sheets' | 'docs-pdf' | 'youtube' | 'iframe' | 'external-only';
  directDownloadUrl: string | null;
  downloadLabel: string;
  openUrl: string | null;
}

/**
 * Converts Google Slides, Google Docs, Google Sheets, Google Drive PDFs, YouTube videos,
 * and live web apps into real live embed URLs and direct PDF download links.
 */
export function resolveExhibitMedia(rawUrl?: string): ResolvedMediaLinks {
  const url = (rawUrl || '').trim();
  if (!url) {
    return {
      embedUrl: null,
      embedKind: 'external-only',
      directDownloadUrl: null,
      downloadLabel: 'הורדת תקציר',
      openUrl: null,
    };
  }

  // 1. Google Slides -> real interactive embed + direct PDF export!
  const slidesMatch = url.match(/docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/);
  if (slidesMatch?.[1]) {
    const id = slidesMatch[1];
    return {
      embedUrl: `https://docs.google.com/presentation/d/${id}/embed?start=false&loop=false&delayms=3000`,
      embedKind: 'slides',
      directDownloadUrl: `https://docs.google.com/presentation/d/${id}/export/pdf`,
      downloadLabel: 'הורדה כ-PDF',
      openUrl: url,
    };
  }

  // 2. Google Docs -> real embedded preview + direct PDF export!
  const docsMatch = url.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (docsMatch?.[1]) {
    const id = docsMatch[1];
    return {
      embedUrl: `https://docs.google.com/document/d/${id}/preview`,
      embedKind: 'docs-pdf',
      directDownloadUrl: `https://docs.google.com/document/d/${id}/export?format=pdf`,
      downloadLabel: 'הורדה כ-PDF',
      openUrl: url,
    };
  }

  // 3. Google Sheets -> real embedded preview + direct PDF export!
  const sheetsMatch = url.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (sheetsMatch?.[1]) {
    const id = sheetsMatch[1];
    return {
      embedUrl: `https://docs.google.com/spreadsheets/d/${id}/preview`,
      embedKind: 'sheets',
      directDownloadUrl: `https://docs.google.com/spreadsheets/d/${id}/export?format=pdf`,
      downloadLabel: 'הורדה כ-PDF',
      openUrl: url,
    };
  }

  // 4. Google Drive file (PDF / video / slides) -> real Drive preview + direct download!
  const driveFileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (driveFileMatch?.[1]) {
    const id = driveFileMatch[1];
    return {
      embedUrl: `https://drive.google.com/file/d/${id}/preview`,
      embedKind: 'docs-pdf',
      directDownloadUrl: `https://drive.google.com/uc?export=download&id=${id}`,
      downloadLabel: 'הורדת קובץ',
      openUrl: url,
    };
  }

  // 5. Direct .pdf URL -> native iframe PDF viewer + direct download
  if (/\.pdf(\?.*)?$/i.test(url)) {
    return {
      embedUrl: url,
      embedKind: 'docs-pdf',
      directDownloadUrl: url,
      downloadLabel: 'הורדת PDF',
      openUrl: url,
    };
  }

  // 6. YouTube video watch / short URL -> real YouTube embed player
  const ytWatch =
    url.match(/youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/) ||
    url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/) ||
    url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/);
  if (ytWatch?.[1]) {
    const vid = ytWatch[1];
    return {
      embedUrl: `https://www.youtube.com/embed/${vid}?rel=0`,
      embedKind: 'youtube',
      directDownloadUrl: null,
      downloadLabel: 'הורדת תקציר',
      openUrl: url,
    };
  }

  // 7. Hosts known to forbid iframe embedding (NotebookLM, YouTube channels, GitHub)
  if (
    url.includes('notebooklm.google.com') ||
    url.includes('youtube.com/@') ||
    url.includes('github.com')
  ) {
    return {
      embedUrl: null,
      embedKind: 'external-only',
      directDownloadUrl: null,
      downloadLabel: 'הורדת תקציר',
      openUrl: url,
    };
  }

  // 8. Standard HTTPS live web app (e.g. concerned-citizens.vercel.app) -> real live iframe!
  if (url.startsWith('https://')) {
    return {
      embedUrl: url,
      embedKind: 'iframe',
      directDownloadUrl: null,
      downloadLabel: 'הורדת תקציר',
      openUrl: url,
    };
  }

  return {
    embedUrl: null,
    embedKind: 'external-only',
    directDownloadUrl: null,
    downloadLabel: 'הורדת תקציר',
    openUrl: url,
  };
}

export function buildWhatsAppShareUrl(title: string, summary: string, url?: string): string {
  const target = url || 'https://dupaman.vercel.app/';
  const text = `${title}\n${summary}\n${target}`;
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
