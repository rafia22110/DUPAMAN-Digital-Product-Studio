const SHEET_ID = '1ypSdymFV-oufB1YEKzNii9uvm05FwdmzN8K0fBkZxKI';
const CMS_SHEET_NAME = 'Studio_CMS';
const OWNER_EMAIL = 'rafiargsnti221169@gmail.com';

/**
 * Read endpoint used only by the DUPAMAN server. The CMS sheet is already
 * public-read; this endpoint never publishes or changes a row.
 */
function doGet() {
  try {
    const sheet = getCmsSheet_();
    const values = sheet.getDataRange().getDisplayValues();
    if (!values.length) return json_({ ok: true, records: [] });
    const columns = getColumns_(values[0]);
    const records = values.slice(1)
      .filter(row => String(row[columns.id] || '').trim())
      .map(row => rowToRecord_(row, columns));
    return json_({ ok: true, records: records });
  } catch (error) {
    return json_({ ok: false, error: error.message || String(error) });
  }
}

/**
 * Only an authenticated owner request from the site server can write.
 * The delete action is intentionally represented as HIDDEN to preserve history.
 */
function doPost(event) {
  try {
    const payload = JSON.parse(event.postData.contents || '{}');
    const expectedSecret = PropertiesService.getScriptProperties().getProperty('DUPAMAN_WEBHOOK_SECRET') || '';
    if (!expectedSecret || !constantTimeEquals_(String(payload.secret || ''), expectedSecret)) {
      return json_({ ok: false, error: 'Unauthorized' });
    }
    if (String(payload.ownerEmail || '').toLowerCase() !== OWNER_EMAIL) {
      return json_({ ok: false, error: 'Owner only' });
    }

    const sheet = getCmsSheet_();
    const values = sheet.getDataRange().getDisplayValues();
    if (!values.length) throw new Error('Studio_CMS has no header row.');
    const columns = getColumns_(values[0]);
    const action = String(payload.action || 'upsert');
    const exhibit = payload.exhibit || {};
    const id = String(payload.id || exhibit.id || '').trim();
    if (!id) throw new Error('Missing item id.');

    const idColumn = columns.id;
    let rowNumber = values.findIndex((row, index) => index > 0 && String(row[idColumn] || '').trim() === id) + 1;
    if (rowNumber < 2 && action === 'upsert') rowNumber = values.length + 1;
    if (rowNumber < 2) throw new Error('Item not found; no row was changed.');

    const row = rowNumber <= values.length
      ? values[rowNumber - 1].slice()
      : Array(values[0].length).fill('');
    while (row.length < values[0].length) row.push('');

    if (action === 'delete') {
      setCell_(row, columns.visibility, 'HIDDEN');
    } else if (action === 'visibility') {
      setCell_(row, columns.visibility, normalizeVisibility_(payload.visibility));
    } else if (action === 'upsert') {
      setCell_(row, columns.id, id);
      setCell_(row, columns.code, exhibit.code || exhibit.nodeCode || '');
      setCell_(row, columns.nodeCode, exhibit.nodeCode || '');
      setCell_(row, columns.sectionLabel, exhibit.nodeTitle || '');
      setCell_(row, columns.status, exhibit.status || 'מוכן לבדיקה');
      setCell_(row, columns.title, exhibit.title || '');
      setCell_(row, columns.summary, exhibit.summary || '');
      setCell_(row, columns.techTags, Array.isArray(exhibit.techTags) ? exhibit.techTags.join(', ') : (exhibit.techTags || ''));
      setCell_(row, columns.liveUrl, exhibit.url || exhibit.liveUrl || '');
      setCell_(row, columns.liveLabel, exhibit.actionLabel || exhibit.liveLabel || '');
      setCell_(row, columns.githubUrl, exhibit.githubUrl || '');
      setCell_(row, columns.audienceNote, exhibit.audienceNote || '');
      setCell_(row, columns.isEducational, exhibit.isEducational === true ? 'TRUE' : (exhibit.isEducational === false ? 'FALSE' : ''));
      setCell_(row, columns.updatedAt, new Date().toISOString());
      // Publishing is explicit: only the dashboard's final approval sends TRUE.
      setCell_(row, columns.visibility, normalizeVisibility_(payload.visibility));
    } else {
      throw new Error('Unsupported action.');
    }

    sheet.getRange(rowNumber, 1, 1, values[0].length).setValues([row.slice(0, values[0].length)]);
    return json_({ ok: true, id: id });
  } catch (error) {
    return json_({ ok: false, error: error.message || String(error) });
  }
}

function getCmsSheet_() {
  const spreadsheet = SpreadsheetApp.openById(SHEET_ID);
  const sheet = spreadsheet.getSheetByName(CMS_SHEET_NAME);
  if (!sheet) throw new Error('CMS sheet tab not found: ' + CMS_SHEET_NAME);
  return sheet;
}

function normalizeHeader_(value) {
  return String(value || '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
}

function getColumns_(headers) {
  const normalized = headers.map(normalizeHeader_);
  const find = aliases => {
    const terms = aliases.map(normalizeHeader_);
    return normalized.findIndex(header => terms.some(term => header === term || header.includes(term)));
  };
  const columns = {
    id: find(['id', 'מזהה']),
    code: find(['code', 'קוד']),
    nodeCode: find(['nodeCode', 'node code', 'קוד צומת']),
    sectionLabel: find(['sectionLabel', 'section label', 'תווית אזור']),
    status: find(['status', 'סטטוס']),
    title: find(['title', 'כותרת']),
    summary: find(['summary', 'תקציר', 'סיכום']),
    techTags: find(['techTags', 'tech tags', 'תגיות']),
    liveUrl: find(['liveUrl', 'live url', 'url']),
    liveLabel: find(['liveLabel', 'live label', 'תווית קישור']),
    githubUrl: find(['githubUrl', 'github url']),
    audienceNote: find(['audienceNote', 'audience note', 'קהל יעד']),
    isEducational: find(['isEducational', 'is educational', 'חינוכי']),
    updatedAt: find(['updatedAt', 'updated at', 'עודכן בתאריך']),
    visibility: find(['visibility', 'מוצג באתר', 'מוצג בכרטיס', 'פרסום באתר', 'נראות']),
  };
  if (columns.id < 0 || columns.title < 0 || columns.visibility < 0) {
    throw new Error('Studio_CMS needs ID, title, and visibility columns. No row was changed.');
  }
  return columns;
}

function rowToRecord_(row, columns) {
  const value = column => column < 0 ? '' : String(row[column] || '').trim();
  return {
    id: value(columns.id),
    code: value(columns.code),
    nodeCode: value(columns.nodeCode),
    title: value(columns.title),
    summary: value(columns.summary),
    techTags: value(columns.techTags),
    liveUrl: value(columns.liveUrl),
    liveLabel: value(columns.liveLabel),
    githubUrl: value(columns.githubUrl),
    audienceNote: value(columns.audienceNote),
    isEducational: value(columns.isEducational),
    status: value(columns.status),
    visibility: normalizeVisibility_(value(columns.visibility)),
    updatedAt: value(columns.updatedAt),
  };
}

function setCell_(row, column, value) {
  if (column >= 0 && value !== undefined) row[column] = String(value);
}

function normalizeVisibility_(value) {
  const normalized = String(value || '').trim().toUpperCase();
  if (normalized === 'TRUE' || normalized === 'HIDDEN') return normalized;
  return 'FALSE';
}

function constantTimeEquals_(a, b) {
  if (!a || a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
