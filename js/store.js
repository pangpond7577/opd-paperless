/* =========================================================
 * store.js — เก็บข้อมูลในเครื่อง (localStorage) + ส่งออกไฟล์ + sync Google Sheets
 * ========================================================= */
(function () {
  'use strict';
  var App = window.App = window.App || {};
  App.views = App.views || {};   // แต่ละหน้าจอ (view-*.js) ลงทะเบียนไว้ที่นี่
  var KEY = 'opd-paperless-v1';

  function blank() {
    return {
      appts: [],      // นัดหมายที่พยาบาลลงไว้
      patients: {},   // ข้อมูลผู้ป่วย (key = HN)
      visits: [],     // การมารับบริการแต่ละครั้ง
      settings: { nurse: '', doctor: '', syncUrl: '', syncKey: '' },
      outbox: []      // รายการที่รอส่งขึ้น Google Sheets
    };
  }

  var db;
  try {
    db = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || 'null') || {});
    db.settings = Object.assign(blank().settings, db.settings || {});
  } catch (e) { db = blank(); }
  App.db = db;

  App.save = function () {
    try { localStorage.setItem(KEY, JSON.stringify(db)); return true; }
    catch (e) { App.toast('บันทึกไม่สำเร็จ: พื้นที่เก็บข้อมูลของเบราว์เซอร์เต็มหรือถูกปิด', true); return false; }
  };

  App.uid = function () { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); };

  /* ---------- วันที่ ---------- */
  var TM = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  var TD = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  App.TM = TM;
  App.pad = function (n) { return (n < 10 ? '0' : '') + n; };
  App.iso = function (d) { return d.getFullYear() + '-' + App.pad(d.getMonth() + 1) + '-' + App.pad(d.getDate()); };
  App.today = function () { return App.iso(new Date()); };
  App.parse = function (iso) { var p = String(iso).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); };
  App.thaiDate = function (iso, withDay) {
    if (!iso) return '';
    var d = App.parse(iso);
    return (withDay ? TD[d.getDay()] + ' ' : '') + d.getDate() + ' ' + TM[d.getMonth()] + ' ' + (d.getFullYear() + 543);
  };
  App.addMonths = function (iso, n) {
    var d = App.parse(iso), day = d.getDate();
    d.setDate(1); d.setMonth(d.getMonth() + n);
    var last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(day, last));
    if (d.getDay() === 6) d.setDate(d.getDate() + 2);   // เลี่ยงเสาร์-อาทิตย์
    if (d.getDay() === 0) d.setDate(d.getDate() + 1);
    return App.iso(d);
  };

  /* ---------- ผู้ป่วย / visit ---------- */
  App.fullName = function (p) { return p ? ((p.pre || '') + (p.first || '') + ' ' + (p.last || '')).trim() : ''; };
  App.patient = function (hn) { return db.patients[hn] || null; };
  App.upsertPatient = function (p) {
    var old = db.patients[p.hn] || {};
    db.patients[p.hn] = Object.assign({}, old, p, { updatedAt: new Date().toISOString() });
    return db.patients[p.hn];
  };
  App.visit = function (id) { for (var i = 0; i < db.visits.length; i++) if (db.visits[i].id === id) return db.visits[i]; return null; };
  App.appt = function (id) { for (var i = 0; i < db.appts.length; i++) if (db.appts[i].id === id) return db.appts[i]; return null; };
  App.visitsOf = function (hn) {
    return db.visits.filter(function (v) { return v.hn === hn; })
      .sort(function (a, b) { return (a.date + a.q) < (b.date + b.q) ? -1 : 1; });
  };
  App.nextQueue = function (date) {
    var n = db.visits.filter(function (v) { return v.date === date; }).length + 1;
    return 'E-' + (n < 10 ? '00' : n < 100 ? '0' : '') + n;
  };

  /** สร้าง visit ใหม่ (ออกคิว) */
  App.createVisit = function (info) {
    var date = App.today();
    var v = {
      id: App.uid(), date: date, q: App.nextQueue(date), hn: info.hn, apptId: info.apptId || null,
      age: info.age, sex: info.sex, type: info.type || 'มาตามนัด', mob: info.mob || '', right: info.right || '',
      pdpa: !!info.pdpa, status: 'registered',
      vitals: {}, cc: '', dz: [], dzOther: '', meds: '', alg: '',
      screen: {}, detail: {}, tab: 1, tool: null,
      plan: null, by: db.settings.nurse || '', createdAt: new Date().toISOString(), savedAt: new Date().toISOString()
    };
    db.visits.push(v);
    if (v.apptId) { var a = App.appt(v.apptId); if (a) { a.visitId = v.id; a.status = 'มาแล้ว'; App.sync('appt', a); } }
    App.touch(v);
    return v;
  };

  /** บันทึก visit + ส่ง sync */
  App.touch = function (v) {
    v.savedAt = new Date().toISOString();
    App.save();
    App.sync('visit', v);
  };

  /* ---------- ส่งออกไฟล์ ---------- */
  App.csv = function (rows) {
    var esc = function (v) {
      v = v == null ? '' : String(v);
      if (/^[=+\-@]/.test(v) && !/^-?\d/.test(v)) v = "'" + v;     // กันสูตร Excel
      return /[",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
    };
    return '﻿' + rows.map(function (r) { return r.map(esc).join(','); }).join('\r\n');
  };
  App.download = function (name, text, type) {
    var blob = new Blob([text], { type: type || 'text/csv;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  };
  App.safeName = function (s) { return String(s).replace(/[\\/:*?"<>|\s]+/g, '-'); };

  /* ---------- สำรอง / นำเข้า ---------- */
  App.backup = function () {
    var copy = JSON.parse(JSON.stringify(db)); copy.outbox = [];
    App.download('สำรอง-OPD-ผู้สูงอายุ-' + App.today() + '.json', JSON.stringify(copy, null, 1), 'application/json');
  };
  App.restore = function (text) {
    var d = JSON.parse(text);
    if (!d || !Array.isArray(d.visits) || !Array.isArray(d.appts)) throw new Error('ไฟล์ไม่ใช่ข้อมูลสำรองของแอปนี้');
    var b = blank();
    Object.keys(b).forEach(function (k) { db[k] = d[k] != null ? d[k] : b[k]; });
    db.settings = Object.assign(b.settings, db.settings || {});
    App.save();
  };

  /* ---------- sync Google Sheets (ไม่บังคับ) ---------- */
  var flushing = false;
  App.sync = function (kind, rec, del) {
    if (!db.settings.syncUrl) return;
    db.outbox = db.outbox.filter(function (x) { return !(x.kind === kind && x.id === rec.id); });
    db.outbox.push({ kind: kind, id: rec.id, del: !!del, data: del ? null : rec });
    App.save();
    clearTimeout(App._syncT);
    App._syncT = setTimeout(App.flush, 800);
  };
  App.flush = function () {
    var s = db.settings;
    if (flushing || !s.syncUrl || !db.outbox.length || !navigator.onLine) return Promise.resolve();
    flushing = true;
    var item = db.outbox[0];
    var body = item.del
      ? { action: 'delete', key: s.syncKey, kind: item.kind, id: item.id }
      : { action: 'save', key: s.syncKey, kind: item.kind, id: item.id, savedAt: item.data.savedAt || new Date().toISOString(), row: App.syncRow(item.kind, item.data), json: JSON.stringify(item.data) };
    return fetch(s.syncUrl, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        flushing = false;
        if (!res.ok) { App.syncError = res.error || 'error'; return; }
        App.syncError = '';
        db.outbox.shift(); App.save();
        if (db.outbox.length) return App.flush();
      })
      .catch(function (e) { flushing = false; App.syncError = String(e.message || e); });
  };
  /** คอลัมน์ที่อ่านง่ายใน Google Sheet */
  App.syncRow = function (kind, r) {
    var p = App.patient(r.hn) || r;
    if (kind === 'appt') return { 'วันที่นัด': r.date, 'เวลา': r.time, 'HN': r.hn, 'ชื่อ-สกุล': App.fullName(r), 'อายุ': r.age, 'เตรียมก่อนพบแพทย์': App.prepText(r), 'สถานะ': r.status };
    var ev = App.evaluate(r);
    return { 'วันที่': r.date, 'คิว': r.q, 'HN': r.hn, 'ชื่อ-สกุล': App.fullName(p), 'อายุ': r.age, 'BP': (r.vitals.sys || '') + '/' + (r.vitals.dia || ''),
      'BMI': ev.c.bmiTxt, 'ด้านที่เสี่ยง': ev.riskNames.join(', '), 'ประเมินละเอียด': ev.detailText.join(' | '), 'สถานะ': r.status, 'ผู้บันทึก': r.by };
  };
  window.addEventListener('online', function () { App.flush(); });
})();
