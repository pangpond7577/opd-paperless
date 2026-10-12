/* =========================================================
 * หน้า "นัดหมาย & คิว" — พยาบาลลงนัดรายเดือน ระบบจัดคิวตามเวลานัด
 * ========================================================= */
(function () {
  'use strict';
  var App = window.App, esc = App.esc, I = App.icon;

  var STATUSES = ['นัดไว้', 'มาแล้ว', 'ซักประวัติ/ประเมิน', 'รอพบแพทย์', 'เสร็จ', 'ไม่มาตามนัด'];
  var STATUS_BG = { 'มาแล้ว': 'var(--yellow-soft)', 'ซักประวัติ/ประเมิน': 'var(--purple-soft)', 'รอพบแพทย์': 'var(--blue-soft)', 'เสร็จ': 'var(--teal-soft)', 'ไม่มาตามนัด': 'var(--red-soft)' };
  var TIMES = ['07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '13:00', '13:30', '14:00', '14:30'];

  var t0 = App.parse(App.today());
  var S = { y: t0.getFullYear(), m: t0.getMonth(), sel: App.today(), f: blankForm(App.today()), err: '', editId: null };
  function blankForm(date, time) {
    return { date: date, time: time || '09:00', pre: 'นาง', first: '', last: '', hn: '', age: '', sex: 'หญิง', lab: false, labTxt: '', re: false, reTxt: '', xr: false, xrTxt: '', ekg: false, oth: '' };
  }

  App.apptsOn = function (date) {
    return App.db.appts.filter(function (a) { return a.date === date; })
      .sort(function (a, b) { return a.time === b.time ? (a.createdAt < b.createdAt ? -1 : 1) : (a.time < b.time ? -1 : 1); });
  };

  function opt(list, val) { return list.map(function (x) { return '<option' + (x === val ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join(''); }

  App.views.appts = {
    title: 'นัดหมาย & คิว',
    render: function () {
      var f = S.f, y = S.y, m = S.m;
      var first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
      var count = {};
      App.db.appts.forEach(function (a) { count[a.date] = (count[a.date] || 0) + 1; });
      var prefix = y + '-' + App.pad(m + 1);
      var monthCount = App.db.appts.filter(function (a) { return a.date.indexOf(prefix) === 0; }).length;
      var cells = '';
      for (var i = 0; i < first; i++) cells += '<div></div>';
      for (var d = 1; d <= days; d++) {
        var k = prefix + '-' + App.pad(d), n = count[k] || 0;
        cells += '<button class="day' + (n ? ' has' : '') + (k === App.today() ? ' today' : '') + '" data-act="pickDay" data-d="' + k + '" aria-pressed="' + (k === S.sel) + '" aria-label="' + esc(App.thaiDate(k) + (n ? ' มี ' + n + ' นัด' : '')) + '">' +
          '<span>' + d + '</span>' + (n ? '<span class="pill">' + n + ' นัด</span>' : '') + '</button>';
      }
      var list = App.apptsOn(S.sel);
      var st = { lab: 0, re: 0, xr: 0, ekg: 0, came: 0 };
      list.forEach(function (a) { ['lab', 're', 'xr', 'ekg'].forEach(function (k) { if (a[k]) st[k]++; }); if (a.status !== 'นัดไว้' && a.status !== 'ไม่มาตามนัด') st.came++; });

      var prepHtml = App.PREPS.map(function (p) {
        return '<div class="prep" style="' + (f[p.k] ? 'border-color:' + p.col + '55;background:#fff' : '') + '">' +
          '<label><input type="checkbox" id="ap-' + p.k + '" data-f="' + p.k + '"' + (f[p.k] ? ' checked' : '') + '>' + App.ico(p.ico, p.bg, p.col, 'sm') + p.t + '</label>' +
          (p.ph && f[p.k] ? '<input class="inp" id="ap-' + p.k + 'Txt" data-f="' + p.k + 'Txt" aria-label="รายละเอียด ' + esc(p.t) + '" placeholder="' + esc(p.ph) + '" value="' + esc(f[p.k + 'Txt']) + '">' : '') + '</div>';
      }).join('');

      var rows = list.length ? list.map(function (a, idx) {
        var isToday = a.date === App.today();
        return '<article class="qrow" style="' + (STATUS_BG[a.status] ? 'background:' + STATUS_BG[a.status] : '') + '">' +
          '<div class="qno"><b>A-' + App.pad(idx + 1) + '</b><span class="small muted">' + esc(a.time) + ' น.</span></div>' +
          '<div class="grow stack" style="gap:6px;flex:1 1 260px"><div style="font:700 17px var(--f-head)">' + esc(App.fullName(a)) + '</div>' +
          '<div class="small muted">HN ' + esc(a.hn) + ' · ' + esc(a.age || '–') + ' ปี</div><div class="chips">' + App.prepPills(a) + '</div></div>' +
          '<div class="row noprint" style="gap:8px">' +
          '<label class="tiny muted" style="display:flex;flex-direction:column;gap:2px;font-weight:600">สถานะ<select class="inp" style="min-width:170px;font-size:15px" id="st-' + a.id + '" data-f="status" data-id="' + a.id + '">' + opt(STATUSES, a.status) + '</select></label>' +
          (a.visitId ? '<a class="btn go" href="#/visit/' + a.visitId + '">เปิด visit</a>' : isToday ? '<a class="btn primary" href="#/register">รับคิว</a>' : '') +
          '<button class="btn icon line" data-act="editAppt" data-id="' + a.id + '" aria-label="แก้ไขนัด ' + esc(App.fullName(a)) + '">' + I('edit', '#454b6b', 18) + '</button>' +
          '<button class="btn icon danger" data-act="delAppt" data-id="' + a.id + '" aria-label="ลบนัด ' + esc(App.fullName(a)) + '">' + I('trash', '#c0392b', 18) + '</button>' +
          '</div><span class="print-only">' + esc(a.status) + '</span></article>';
      }).join('') : '<div class="empty">' + I('cal', '#3a86ff', 34) + '<b>ยังไม่มีนัดในวันนี้</b><span>ลงนัดจากฟอร์มด้านซ้าย หรือเลือกวันอื่นในปฏิทิน · คิวเรียงตามเวลานัดให้อัตโนมัติ</span></div>';

      return App.header('appts') + '<main class="wrap stack lg">' +
        App.pageHead('cal', 'var(--blue-soft)', '#1f5fd6', 'นัดหมาย &amp; คิวตามนัด', 'พยาบาลประจำคลินิกลงนัดของแต่ละเดือน แล้วระบบจัดคิวและรายการที่ต้องทำก่อนพบแพทย์ให้',
          '<div class="row noprint">' +
          '<div class="row" style="gap:2px;background:#fff;border:1.5px solid var(--field);border-radius:12px;padding:2px">' +
          '<button class="btn icon" data-act="prevM" aria-label="เดือนก่อน" style="background:transparent">' + I('left') + '</button>' +
          '<strong style="min-width:110px;text-align:center">' + App.TM[m] + ' ' + (y + 543) + '</strong>' +
          '<button class="btn icon" data-act="nextM" aria-label="เดือนถัดไป" style="background:transparent">' + I('right') + '</button></div>' +
          '<button class="btn csv" data-act="csvMonth">' + I('down', null, 18, 2.2) + 'CSV ทั้งเดือน (' + monthCount + ')</button>' +
          '<button class="btn print" data-act="print">' + I('print', null, 18) + 'พิมพ์คิววันนี้</button></div>') +

        '<div class="cols">' +
        '<section class="card side-col stack noprint" aria-labelledby="ap-h">' +
        '<div class="card-h">' + App.ico(S.editId ? 'edit' : 'plus', 'var(--teal-soft)', '#047857') + '<h2 id="ap-h">' + (S.editId ? 'แก้ไขนัด' : 'ลงนัดผู้ป่วย') + '</h2></div>' +
        '<div class="grid g2 keep">' +
        '<div><label class="lbl" for="ap-date">วันที่นัด <span class="req">*</span></label><input type="date" class="inp" id="ap-date" data-f="date" value="' + esc(f.date) + '"></div>' +
        '<div><label class="lbl" for="ap-time">เวลา</label><select class="inp" id="ap-time" data-f="time">' + opt(TIMES, f.time) + '</select></div>' +
        '<div><label class="lbl" for="ap-hn">HN <span class="req">*</span></label><input class="inp" id="ap-hn" data-f="hn" value="' + esc(f.hn) + '" autocomplete="off"><div class="hint">ถ้าเคยมา ระบบเติมชื่อให้</div></div>' +
        '<div><label class="lbl" for="ap-pre">คำนำหน้า</label><select class="inp" id="ap-pre" data-f="pre">' + opt(['นาย', 'นาง', 'นางสาว'], f.pre) + '</select></div>' +
        '<div><label class="lbl" for="ap-first">ชื่อ <span class="req">*</span></label><input class="inp" id="ap-first" data-f="first" value="' + esc(f.first) + '"></div>' +
        '<div><label class="lbl" for="ap-last">สกุล <span class="req">*</span></label><input class="inp" id="ap-last" data-f="last" value="' + esc(f.last) + '"></div>' +
        '<div><label class="lbl" for="ap-age">อายุ (ปี)</label><input class="inp" id="ap-age" data-f="age" inputmode="numeric" value="' + esc(f.age) + '"></div>' +
        '<div><label class="lbl" for="ap-sex">เพศ</label><select class="inp" id="ap-sex" data-f="sex">' + opt(['หญิง', 'ชาย'], f.sex) + '</select></div>' +
        '</div>' +
        '<div style="font:700 15px var(--f-head);color:var(--ink-2)">ต้องทำก่อนพบแพทย์</div>' + prepHtml +
        '<div><label class="lbl" for="ap-oth">อื่น ๆ / หมายเหตุ</label><input class="inp" id="ap-oth" data-f="oth" placeholder="เช่น นำยาเดิมมาด้วย, พบเภสัชกร" value="' + esc(f.oth) + '"></div>' +
        (S.err ? '<div class="err-msg" role="alert">' + esc(S.err) + '</div>' : '') +
        '<div class="row">' + (S.editId ? '<button class="btn line" data-act="cancelEdit">ยกเลิก</button>' : '') +
        '<button class="btn primary big grow" data-act="saveAppt">' + I(S.editId ? 'check' : 'plus', '#fff', 20, 2.4) + (S.editId ? 'บันทึกการแก้ไข' : 'เพิ่มนัด') + '</button></div>' +
        '</section>' +

        '<div class="main-col stack lg">' +
        '<section class="card stack noprint"><div class="cal-head"><span>อา</span><span>จ</span><span>อ</span><span>พ</span><span>พฤ</span><span>ศ</span><span>ส</span></div><div class="cal">' + cells + '</div></section>' +
        '<section class="card stack"><div class="row between"><div class="card-h">' + App.ico('list', 'var(--yellow-soft)', '#b26a00') + '<h2>คิวตามนัด · ' + esc(App.thaiDate(S.sel, true)) + '</h2></div>' +
        '<div class="chips"><span class="pill p-blue">นัด ' + list.length + '</span><span class="pill p-red">เจาะเลือด ' + st.lab + '</span><span class="pill p-purple">ประเมินซ้ำ ' + st.re + '</span>' +
        '<span class="pill p-sky">X-ray ' + st.xr + '</span><span class="pill p-pink">EKG ' + st.ekg + '</span><span class="pill p-teal">มาแล้ว ' + st.came + '</span></div></div>' +
        rows + '</section></div></div></main>';
    },

    field: function (name, val, el, type) {
      if (name === 'status') {
        if (type !== 'change') return false;
        var a = App.appt(el.getAttribute('data-id'));
        if (a) { a.status = val; App.save(); App.sync('appt', a); }
        return true;
      }
      S.f[name] = val;
      S.err = '';
      if (name === 'hn' && type === 'change') {
        var p = App.patient(String(val).trim());
        if (p && !S.f.first) { S.f.pre = p.pre || S.f.pre; S.f.first = p.first; S.f.last = p.last; S.f.age = p.age || ''; S.f.sex = p.sex || S.f.sex; return true; }
      }
      // วาดใหม่เมื่อเปิด/ปิดรายการเตรียม หรือเปลี่ยนวันที่
      return type === 'change' && (typeof val === 'boolean' || name === 'date');
    },

    actions: {
      pickDay: function (el) { S.sel = el.getAttribute('data-d'); if (!S.editId) S.f.date = S.sel; App.render(); },
      prevM: function () { if (S.m === 0) { S.m = 11; S.y--; } else S.m--; App.render(); },
      nextM: function () { if (S.m === 11) { S.m = 0; S.y++; } else S.m++; App.render(); },
      saveAppt: function () {
        var f = S.f;
        ['first', 'last', 'hn', 'age', 'labTxt', 'reTxt', 'xrTxt', 'oth'].forEach(function (k) { f[k] = String(f[k] || '').trim(); });
        if (!f.date || !f.hn || !f.first || !f.last) { S.err = 'กรอก วันที่ HN ชื่อ และสกุล ให้ครบ'; App.render(); return; }
        var rec;
        if (S.editId) {
          rec = App.appt(S.editId);
          Object.assign(rec, f, { updatedAt: new Date().toISOString(), savedAt: new Date().toISOString() });
        } else {
          rec = Object.assign({ id: App.uid(), status: 'นัดไว้', visitId: null, createdAt: new Date().toISOString(), savedAt: new Date().toISOString() }, f);
          App.db.appts.push(rec);
        }
        App.upsertPatient({ hn: f.hn, pre: f.pre, first: f.first, last: f.last, age: f.age, sex: f.sex });
        App.save(); App.sync('appt', rec);
        App.toast((S.editId ? 'แก้ไขนัด ' : 'เพิ่มนัด ') + App.fullName(rec) + ' · ' + App.thaiDate(rec.date) + ' ' + rec.time + ' น.');
        var d = App.parse(f.date);
        S.sel = f.date; S.y = d.getFullYear(); S.m = d.getMonth();
        S.f = blankForm(f.date, f.time); S.editId = null;
        App.render();
        var hn = document.getElementById('ap-hn'); if (hn) hn.focus();
      },
      editAppt: function (el) {
        var a = App.appt(el.getAttribute('data-id')); if (!a) return;
        S.editId = a.id; S.err = '';
        S.f = blankForm(a.date, a.time);
        Object.keys(S.f).forEach(function (k) { if (a[k] != null) S.f[k] = a[k]; });
        App.render(); window.scrollTo(0, 0);
      },
      cancelEdit: function () { S.editId = null; S.f = blankForm(S.sel); App.render(); },
      delAppt: function (el) {
        var a = App.appt(el.getAttribute('data-id')); if (!a) return;
        App.confirm('ลบนัดนี้?', esc(App.fullName(a)) + ' · ' + esc(App.thaiDate(a.date)) + ' ' + esc(a.time) + ' น.', 'ลบนัด', true).then(function (ok) {
          if (!ok) return;
          App.db.appts = App.db.appts.filter(function (x) { return x.id !== a.id; });
          App.save(); App.sync('appt', a, true); App.render();
        });
      },
      csvMonth: function () {
        var prefix = S.y + '-' + App.pad(S.m + 1);
        var list = App.db.appts.filter(function (a) { return a.date.indexOf(prefix) === 0; })
          .sort(function (a, b) { return (a.date + a.time) < (b.date + b.time) ? -1 : 1; });
        if (!list.length) { App.toast('เดือนนี้ยังไม่มีนัด'); return; }
        var rows = [['วันที่นัด', 'เวลา', 'HN', 'คำนำหน้า', 'ชื่อ', 'สกุล', 'อายุ', 'เพศ', 'เจาะเลือด/Lab', 'ประเมินซ้ำ', 'X-ray', 'EKG', 'อื่นๆ', 'สถานะ']];
        list.forEach(function (a) {
          rows.push([App.thaiDate(a.date), a.time, a.hn, a.pre, a.first, a.last, a.age, a.sex, a.lab ? (a.labTxt || 'ใช่') : '', a.re ? (a.reTxt || 'ใช่') : '', a.xr ? (a.xrTxt || 'ใช่') : '', a.ekg ? 'ใช่' : '', a.oth, a.status]);
        });
        App.download('นัดหมาย-' + App.TM[S.m] + (S.y + 543) + '.csv', App.csv(rows));
      }
    }
  };
})();
