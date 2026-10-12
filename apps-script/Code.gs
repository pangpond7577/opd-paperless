/**
 * ระบบกลาง OPD Paperless คลินิกผู้สูงอายุ (ไม่บังคับใช้)
 * วางโค้ดนี้ใน Google Sheet › ส่วนขยาย › Apps Script แล้ว Deploy เป็น "เว็บแอป"
 * (เรียกใช้ในฐานะ: ฉัน · ผู้มีสิทธิ์เข้าถึง: ทุกคน)
 *
 * ทุกคำขอต้องมีรหัสทีม (ใส่ในหน้า "ตั้งค่า" ของแอป ให้ตรงกับ PASSWORD ด้านล่าง)
 * ข้อมูลแยกเป็น 2 แผ่นงาน: "นัดหมาย" และ "การมารับบริการ"
 */

// ตั้งรหัสทีมตรงนี้ (อย่าใช้รหัสง่าย ๆ และห้ามนำโค้ดที่ใส่รหัสแล้วไปเผยแพร่)
const PASSWORD = 'CHANGE_ME';
const SHEETS = { appt: 'นัดหมาย', visit: 'การมารับบริการ' };

function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents);
    if (PASSWORD === 'CHANGE_ME' || req.key !== PASSWORD) return json_({ ok: false, error: 'รหัสทีมไม่ถูกต้อง' });
    if (!SHEETS[req.kind]) return json_({ ok: false, error: 'bad_kind' });
    if (req.action === 'save') return json_(save_(req));
    if (req.action === 'delete') return json_(remove_(req.kind, String(req.id || '')));
    if (req.action === 'list') return json_(list_(req.kind));
    return json_({ ok: false, error: 'bad_action' });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

// เปิด URL ในเบราว์เซอร์เพื่อทดสอบว่า Deploy สำเร็จ
function doGet() {
  return json_({ ok: true, app: 'opd-paperless' });
}

function save_(req) {
  if (!req.id || !req.row || typeof req.json !== 'string' || req.json.length > 48000) return { ok: false, error: 'bad_request' };
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const keys = Object.keys(req.row);
    const header = ['id', 'บันทึกล่าสุด'].concat(keys, ['json']);
    const sh = sheet_(req.kind, header);
    const row = [String(req.id), String(req.savedAt || '')].concat(keys.map(k => safe_(req.row[k])), [req.json]);
    const r = findRow_(sh, String(req.id));
    if (r > 0) {
      // ถ้าสองเครื่องแก้รายการเดียวกัน เก็บฉบับที่ใหม่กว่า
      const old = String(sh.getRange(r, 2).getValue());
      if (old && req.savedAt && old > req.savedAt) return { ok: true, skipped: true };
      sh.getRange(r, 1, 1, row.length).setValues([row]);
    } else {
      sh.appendRow(row);
    }
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function list_(kind) {
  const sh = sheet_(kind);
  const n = sh.getLastRow();
  if (n < 2) return { ok: true, records: [] };
  const vals = sh.getRange(2, sh.getLastColumn(), n - 1, 1).getValues();
  const records = [];
  vals.forEach(v => { try { records.push(JSON.parse(v[0])); } catch (e) { /* ข้ามแถวที่ถูกแก้ด้วยมือ */ } });
  return { ok: true, records: records };
}

function remove_(kind, id) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sh = sheet_(kind);
    const r = findRow_(sh, id);
    if (r > 0) sh.deleteRow(r);
    return { ok: true };
  } finally {
    lock.releaseLock();
  }
}

function sheet_(kind, header) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const name = SHEETS[kind];
  let sh = ss.getSheetByName(name);
  if (!sh) sh = ss.insertSheet(name);
  if (Array.isArray(header) && sh.getLastRow() === 0) {
    sh.appendRow(header.map(String));
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, header.length).setFontWeight('bold').setBackground('#e5efff');
  }
  return sh;
}

function findRow_(sh, id) {
  const n = sh.getLastRow();
  if (n < 2) return -1;
  const ids = sh.getRange(2, 1, n - 1, 1).getValues();
  for (let i = 0; i < ids.length; i++) if (String(ids[i][0]) === id) return i + 2;
  return -1;
}

// กันข้อความที่ขึ้นต้นด้วย = + @ ไม่ให้กลายเป็นสูตร
function safe_(v) {
  const s = v == null ? '' : String(v);
  return /^[=+@]/.test(s) ? "'" + s : s;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
