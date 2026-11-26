const DEFAULT_SHEET_ID = '1bg7IQTV2QLhiOfN4Dex755wURn4jt7yfMOPLRqDx2u8';
const OWNER_EMAIL = 'rafiargsnti221169@gmail.com';

const ASSETS_SHEET_NAME = 'נכסי סטודיו';
const FALLBACK_ASSETS_SHEET_NAME = 'Studio_CMS';
const CONTENT_SHEET_NAME = 'מאגר תכנים';
const TAGS_SHEET_NAME = 'מילון ותגיות';
const CHANNELS_SHEET_NAME = 'ערוצים ומנויים';

/**
 * Public read-only endpoint called by the DUPAMAN Vercel API.
 * Returns ONLY normalized records from the studio assets tab (נכסי סטודיו).
 * Never exposes private drafts, content library, subscribers, or leads.
 */
function doGet() {
  try {
    const ss = getSpreadsheet_();
    const sheet = getAssetsSheet_(ss);
    const values = sheet.getDataRange().getDisplayValues();
    if (!values.length) {
      return json_({ ok: true, sheetId: ss.getId(), sheetName: sheet.getName(), records: [] });
    }
    const columns = getAssetColumns_(values[0]);
    const records = values
      .slice(1)
      .filter(function (row) {
        return String(row[columns.id] || '').trim() !== '';
      })
      .map(function (row) {
        return assetRowToRecord_(row, columns);
      });
    return json_({
      ok: true,
      sheetId: ss.getId(),
      sheetName: sheet.getName(),
      records: records,
    });
  } catch (error) {
    return json_({ ok: false, error: error.message || String(error) });
  }
}

/**
 * Authenticated server-to-sheet bridge.
 * Every POST requires DUPAMAN_WEBHOOK_SECRET in Script Properties.
 * All CMS/inbox actions also require OWNER_EMAIL.
 */
function doPost(event) {
  try {
    const payload = JSON.parse((event && event.postData && event.postData.contents) || '{}');
    const expectedSecret =
      PropertiesService.getScriptProperties().getProperty('DUPAMAN_WEBHOOK_SECRET') || '';
    if (!expectedSecret || !constantTimeEquals_(String(payload.secret || ''), expectedSecret)) {
      return json_({ ok: false, error: 'Unauthorized' });
    }

    const action = String(payload.action || 'upsert').trim();
    const ss = getSpreadsheet_();

    // Public website subscription (still authenticated by server-side webhook secret)
    if (action === 'subscribe') {
      return handleSubscribe_(ss, payload);
    }

    if (String(payload.ownerEmail || '').trim().toLowerCase() !== OWNER_EMAIL) {
      return json_({ ok: false, error: 'Owner only' });
    }

    if (action === 'ping') {
      return json_({
        ok: true,
        sheetId: ss.getId(),
        sheetName: ss.getName(),
        counts: getSheetCounts_(ss),
      });
    }

    if (action === 'getInbox') {
      return handleGetInbox_(ss);
    }

    if (action === 'upsert' || action === 'visibility' || action === 'delete') {
      return handleAssetMutation_(ss, payload, action);
    }

    return json_({ ok: false, error: 'Unsupported action: ' + action });
  } catch (error) {
    return json_({ ok: false, error: error.message || String(error) });
  }
}

function handleSubscribe_(ss, payload) {
  const sheet = ss.getSheetByName(CHANNELS_SHEET_NAME);
  if (!sheet) {
    return json_({ ok: false, error: 'Tab not found: ' + CHANNELS_SHEET_NAME });
  }
  const email = String(payload.email || '').trim().toLowerCase();
  if (!email) {
    return json_({ ok: false, error: 'Missing email' });
  }
  const name = String(payload.name || '').trim() || email.split('@')[0];
  const topics = Array.isArray(payload.topics)
    ? payload.topics.join(', ')
    : String(payload.topics || 'כללי').trim();
  const source = String(payload.source || 'website').trim();
  const today = Utilities.formatDate(new Date(), 'Asia/Jerusalem', 'yyyy-MM-dd');

  sheet.appendRow([
    'מנוי',
    name,
    email,
    source,
    topics,
    'פעיל',
    today,
    'אתר DUPAMAN',
    '',
  ]);

  return json_({
    ok: true,
    status: 'created',
    id: 'SUB-' + new Date().getTime().toString(36).toUpperCase(),
  });
}

function handleGetInbox_(ss) {
  const inbox = [];

  // 1. Unapproved assets from נכסי סטודיו
  const assetsSheet = getAssetsSheet_(ss);
  const assetValues = assetsSheet.getDataRange().getDisplayValues();
  if (assetValues.length > 1) {
    const cols = getAssetColumns_(assetValues[0]);
    for (var i = 1; i < assetValues.length; i++) {
      var rec = assetRowToRecord_(assetValues[i], cols);
      if (rec.id && rec.title && rec.visibility === 'FALSE') {
        inbox.push({
          id: rec.id,
          sourceTab: assetsSheet.getName(),
          tabLabel: assetsSheet.getName() + ' (ממתין לאישור)',
          rowIndex: i + 1,
          date: rec.updatedAt || '',
          contentType: rec.status || 'נכס סטודיו',
          title: rec.title,
          topic: rec.sectionLabel || '',
          subtopic: '',
          tags: rec.techTags || '',
          summary: rec.summary || rec.title,
          url: rec.liveUrl || '',
          stage: rec.reviewState || 'נדרש אימות בעלים',
          siteApproval: 'לא אושר באתר',
          nodeCode: rec.nodeCode || '',
          cardTemplate: rec.cardTemplate || '',
          previewUrl: rec.previewUrl || '',
        });
      }
    }
  }

  // 2. Unified content library from מאגר תכנים
  const contentSheet = ss.getSheetByName(CONTENT_SHEET_NAME);
  if (contentSheet) {
    const contentValues = contentSheet.getDataRange().getDisplayValues();
    if (contentValues.length > 1) {
      const cCols = getContentColumns_(contentValues[0]);
      for (var r = 1; r < contentValues.length; r++) {
        var row = contentValues[r];
        var title = cellVal_(row, cCols.title);
        if (!title) continue;
        var rowId = cellVal_(row, cCols.id) || 'CONTENT-' + (r + 1);
        inbox.push({
          id: rowId,
          sourceTab: CONTENT_SHEET_NAME,
          tabLabel: CONTENT_SHEET_NAME + ' · ' + (cellVal_(row, cCols.contentType) || 'תוכן'),
          rowIndex: r + 1,
          date: cellVal_(row, cCols.date),
          contentType: cellVal_(row, cCols.contentType) || 'מאמר',
          title: title,
          topic: cellVal_(row, cCols.topic),
          subtopic: cellVal_(row, cCols.subtopic),
          tags: cellVal_(row, cCols.tags),
          summary: cellVal_(row, cCols.summary) || title,
          url: cellVal_(row, cCols.url),
          stage: cellVal_(row, cCols.stage) || 'קליטה',
          siteApproval: cellVal_(row, cCols.siteApproval) || 'לא אושר באתר',
          nodeCode: '',
          cardTemplate: cellVal_(row, cCols.cardTemplate),
          previewUrl: cellVal_(row, cCols.previewUrl),
        });
      }
    }
  }

  // 3. Controlled tag dictionary from מילון ותגיות
  const tags = [];
  const tagsSheet = ss.getSheetByName(TAGS_SHEET_NAME);
  if (tagsSheet) {
    const tagValues = tagsSheet.getDataRange().getDisplayValues();
    for (var t = 1; t < tagValues.length; t++) {
      var group = String(tagValues[t][0] || '').trim();
      var tag = String(tagValues[t][1] || '').trim();
      if (!tag) continue;
      tags.push({
        group: group,
        tag: tag,
        definition: String(tagValues[t][2] || '').trim(),
        usage: String(tagValues[t][3] || '').trim(),
        status: String(tagValues[t][4] || '').trim(),
      });
    }
  }

  return json_({
    ok: true,
    sheetId: ss.getId(),
    sheetName: ss.getName(),
    inbox: inbox,
    tags: tags,
    counts: getSheetCounts_(ss),
  });
}

function handleAssetMutation_(ss, payload, action) {
  const sheet = getAssetsSheet_(ss);
  var values = sheet.getDataRange().getDisplayValues();
  if (!values.length) {
    throw new Error(sheet.getName() + ' has no header row.');
  }

  var headers = values[0].slice();
  var headerChanged = false;
  if (findHeader_(headers, ['קוד צומת', 'nodeCode', 'node code']) < 0) {
    headers.push('קוד צומת');
    headerChanged = true;
  }
  if (findHeader_(headers, ['תווית כפתור', 'liveLabel', 'live label', 'תווית קישור']) < 0) {
    headers.push('תווית כפתור');
    headerChanged = true;
  }
  if (findHeader_(headers, ['תבנית כרטיסייה', 'cardTemplate', 'card template']) < 0) {
    headers.push('תבנית כרטיסייה');
    headerChanged = true;
  }
  if (headerChanged) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    values = sheet.getDataRange().getDisplayValues();
  }

  const columns = getAssetColumns_(headers);
  const exhibit = payload.exhibit || {};
  const id = String(payload.id || exhibit.id || '').trim();
  if (!id) throw new Error('Missing item id.');

  var rowNumber = -1;
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][columns.id] || '').trim() === id) {
      rowNumber = i + 1;
      break;
    }
  }

  const targetVis =
    action === 'delete' ? 'HIDDEN' : normalizeVisibility_(payload.visibility || 'TRUE');
  const displayVis = visibilityToHebrew_(targetVis);
  const nowIso = new Date().toISOString();

  var row;
  if (rowNumber >= 2) {
    row = values[rowNumber - 1].slice();
  } else if (action === 'upsert' || action === 'visibility' || action === 'delete') {
    rowNumber = values.length + 1;
    row = new Array(headers.length).fill('');
    setCell_(row, columns.id, id);
    setCell_(row, columns.title, exhibit.title || payload.title || id);
    setCell_(row, columns.nodeCode, exhibit.nodeCode || payload.nodeCode || '');
  } else {
    throw new Error('Item not found.');
  }
  while (row.length < headers.length) row.push('');

  if (action === 'delete' || action === 'visibility') {
    setCell_(row, columns.visibility, displayVis);
    setCell_(row, columns.updatedAt, nowIso);
    if (columns.reviewState >= 0) {
      setCell_(
        row,
        columns.reviewState,
        targetVis === 'TRUE' ? 'אושר בלוח האתר' : targetVis === 'HIDDEN' ? 'הוסתר מהאתר' : 'נדרש אימות בעלים'
      );
    }
  } else if (action === 'upsert') {
    setCell_(row, columns.id, id);
    if (exhibit.code) setCell_(row, columns.code, exhibit.code);
    setCell_(row, columns.nodeCode, exhibit.nodeCode || '');
    setCell_(row, columns.sectionLabel, exhibit.nodeTitle || '');
    setCell_(row, columns.status, exhibit.status || 'מוצר חי');
    setCell_(row, columns.title, exhibit.title || '');
    setCell_(row, columns.summary, exhibit.summary || '');
    setCell_(
      row,
      columns.techTags,
      Array.isArray(exhibit.techTags) ? exhibit.techTags.join(', ') : String(exhibit.techTags || '')
    );
    setCell_(row, columns.liveUrl, exhibit.url || exhibit.liveUrl || '');
    setCell_(row, columns.liveLabel, exhibit.actionLabel || exhibit.liveLabel || '');
    if (exhibit.cardTemplate) setCell_(row, columns.cardTemplate, exhibit.cardTemplate);
    if (exhibit.githubUrl) setCell_(row, columns.githubUrl, exhibit.githubUrl);
    if (exhibit.audienceNote) setCell_(row, columns.audienceNote, exhibit.audienceNote);
    if (exhibit.nodeCode === '03' || exhibit.isEducational === true) {
      setCell_(row, columns.isEducational, 'TRUE');
    }
    setCell_(row, columns.updatedAt, nowIso);
    setCell_(row, columns.reviewState, targetVis === 'TRUE' ? 'אושר בלוח האתר' : 'בבדיקה');
    setCell_(row, columns.visibility, displayVis);
    if (!row[columns.sourceRef] && columns.sourceRef >= 0) {
      setCell_(row, columns.sourceRef, 'לוח בקרה DUPAMAN');
    }
  }

  sheet.getRange(rowNumber, 1, 1, headers.length).setValues([row.slice(0, headers.length)]);

  // Sync status back to מאגר תכנים if this item originated there
  syncContentLibraryStatus_(ss, id, targetVis);

  return json_({ ok: true, id: id, visibility: targetVis, sheetName: sheet.getName(), rowNumber: rowNumber });
}

function syncContentLibraryStatus_(ss, itemId, visibility) {
  const contentSheet = ss.getSheetByName(CONTENT_SHEET_NAME);
  if (!contentSheet) return;
  const values = contentSheet.getDataRange().getDisplayValues();
  if (values.length <= 1) return;
  const cols = getContentColumns_(values[0]);
  if (cols.id < 0) return;

  for (var i = 1; i < values.length; i++) {
    if (String(values[i][cols.id] || '').trim() === itemId) {
      if (cols.stage >= 0) {
        contentSheet
          .getRange(i + 1, cols.stage + 1)
          .setValue(visibility === 'TRUE' ? 'הועבר ללוח האתר' : 'עריכה');
      }
      if (cols.siteApproval >= 0) {
        contentSheet
          .getRange(i + 1, cols.siteApproval + 1)
          .setValue(visibilityToHebrew_(visibility));
      }
      break;
    }
  }
}

function getSpreadsheet_() {
  const propId =
    PropertiesService.getScriptProperties().getProperty('DUPAMAN_SHEET_ID') || DEFAULT_SHEET_ID;
  return SpreadsheetApp.openById(propId);
}

function getAssetsSheet_(ss) {
  var sheet = ss.getSheetByName(ASSETS_SHEET_NAME);
  if (!sheet) sheet = ss.getSheetByName(FALLBACK_ASSETS_SHEET_NAME);
  if (!sheet) {
    throw new Error('Assets tab not found: ' + ASSETS_SHEET_NAME);
  }
  return sheet;
}

function getSheetCounts_(ss) {
  function countTab(name) {
    var s = ss.getSheetByName(name);
    if (!s) return 0;
    return Math.max(0, s.getLastRow() - 1);
  }
  return {
    assets: countTab(ASSETS_SHEET_NAME) || countTab(FALLBACK_ASSETS_SHEET_NAME),
    content: countTab(CONTENT_SHEET_NAME),
    tags: countTab(TAGS_SHEET_NAME),
    channels: countTab(CHANNELS_SHEET_NAME),
  };
}

function normalizeHeader_(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function findHeader_(headers, aliases) {
  const normalized = headers.map(normalizeHeader_);
  const terms = aliases.map(normalizeHeader_);
  for (var i = 0; i < normalized.length; i++) {
    for (var j = 0; j < terms.length; j++) {
      if (normalized[i] === terms[j] || normalized[i].indexOf(terms[j]) !== -1) {
        return i;
      }
    }
  }
  return -1;
}

function getAssetColumns_(headers) {
  const columns = {
    id: findHeader_(headers, ['מזהה', 'id']),
    code: findHeader_(headers, ['קוד', 'code']),
    nodeCode: findHeader_(headers, ['קוד צומת', 'nodeCode', 'node code']),
    sectionLabel: findHeader_(headers, ['מדור', 'sectionLabel', 'section label', 'תווית אזור']),
    status: findHeader_(headers, ['סטטוס מקור', 'סטטוס', 'status']),
    title: findHeader_(headers, ['כותרת', 'title']),
    summary: findHeader_(headers, ['תקציר', 'סיכום', 'summary']),
    techTags: findHeader_(headers, ['תגיות טכנולוגיה', 'תגיות', 'techTags', 'tech tags']),
    liveUrl: findHeader_(headers, ['כתובת חיה', 'liveUrl', 'live url', 'url']),
    liveLabel: findHeader_(headers, ['תווית כפתור', 'liveLabel', 'live label', 'תווית קישור']),
    githubUrl: findHeader_(headers, ['קישור מקור / Github', 'githubUrl', 'github url']),
    audienceNote: findHeader_(headers, ['קהל יעד', 'audienceNote', 'audience note']),
    isEducational: findHeader_(headers, ['חינוכי', 'isEducational', 'is educational']),
    updatedAt: findHeader_(headers, ['עודכן במקור', 'עודכן בתאריך', 'updatedAt', 'updated at']),
    previewUrl: findHeader_(headers, ['תצוגה מקדימה', 'previewUrl', 'preview']),
    cardTemplate: findHeader_(headers, ['תבנית כרטיסייה', 'cardTemplate', 'card template']),
    reviewState: findHeader_(headers, ['מצב בדיקה חדש', 'מצב בדיקה']),
    visibility: findHeader_(headers, ['אישור באתר', 'מוצג באתר', 'מוצג בכרטיס', 'פרסום באתר', 'visibility', 'נראות']),
    sourceRef: findHeader_(headers, ['מקור ושורה']),
  };
  if (columns.id < 0 || columns.title < 0 || columns.visibility < 0) {
    throw new Error('Assets sheet needs ID, title, and visibility columns.');
  }
  return columns;
}

function getContentColumns_(headers) {
  return {
    id: findHeader_(headers, ['מזהה חדש', 'מזהה', 'id']),
    contentType: findHeader_(headers, ['סוג תוכן', 'סוג']),
    title: findHeader_(headers, ['כותרת', 'title']),
    date: findHeader_(headers, ['תאריך מקור', 'תאריך', 'date']),
    topic: findHeader_(headers, ['תחום', 'נושא', 'topic']),
    subtopic: findHeader_(headers, ['תת-תחום', 'תת תחום', 'subtopic']),
    tags: findHeader_(headers, ['תגיות מקור', 'תגיות', 'tags']),
    summary: findHeader_(headers, ['תקציר / תוכן', 'תקציר', 'summary']),
    url: findHeader_(headers, ['קישור מקור', 'קישור', 'url']),
    stage: findHeader_(headers, ['שלב עבודה', 'stage']),
    siteApproval: findHeader_(headers, ['אישור באתר', 'visibility']),
    cardTemplate: findHeader_(headers, ['תבנית כרטיסייה', 'cardTemplate', 'card template']),
    previewUrl: findHeader_(headers, ['תצוגה מקדימה', 'previewUrl', 'preview']),
  };
}

function cellVal_(row, idx) {
  return idx < 0 ? '' : String(row[idx] || '').trim();
}

function assetRowToRecord_(row, columns) {
  return {
    id: cellVal_(row, columns.id),
    code: cellVal_(row, columns.code),
    nodeCode: cellVal_(row, columns.nodeCode),
    sectionLabel: cellVal_(row, columns.sectionLabel),
    title: cellVal_(row, columns.title),
    summary: cellVal_(row, columns.summary),
    techTags: cellVal_(row, columns.techTags),
    liveUrl: cellVal_(row, columns.liveUrl),
    liveLabel: cellVal_(row, columns.liveLabel),
    githubUrl: cellVal_(row, columns.githubUrl),
    audienceNote: cellVal_(row, columns.audienceNote),
    isEducational: cellVal_(row, columns.isEducational),
    status: cellVal_(row, columns.status),
    reviewState: cellVal_(row, columns.reviewState),
    cardTemplate: cellVal_(row, columns.cardTemplate),
    previewUrl: cellVal_(row, columns.previewUrl),
    visibility: normalizeVisibility_(cellVal_(row, columns.visibility)),
    updatedAt: cellVal_(row, columns.updatedAt),
  };
}

function setCell_(row, column, value) {
  if (column >= 0 && value !== undefined) {
    row[column] = String(value);
  }
}

function normalizeVisibility_(value) {
  const raw = String(value || '').trim();
  const upper = raw.toUpperCase();
  if (upper === 'TRUE' || raw === 'מאושר באתר' || raw === 'אושר באתר' || raw === 'כן') {
    return 'TRUE';
  }
  if (upper === 'HIDDEN' || raw === 'מוסתר' || raw === 'הוסתר מהאתר') {
    return 'HIDDEN';
  }
  return 'FALSE';
}

function visibilityToHebrew_(vis) {
  if (vis === 'TRUE') return 'מאושר באתר';
  if (vis === 'HIDDEN') return 'מוסתר';
  return 'לא אושר באתר';
}

function constantTimeEquals_(a, b) {
  if (!a || a.length !== b.length) return false;
  var difference = 0;
  for (var i = 0; i < a.length; i++) {
    difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return difference === 0;
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(
    ContentService.MimeType.JSON
  );
}
