/**
 * DUPAMAN Studio — מחבר Google Sheets דו-כיווני ללוח הבקרה הפרטי של רפאל ארגנטי
 * גיליון: https://docs.google.com/spreadsheets/d/1ypSdymFV-oufB1YEKzNii9uvm05FwdmzN8K0fBkZxKI/edit?gid=445464849
 * בעלים מורשה בלבד: rafiargsnti221169@gmail.com
 */

const SPREADSHEET_ID = '1ypSdymFV-oufB1YEKzNii9uvm05FwdmzN8K0fBkZxKI';
const CMS_SHEET_NAME = 'Studio_CMS';
const ALLOWED_OWNER_EMAIL = 'rafiargsnti221169@gmail.com';
const OPTIONAL_SECRET = '';

const HEADERS = [
  'id',
  'code',
  'nodeCode',
  'sectionLabel',
  'mediaType',
  'mediaBadge',
  'status',
  'readinessPct',
  'title',
  'summary',
  'highlights',
  'techTags',
  'liveUrl',
  'liveLabel',
  'githubUrl',
  'audienceNote',
  'isEducational',
  'updatedAt',
  'מוצג_באתר',
];

function getOrCreateCmsSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(CMS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(CMS_SHEET_NAME);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
    sheet.setRightToLeft(true);
  }
  return sheet;
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

function doGet() {
  try {
    const sheet = getOrCreateCmsSheet();
    const rows = sheet.getDataRange().getValues();
    if (rows.length <= 1) {
      return jsonOut({ ok: true, records: [] });
    }
    const headers = rows[0];
    const records = rows
      .slice(1)
      .filter((r) => String(r[0] || '').trim() !== '')
      .map((r) => {
        const rec = {};
        headers.forEach((h, idx) => {
          rec[String(h)] = r[idx];
        });
        return rec;
      });
    return jsonOut({ ok: true, records: records });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const ownerEmail = String(payload.ownerEmail || '').trim().toLowerCase();
    if (ownerEmail !== ALLOWED_OWNER_EMAIL) {
      return jsonOut({ ok: false, error: 'גישה מותרת לרפאל ארגנטי בלבד' });
    }
    if (OPTIONAL_SECRET && String(payload.secret || '') !== OPTIONAL_SECRET) {
      return jsonOut({ ok: false, error: 'מפתח אבטחה שגוי' });
    }

    const sheet = getOrCreateCmsSheet();
    const action = String(payload.action || 'upsert');

    if (action === 'delete') {
      const targetId = String(payload.id || '').trim();
      const rows = sheet.getDataRange().getValues();
      for (let i = rows.length - 1; i >= 1; i--) {
        if (String(rows[i][0]) === targetId) {
          sheet.deleteRow(i + 1);
          return jsonOut({ ok: true, deleted: targetId });
        }
      }
      return jsonOut({ ok: false, error: 'השורה לא נמצאה' });
    }

    if (action === 'visibility') {
      const targetId = String(payload.id || '').trim();
      const visState = String(payload.visibility || 'HIDDEN').toUpperCase();
      const rows = sheet.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === targetId) {
          sheet.getRange(i + 1, 19).setValue(visState);
          sheet.getRange(i + 1, 18).setValue(new Date().toISOString());
          return jsonOut({ ok: true, id: targetId, visibility: visState });
        }
      }
      // אם זה פריט בסיס של האתר שעדיין לא קיים בגיליון — מוסיפים שורת בקרה עבורו
      const stub = [
        targetId,
        '',
        String(payload.nodeCode || '01'),
        '',
        '',
        '',
        '',
        100,
        String(payload.title || targetId),
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        'FALSE',
        new Date().toISOString(),
        visState,
      ];
      sheet.appendRow(stub);
      return jsonOut({ ok: true, id: targetId, visibility: visState });
    }

    const ex = payload.exhibit || {};
    const id = String(ex.id || 'cms-' + Date.now());
    const visibility = String(payload.visibility || 'TRUE').toUpperCase();
    const rowValues = [
      id,
      String(ex.code || ''),
      String(ex.nodeCode || '03'),
      String(ex.sectionLabel || ''),
      String(ex.mediaType || 'external'),
      String(ex.mediaBadge || ''),
      String(ex.status || 'מוצר חי'),
      Number(ex.readinessPct || 100),
      String(ex.title || ''),
      String(ex.summary || ''),
      '',
      Array.isArray(ex.techTags) ? ex.techTags.join(', ') : String(ex.techTags || ''),
      String(ex.url || ''),
      String(ex.actionLabel || 'צפה בדמו ↗'),
      '',
      '',
      ex.nodeCode === '03' ? 'TRUE' : 'FALSE',
      new Date().toISOString(),
      visibility,
    ];

    const rows = sheet.getDataRange().getValues();
    let updatedRow = -1;
    for (let i = 1; i < rows.length; i++) {
      if (String(rows[i][0]) === id) {
        updatedRow = i + 1;
        break;
      }
    }

    if (updatedRow > 0) {
      sheet.getRange(updatedRow, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }

    return jsonOut({ ok: true, id: id, updated: updatedRow > 0 });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  }
}
