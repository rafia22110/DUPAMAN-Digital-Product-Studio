/**
 * DUPAMAN Studio — Google Sheets Live CMS Connector (Apps Script)
 * Spreadsheet: https://docs.google.com/spreadsheets/d/1ypSdymFV-oufB1YEKzNii9uvm05FwdmzN8K0fBkZxKI/edit?gid=445464849
 * Owner: Rafael Argenti (rafiargsnti221169@gmail.com)
 *
 * הוראות התקנה חד-פעמיות (60 שניות):
 * 1. פתח את הגיליון שלך -> תוספים (Extensions) -> Apps Script.
 * 2. הדבק את כל הקוד הזה ושמור (Ctrl+S).
 * 3. לחץ Deploy -> New deployment -> Web app:
 *    - Execute as: Me (rafiargsnti221169@gmail.com)
 *    - Who has access: Anyone
 * 4. העתק את ה-Web App URL והדבק אותו בלוח הבקרה של DUPAMAN (לשונית "חיבור לגיליון") או ב-Vercel תחת DUPAMAN_EXHIBITS_SCRIPT_URL.
 */

const SPREADSHEET_ID = '1ypSdymFV-oufB1YEKzNii9uvm05FwdmzN8K0fBkZxKI';
const CMS_SHEET_NAME = 'Studio_CMS';
const ALLOWED_OWNER_EMAIL = 'rafiargsnti221169@gmail.com';
// אופציונלי: הגדר מפתח סודי זהה ל-DUPAMAN_WEBHOOK_SECRET ב-Vercel
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
      return jsonOut({ ok: true, exhibits: [] });
    }
    const headers = rows[0];
    const exhibits = rows
      .slice(1)
      .filter((r) => String(r[0] || '').trim() !== '' && String(r[8] || '').trim() !== '')
      .map((r) => {
        const rec = {};
        headers.forEach((h, idx) => {
          rec[String(h)] = r[idx];
        });
        return rec;
      });
    return jsonOut({ ok: true, exhibits: exhibits });
  } catch (err) {
    return jsonOut({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const ownerEmail = String(payload.ownerEmail || '').trim().toLowerCase();
    if (ownerEmail !== ALLOWED_OWNER_EMAIL) {
      return jsonOut({ ok: false, error: 'Unauthorized owner account' });
    }
    if (OPTIONAL_SECRET && String(payload.secret || '') !== OPTIONAL_SECRET) {
      return jsonOut({ ok: false, error: 'Invalid secret' });
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
      return jsonOut({ ok: false, error: 'Row not found' });
    }

    const ex = payload.exhibit || {};
    const id = String(ex.id || 'cms-' + Date.now());
    const rowValues = [
      id,
      String(ex.code || ''),
      String(ex.nodeCode || '03'),
      String(ex.sectionLabel || 'מדור חדש'),
      String(ex.mediaType || 'pdf'),
      String(ex.mediaBadge || 'PDF'),
      String(ex.status || 'מוכן להפעלה'),
      Number(ex.readinessPct || 90),
      String(ex.title || ''),
      String(ex.summary || ''),
      Array.isArray(ex.highlights) ? ex.highlights.join(' || ') : String(ex.highlights || ''),
      Array.isArray(ex.techTags) ? ex.techTags.join(', ') : String(ex.techTags || ''),
      String(ex.liveUrl || ex.url || ''),
      String(ex.liveLabel || 'פתיחה'),
      String(ex.githubUrl || ''),
      String(ex.audienceNote || ''),
      Boolean(ex.isEducational) ? 'TRUE' : 'FALSE',
      new Date().toISOString(),
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
