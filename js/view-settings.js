/* =========================================================
 * หน้า "ตั้งค่า" — ชื่อผู้บันทึก, สำรอง/นำเข้าข้อมูล, Google Sheets
 * ========================================================= */
(function () {
  'use strict';
  var App = window.App, esc = App.esc, I = App.icon;

  App.views.settings = {
    title: 'ตั้งค่า',
    render: function () {
      var s = App.db.settings, db = App.db;
      var size = 0; try { size = (localStorage.getItem('opd-paperless-v1') || '').length; } catch (e) { /* ignore */ }
      return App.header('settings') + '<main class="wrap stack lg">' +
        App.pageHead('gear', '#eceffa', '#454b6b', 'ตั้งค่า', 'ค่าที่ตั้งเก็บไว้ในเครื่องนี้') +
        '<div class="cols"><div class="main-col stack lg">' +
        '<section class="card stack"><div class="card-h">' + App.ico('userplus', 'var(--teal-soft)', '#0b7d71') + '<h2>ผู้ใช้งานเครื่องนี้</h2></div>' +
        '<div class="grid g2"><div><label class="lbl" for="st-nurse">ชื่อพยาบาลผู้บันทึก</label><input class="inp" id="st-nurse" data-f="nurse" value="' + esc(s.nurse) + '"><div class="hint">ใส่ในบันทึกทุก visit ที่ลงทะเบียนจากเครื่องนี้</div></div>' +
        '<div><label class="lbl" for="st-doc">แพทย์ประจำคลินิก (ค่าเริ่มต้น)</label><input class="inp" id="st-doc" data-f="doctor" value="' + esc(s.doctor) + '"></div>' +
        '<div><label class="lbl" for="st-tel">เบอร์โทรคลินิก (แสดงในใบนัด)</label><input class="inp" id="st-tel" data-f="clinicTel" value="' + esc(s.clinicTel || '') + '"></div></div></section>' +

        '<section class="card stack"><div class="card-h">' + App.ico('cloud', 'var(--blue-soft)', '#1f5fd6') + '<div><h2>ระบบกลาง Google Sheets (ไม่บังคับ)</h2>' +
        '<div class="small muted">ส่งข้อมูลนัดและการมารับบริการขึ้น Google Sheet ของหน่วยงาน ดูวิธีตั้งค่าใน README</div></div></div>' +
        '<div><label class="lbl" for="st-url">URL ของเว็บแอป Apps Script (ลงท้าย /exec)</label><input class="inp" id="st-url" data-f="syncUrl" value="' + esc(s.syncUrl) + '" placeholder="https://script.google.com/macros/s/…/exec"></div>' +
        '<div><label class="lbl" for="st-key">รหัสทีม (ตรงกับ PASSWORD ใน Code.gs)</label><input class="inp" type="password" id="st-key" data-f="syncKey" value="' + esc(s.syncKey) + '" autocomplete="off"></div>' +
        '<div class="row"><button class="btn line" data-act="syncAll">' + I('up', null, 18) + 'ส่งข้อมูลทั้งหมดขึ้นระบบกลาง</button>' +
        '<span class="small muted">รอส่ง ' + db.outbox.length + ' รายการ' + (App.syncError ? ' · <span class="err-msg">ผิดพลาด: ' + esc(App.syncError) + '</span>' : '') + '</span></div></section>' +
        '</div>' +

        '<aside class="side-col stack">' +
        '<section class="card accent-yellow stack"><div class="card-h">' + App.ico('down', '#ffb703', '#3d2600') + '<h2>สำรอง / ย้ายข้อมูล</h2></div>' +
        '<div class="small">นัด ' + db.appts.length + ' · ผู้ป่วย ' + Object.keys(db.patients).length + ' · การมารับบริการ ' + db.visits.length + ' ครั้ง<br><span class="muted">ใช้พื้นที่ประมาณ ' + Math.round(size / 1024) + ' KB</span></div>' +
        '<div class="small muted">ข้อมูลเก็บในเบราว์เซอร์ของเครื่องนี้เท่านั้น จะหายถ้าล้างข้อมูลเบราว์เซอร์ ควรกดสำรองข้อมูลทุกสัปดาห์</div>' +
        '<button class="btn primary" data-act="backup">' + I('down', '#fff', 18, 2.2) + 'สำรองข้อมูล (.json)</button>' +
        '<label class="btn line" for="st-file" style="cursor:pointer">' + I('up', null, 18) + 'นำเข้าข้อมูลสำรอง</label>' +
        '<input type="file" id="st-file" accept=".json,application/json" data-f="importFile" hidden></section>' +
        '<section class="card stack"><h3 style="color:#b42318">ล้างข้อมูลทั้งหมด</h3><div class="small muted">ลบข้อมูลทุกอย่างในเครื่องนี้ (สำรองก่อน)</div>' +
        '<button class="btn danger" data-act="wipe">' + I('trash', '#b42318', 18) + 'ล้างข้อมูลในเครื่องนี้</button></section>' +
        '</aside></div></main>';
    },
    field: function (name, val, el, type) {
      if (name === 'importFile') {
        var file = el.files && el.files[0]; if (!file) return false;
        file.text().then(function (text) {
          return App.confirm('นำเข้าข้อมูลสำรอง?', 'ข้อมูลในเครื่องนี้จะถูก<b>แทนที่</b>ด้วยไฟล์ ' + esc(file.name), 'นำเข้า', true).then(function (ok) {
            if (!ok) return;
            App.restore(text); App.toast('นำเข้าข้อมูลแล้ว'); App.render();
          });
        }).catch(function (e) { App.toast('นำเข้าไม่สำเร็จ: ' + e.message, true); });
        return false;
      }
      App.db.settings[name] = String(val).trim();
      if (type === 'change') { App.save(); if (name === 'syncUrl' || name === 'syncKey') App.flush(); return true; }
      return false;
    },
    actions: {
      backup: function () { App.backup(); },
      syncAll: function () {
        if (!App.db.settings.syncUrl) { App.toast('ใส่ URL ของเว็บแอปก่อน', true); return; }
        App.db.appts.forEach(function (a) { App.sync('appt', a); });
        App.db.visits.forEach(function (v) { App.sync('visit', v); });
        App.flush().then(function () { App.render(); App.toast(App.syncError ? 'ส่งไม่สำเร็จ: ' + App.syncError : 'ส่งข้อมูลขึ้นระบบกลางแล้ว', !!App.syncError); });
      },
      wipe: function () {
        App.confirm('ล้างข้อมูลทั้งหมด?', 'นัด ผู้ป่วย และผลประเมินทุกรายการในเครื่องนี้จะถูกลบ และกู้คืนไม่ได้ถ้าไม่ได้สำรองไว้', 'ล้างข้อมูล', true).then(function (ok) {
          if (!ok) return;
          App.restore(JSON.stringify({ appts: [], visits: [], patients: {}, settings: App.db.settings, outbox: [] }));
          App.toast('ล้างข้อมูลแล้ว'); App.render();
        });
      }
    }
  };
})();
