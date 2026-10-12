/* =========================================================
 * หน้า "ลงทะเบียน" — นัดของวันนี้ (กดชื่อออกคิว) + กรอกเองสำหรับ walk-in / ส่งต่อ
 * ========================================================= */
(function () {
  'use strict';
  var App = window.App, esc = App.esc, I = App.icon;

  var TYPES = [['มาตามนัด', '#3a86ff'], ['Walk-in', '#ffb703'], ['ส่งต่อจาก รพ.สต.', '#8b5cf6']];
  var MOB = ['เดินได้เอง', 'ใช้ไม้เท้า/walker', 'รถเข็น', 'เปลนอน'];
  var RIGHTS = ['UC (บัตรทอง)', 'ข้าราชการ', 'ประกันสังคม', 'อื่น ๆ'];
  function blank() { return { pre: 'นาง', first: '', last: '', hn: '', age: '', sex: 'หญิง', cg: '', tel: '', type: 'Walk-in', mob: 'เดินได้เอง', right: 'UC (บัตรทอง)', pdpa: false }; }
  var S = { f: blank(), err: '', editAppt: null, lastVisit: null };

  function opt(list, val) { return list.map(function (x) { return '<option' + (x === val ? ' selected' : '') + '>' + esc(x) + '</option>'; }).join(''); }

  /** ออกคิวจาก visit info แล้วจำไว้แสดงบัตรคิว */
  function issue(info) {
    App.upsertPatient({ hn: info.hn, pre: info.pre, first: info.first, last: info.last, age: info.age, sex: info.sex, cg: info.cg, tel: info.tel, right: info.right, pdpa: info.pdpa || undefined });
    var v = App.createVisit(info);
    S.lastVisit = v.id;
    App.toast('ออกคิว ' + v.q + ' · ' + App.fullName(info));
    return v;
  }

  App.views.register = {
    title: 'ลงทะเบียน',
    render: function () {
      var today = App.today(), f = S.f;
      var appts = App.apptsOn(today);
      var came = appts.filter(function (a) { return a.visitId; }).length;
      var visits = App.db.visits.filter(function (v) { return v.date === today; }).sort(function (a, b) { return a.q < b.q ? 1 : -1; });
      var lv = S.lastVisit && App.visit(S.lastVisit);
      var lp = lv && App.patient(lv.hn);

      var apptRows = appts.length ? appts.map(function (a, i) {
        var v = a.visitId && App.visit(a.visitId);
        return '<div class="qrow' + (v ? ' done' : '') + '" style="' + (S.editAppt === a.id ? 'border-color:var(--blue);background:#f5f9ff' : '') + '">' +
          '<div class="qno"><b>A-' + App.pad(i + 1) + '</b><span class="small muted">' + esc(a.time) + ' น.</span></div>' +
          '<button class="namebtn" data-act="' + (v ? 'openVisit' : 'issueAppt') + '" data-id="' + a.id + '" aria-label="' + (v ? 'เปิดการซักประวัติ ' : 'ออกคิวให้ ') + esc(App.fullName(a)) + '">' +
          '<span class="nm">' + esc(App.fullName(a)) + '</span><span class="small muted">HN ' + esc(a.hn) + ' · ' + esc(a.age || '–') + ' ปี</span>' +
          '<span class="chips">' + App.prepPills(a) + '</span></button>' +
          (v ? '<div class="row" style="gap:8px"><span class="pill p-teal" style="font-size:15px;padding:6px 12px">คิว ' + esc(v.q) + '</span>' +
            '<a class="btn go" href="#/visit/' + v.id + '">ส่งซักประวัติ ' + I('arrow', '#fff', 18) + '</a></div>'
            : '<div class="row" style="gap:6px"><button class="btn line sm" data-act="editAppt" data-id="' + a.id + '">แก้ไขข้อมูล</button>' +
            '<button class="btn primary" data-act="issueAppt" data-id="' + a.id + '">ออกคิว</button></div>') +
          '</div>';
      }).join('') : '<div class="empty">' + I('cal', '#3a86ff', 30) + '<b>วันนี้ยังไม่มีนัด</b><span>ลงนัดได้ที่หน้า <a href="#/appts">นัดหมาย &amp; คิว</a> · ผู้ป่วยที่ไม่มีนัดใช้ฟอร์มด้านล่าง</span></div>';

      return App.header('register') + '<main class="wrap"><div class="cols">' +
        '<div class="main-col stack lg noprint">' +
        App.pageHead('userplus', 'var(--teal-soft)', '#0b7d71', 'ลงทะเบียนผู้ป่วย', 'กดชื่อผู้ป่วยนัดเพื่อออกคิวทันที · ผู้ป่วยไม่มีนัดกรอกเองด้านล่าง') +

        '<section class="card accent-blue stack"><div class="row between"><div class="card-h">' + App.ico('cal', '#3a86ff', '#fff') +
        '<div><h2>ผู้ป่วยนัดวันนี้ · ' + esc(App.thaiDate(today, true)) + '</h2><div class="small muted">ดึงจากหน้านัดหมาย &amp; คิว</div></div></div>' +
        '<div class="chips"><span class="pill p-blue">นัด ' + appts.length + '</span><span class="pill p-teal">มาแล้ว ' + came + '</span><span class="pill p-yellow">ยังไม่มา ' + (appts.length - came) + '</span></div></div>' +
        apptRows + '</section>' +

        '<section class="card stack" aria-labelledby="rg-h"><div class="card-h">' + App.ico('card', 'var(--blue-soft)', '#1f5fd6') +
        '<div><h2 id="rg-h">ข้อมูลผู้ป่วย</h2><div class="small muted">' + (S.editAppt ? 'กำลังแก้ไขข้อมูลผู้ป่วยนัด — ตรวจสอบแล้วกด “บันทึก &amp; ออกคิว”' : 'สำหรับผู้ป่วย walk-in / ส่งต่อ ที่ไม่มีในรายการนัด') + '</div></div></div>' +
        '<div class="grid g6">' +
        '<div class="span2"><label class="lbl" for="rg-hn">HN <span class="req">*</span></label><input class="inp" id="rg-hn" data-f="hn" value="' + esc(f.hn) + '" autocomplete="off"><div class="hint">ถ้าเคยมา ระบบเติมข้อมูลให้</div></div>' +
        '<div><label class="lbl" for="rg-pre">คำนำหน้า</label><select class="inp" id="rg-pre" data-f="pre">' + opt(['นาย', 'นาง', 'นางสาว'], f.pre) + '</select></div>' +
        '<div class="span3"><label class="lbl" for="rg-first">ชื่อ <span class="req">*</span></label><input class="inp" id="rg-first" data-f="first" value="' + esc(f.first) + '"></div>' +
        '<div class="span3"><label class="lbl" for="rg-last">สกุล <span class="req">*</span></label><input class="inp" id="rg-last" data-f="last" value="' + esc(f.last) + '"></div>' +
        '<div><label class="lbl" for="rg-age">อายุ (ปี) <span class="req">*</span></label><input class="inp" id="rg-age" data-f="age" inputmode="numeric" value="' + esc(f.age) + '"></div>' +
        '<div class="span2"><label class="lbl" for="rg-sex">เพศ</label><select class="inp" id="rg-sex" data-f="sex">' + opt(['หญิง', 'ชาย'], f.sex) + '</select></div>' +
        '<div class="span3"><label class="lbl" for="rg-cg">ผู้ดูแล / ญาติที่มาด้วย</label><input class="inp" id="rg-cg" data-f="cg" value="' + esc(f.cg) + '" placeholder="เช่น บุตรสาว"></div>' +
        '<div class="span3"><label class="lbl" for="rg-tel">เบอร์โทรติดต่อ</label><input class="inp" id="rg-tel" data-f="tel" inputmode="tel" value="' + esc(f.tel) + '"></div>' +
        '</div>' +
        '<div class="lbl" style="margin:0">ประเภทการมา</div><div class="grid g3" role="group" aria-label="ประเภทการมา">' +
        TYPES.map(function (t) { return '<button class="choice" data-act="type" data-v="' + esc(t[0]) + '" aria-pressed="' + (f.type === t[0]) + '"><span class="dot" style="background:' + t[1] + '"></span>' + esc(t[0]) + '</button>'; }).join('') + '</div>' +
        '<div class="grid g2"><div><label class="lbl" for="rg-mob">การเคลื่อนไหว</label><select class="inp" id="rg-mob" data-f="mob">' + opt(MOB, f.mob) + '</select></div>' +
        '<div><label class="lbl" for="rg-right">สิทธิการรักษา</label><select class="inp" id="rg-right" data-f="right">' + opt(RIGHTS, f.right) + '</select></div></div>' +
        '<label class="chk' + (f.pdpa ? ' on' : '') + '"><input type="checkbox" id="rg-pdpa" data-f="pdpa"' + (f.pdpa ? ' checked' : '') + '>ผู้ป่วย/ญาติยินยอมให้บันทึกข้อมูลสุขภาพเพื่อการดูแลรักษา และส่งออกไฟล์แนบเวชระเบียนของโรงพยาบาล (PDPA)</label>' +
        (S.err ? '<div class="err-msg" role="alert">' + esc(S.err) + '</div>' : '') +
        '<div class="row end"><button class="btn line" data-act="clear">ล้างแบบฟอร์ม</button>' +
        '<button class="btn primary big" data-act="issueForm">' + I('check', '#fff', 20, 2.4) + 'บันทึก &amp; ออกคิว</button></div></section></div>' +

        '<aside class="side-col stack">' +
        '<section class="card accent-teal stack" style="align-items:center;text-align:center">' +
        '<div class="small muted" style="font-weight:600">บัตรคิว · คลินิกผู้สูงอายุ รพ.บ้านกรวด</div>' +
        '<div style="font:700 60px var(--f-head);color:var(--primary);line-height:1">' + (lv ? esc(lv.q) : '—') + '</div>' +
        '<div style="font:700 18px var(--f-head)">' + (lv ? esc(App.fullName(lp)) : 'ยังไม่ได้ออกคิว') + '</div>' +
        '<div class="small muted">' + (lv ? 'HN ' + esc(lv.hn) + ' · ' + esc(lv.age) + ' ปี · ' + esc(lv.type) : 'กดชื่อผู้ป่วยนัด หรือกรอกฟอร์มแล้วกดออกคิว') + '</div>' +
        '<div class="small muted">' + esc(App.thaiDate(today, true)) + '</div>' +
        (lv ? '<div class="row noprint" style="justify-content:center"><button class="btn print" data-act="print">' + I('print', null, 18) + 'พิมพ์บัตรคิว</button>' +
          '<a class="btn go" href="#/visit/' + lv.id + '">ส่งซักประวัติ ' + I('arrow', '#fff', 18) + '</a></div>' : '') +
        '</section>' +
        '<section class="card stack noprint"><div class="row between"><h3>ลงทะเบียนวันนี้ (' + visits.length + ')</h3>' +
        '<button class="btn csv sm" data-act="csv">' + I('down', null, 16, 2.2) + 'CSV</button></div>' +
        (visits.length ? visits.map(function (v) {
          var p = App.patient(v.hn) || {};
          return '<a href="#/visit/' + v.id + '" class="row" style="gap:10px;padding:8px 10px;border-radius:12px;background:var(--soft);text-decoration:none;color:inherit">' +
            '<span class="pill p-teal">' + esc(v.q) + '</span><span class="grow"><b>' + esc(App.fullName(p)) + '</b><br><span class="tiny muted">HN ' + esc(v.hn) + ' · ' + esc(v.type) + ' · ' + statusText(v) + '</span></span></a>';
        }).join('') : '<div class="empty" style="padding:16px">ยังไม่มีผู้ป่วยลงทะเบียน</div>') +
        '</section></aside></div></main>';
    },

    field: function (name, val, el, type) {
      S.f[name] = val; S.err = '';
      if (name === 'hn' && type === 'change') {
        var p = App.patient(String(val).trim());
        if (p) { ['pre', 'first', 'last', 'age', 'sex', 'cg', 'tel', 'right'].forEach(function (k) { if (p[k]) S.f[k] = p[k]; }); if (p.pdpa) S.f.pdpa = true; return true; }
      }
      return name === 'pdpa';
    },

    actions: {
      type: function (el) { S.f.type = el.getAttribute('data-v'); App.render(); },
      clear: function () { S.f = blank(); S.err = ''; S.editAppt = null; App.render(); },
      openVisit: function (el) { var a = App.appt(el.getAttribute('data-id')); if (a && a.visitId) App.go('#/visit/' + a.visitId); },
      editAppt: function (el) {
        var a = App.appt(el.getAttribute('data-id')); if (!a) return;
        var p = App.patient(a.hn) || {};
        S.editAppt = a.id; S.err = '';
        S.f = Object.assign(blank(), { pre: a.pre, first: a.first, last: a.last, hn: a.hn, age: a.age, sex: a.sex, cg: p.cg || '', tel: p.tel || '', right: p.right || 'UC (บัตรทอง)', type: 'มาตามนัด', pdpa: !!p.pdpa });
        App.render();
        var el2 = document.getElementById('rg-first'); if (el2) { el2.scrollIntoView({ block: 'center' }); el2.focus(); }
      },
      issueAppt: function (el) {
        var a = App.appt(el.getAttribute('data-id')); if (!a || a.visitId) return;
        var p = App.patient(a.hn) || {};
        var go = function () {
          var v = issue({ hn: a.hn, pre: a.pre, first: a.first, last: a.last, age: a.age, sex: a.sex, cg: p.cg, tel: p.tel, right: p.right, type: 'มาตามนัด', pdpa: true, apptId: a.id, mob: p.mob });
          App.go('#/visit/' + v.id);
        };
        if (p.pdpa) { go(); return; }
        // ยังไม่เคยให้ความยินยอม → ถามก่อนครั้งแรก
        App.confirm('ขอความยินยอม (PDPA)', '<p>' + esc(App.fullName(a)) + ' · HN ' + esc(a.hn) + '</p><p>ผู้ป่วย/ญาติยินยอมให้บันทึกข้อมูลสุขภาพเพื่อการดูแลรักษา และส่งออกไฟล์แนบเวชระเบียนของโรงพยาบาล</p>', 'ยินยอม & ออกคิว')
          .then(function (ok) { if (ok) go(); });
      },
      issueForm: function () {
        var f = S.f;
        ['first', 'last', 'hn', 'age', 'cg', 'tel'].forEach(function (k) { f[k] = String(f[k] || '').trim(); });
        if (!f.first || !f.last || !f.hn || !f.age) { S.err = 'กรอก HN ชื่อ สกุล และอายุ ให้ครบก่อนออกคิว'; App.render(); return; }
        if (!/^\d{1,3}$/.test(f.age)) { S.err = 'อายุต้องเป็นตัวเลข'; App.render(); return; }
        if (!f.pdpa) { S.err = 'ขอความยินยอม (PDPA) จากผู้ป่วย/ญาติก่อนออกคิว'; App.render(); return; }
        var apptId = null;
        if (S.editAppt) {
          var a = App.appt(S.editAppt);
          if (a) { Object.assign(a, { pre: f.pre, first: f.first, last: f.last, hn: f.hn, age: f.age, sex: f.sex }); apptId = a.id; }
        }
        issue(Object.assign({}, f, { apptId: apptId, type: apptId ? 'มาตามนัด' : f.type }));
        S.f = blank(); S.editAppt = null;
        App.render(); window.scrollTo(0, 0);
      },
      csv: function () {
        var today = App.today();
        var visits = App.db.visits.filter(function (v) { return v.date === today; }).sort(function (a, b) { return a.q < b.q ? -1 : 1; });
        if (!visits.length) { App.toast('วันนี้ยังไม่มีผู้ลงทะเบียน'); return; }
        var rows = [['วันที่', 'คิว', 'HN', 'คำนำหน้า', 'ชื่อ', 'สกุล', 'อายุ', 'เพศ', 'ประเภทการมา', 'การเคลื่อนไหว', 'สิทธิ', 'ผู้ดูแล', 'เบอร์โทร', 'ยินยอม PDPA', 'สถานะ']];
        visits.forEach(function (v) {
          var p = App.patient(v.hn) || {};
          rows.push([App.thaiDate(v.date), v.q, v.hn, p.pre, p.first, p.last, v.age, v.sex, v.type, v.mob, v.right, p.cg, p.tel, v.pdpa ? 'ใช่' : 'ไม่', statusText(v)]);
        });
        App.download('ลงทะเบียน-' + App.safeName(App.thaiDate(today)) + '.csv', App.csv(rows));
      }
    }
  };

  function statusText(v) { return { registered: 'รอซักประวัติ', assess: 'ซักประวัติ/ประเมิน', plan: 'รอพบแพทย์', done: 'เสร็จ' }[v.status] || v.status; }
  App.statusText = statusText;
})();
