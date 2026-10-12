/* =========================================================
 * หน้า "แผนการดูแล ส่งต่อ & นัด" + หน้าใบนัด (slip)
 * ========================================================= */
(function () {
  'use strict';
  var App = window.App, esc = App.esc, I = App.icon;
  var TIMES = ['07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '13:00', '13:30', '14:00', '14:30'];

  /** สร้างแผนครั้งแรก โดยเลือกรายการที่ระบบแนะนำไว้ให้ก่อน */
  function ensurePlan(v) {
    if (v.plan) return v.plan;
    var e = App.evaluate(v);
    v.plan = {
      refs: App.REFERRALS.filter(function (r) { return r.when(e); }).map(function (r) { return r.id; }),
      refOther: '',
      edus: App.EDUS.filter(function (r) { return r.when(e); }).map(function (r) { return r.id; }),
      eduNote: '', note: '', doctor: App.db.settings.doctor || '',
      next: { on: true, date: App.addMonths(v.date, 3), time: '09:00', lab: false, labTxt: '', re: false, reTxt: '', xr: false, xrTxt: '', ekg: false, oth: 'นำยาที่ใช้อยู่ทุกตัวมาด้วย' },
      apptId: null
    };
    return v.plan;
  }

  function summary(v, e) {
    var p = App.patient(v.hn) || {}, vt = v.vitals;
    var dz = (v.dz || []).concat(v.dzOther ? [v.dzOther] : []);
    var lines = [];
    lines.push((v.sex === 'ชาย' ? 'ชาย' : 'หญิง') + 'ไทย ' + v.age + ' ปี' + (dz.length ? ' ' + dz.join(', ') : '') + ' ' + v.type +
      (vt.sys ? ' · BP ' + vt.sys + '/' + vt.dia + (e.c.bpHigh ? ' (สูง)' : '') : '') + (e.c.bmiTxt ? ' · BMI ' + e.c.bmiTxt : '') + (v.meds ? ' · ยาประจำ ' + v.meds + ' ชนิด' : ''));
    if (v.cc) lines.push('อาการสำคัญ: ' + v.cc);
    lines.push('ประเมินเบื้องต้น 13 ข้อ: ' + (e.riskCount ? 'เสี่ยง ' + e.riskCount + ' ด้าน — ' + e.riskNames.join(', ') : 'ไม่พบด้านที่เสี่ยง') +
      (e.answered < e.total ? ' (ตอบ ' + e.answered + '/' + e.total + ' ข้อ)' : ''));
    if (e.detailText.length) lines.push('ประเมินละเอียด: ' + e.detailText.join(' · '));
    return { text: lines.join('\n'), name: App.fullName(p) };
  }

  function check(list, ids, act, e) {
    return list.map(function (r) {
      var on = ids.indexOf(r.id) >= 0, sug = r.when(e);
      return '<label class="chk' + (on ? ' on' : '') + '"><input type="checkbox" id="' + act + '-' + r.id + '" data-f="' + act + '" data-id="' + r.id + '"' + (on ? ' checked' : '') + '>' +
        '<span>' + esc(r.t) + (sug ? ' <span class="pill p-blue" style="font-size:11px">แนะนำ</span>' : '') + '</span></label>';
    }).join('');
  }

  App.views.plan = {
    title: 'แผนการดูแล',
    render: function (id) {
      var v = App.visit(id);
      if (!v) return App.header() + '<main class="wrap"><div class="empty"><b>ไม่พบข้อมูล</b><a class="btn primary" href="#/register">กลับหน้าลงทะเบียน</a></div></main>';
      var pl = ensurePlan(v), e = App.evaluate(v), sm = summary(v, e), n = pl.next;
      if (v.status === 'assess' || v.status === 'registered') {
        v.status = 'plan';
        var a = v.apptId && App.appt(v.apptId);
        if (a && a.status !== 'เสร็จ') { a.status = 'รอพบแพทย์'; App.sync('appt', a); }
        App.touch(v);
      }
      var preps = App.PREPS.map(function (p) {
        return '<div class="prep" style="' + (n[p.k] ? 'border-color:' + p.col + '55' : '') + '"><label><input type="checkbox" id="nx-' + p.k + '" data-f="next.' + p.k + '"' + (n[p.k] ? ' checked' : '') + '>' +
          App.ico(p.ico, p.bg, p.col, 'sm') + esc(p.t) + '</label>' +
          (p.ph && n[p.k] ? '<input class="inp" id="nx-' + p.k + 'Txt" data-f="next.' + p.k + 'Txt" aria-label="รายละเอียด ' + esc(p.t) + '" placeholder="' + esc(p.ph) + '" value="' + esc(n[p.k + 'Txt']) + '">' : '') + '</div>';
      }).join('');
      var closed = v.status === 'done';

      return App.header('register') + App.patientBar(v, 3) + '<main class="wrap">' +
        '<div class="cols noprint">' +
        '<div class="main-col stack lg">' +
        App.pageHead('clip', 'var(--red-soft)', '#d63c3c', 'แผนการดูแล ส่งต่อ &amp; นัดหมาย', closed ? '✓ ปิด visit แล้ว · แก้ไขได้ และกดบันทึกอีกครั้ง' : '') +
        '<section class="card stack"><div class="row between"><div class="card-h">' + App.ico('steth', 'var(--blue-soft)', '#1f5fd6') + '<h2>สรุปสำหรับแพทย์</h2></div>' +
        '<button class="btn line sm" data-act="copy">' + I('note', null, 16) + 'คัดลอกลงเวชระเบียน</button></div>' +
        '<div class="box pre" id="sumtext">' + esc(sm.text) + '</div>' +
        '<a class="small" href="#/visit/' + v.id + '">← กลับไปแก้ไขการซักประวัติ/ประเมิน</a></section>' +

        '<section class="card stack"><div class="card-h">' + App.ico('arrow', 'var(--teal-soft)', '#047857') + '<div><h2>ส่งต่อ / ประเมินเพิ่ม</h2><div class="small muted">ป้าย <b>แนะนำ</b> = ตามผลประเมินครั้งนี้</div></div></div>' +
        '<div class="grid g2">' + check(App.REFERRALS, pl.refs, 'ref', e) + '</div>' +
        '<div><label class="lbl" for="pl-refo">ส่งต่ออื่น ๆ</label><input class="inp" id="pl-refo" data-f="refOther" value="' + esc(pl.refOther) + '"></div></section>' +

        '<section class="card stack"><div class="card-h">' + App.ico('book', 'var(--yellow-soft)', '#b26a00') + '<div><h2>สุขศึกษาที่ให้วันนี้</h2><div class="small muted">ติ๊กเมื่อให้ความรู้แล้ว</div></div></div>' +
        '<div class="grid g2">' + check(App.EDUS, pl.edus, 'edu', e) + '</div>' +
        '<div><label class="lbl" for="pl-edun">บันทึกการให้สุขศึกษา</label><input class="inp" id="pl-edun" data-f="eduNote" value="' + esc(pl.eduNote) + '" placeholder="เช่น บุตรสาวรับทราบ จะติดราวจับในห้องน้ำ"></div>' +
        '<div><label class="lbl" for="pl-note">บันทึกเพิ่มเติม / คำสั่งแพทย์</label><textarea class="inp" id="pl-note" data-f="note">' + esc(pl.note) + '</textarea></div></section>' +
        '</div>' +

        '<aside class="side-col stack">' +
        '<section class="card accent-blue stack"><div class="row between"><div class="card-h">' + App.ico('cal', '#3a86ff', '#fff') + '<h2>นัดครั้งถัดไป</h2></div>' +
        '<label class="row tiny" style="gap:6px;font-weight:600"><input type="checkbox" id="nx-on" data-f="next.on"' + (n.on ? ' checked' : '') + ' style="width:20px;height:20px">นัด</label></div>' +
        (n.on ? '<div class="grid g3" role="group" aria-label="ระยะนัด">' + [1, 3, 6].map(function (mm) {
          var d = App.addMonths(v.date, mm);
          return '<button class="btn" data-act="span" data-m="' + mm + '" aria-pressed="' + (n.date === d) + '" style="padding:0 6px;' + (n.date === d ? 'background:#3a86ff;color:#fff' : 'border-color:var(--field)') + '">' + mm + ' เดือน</button>';
        }).join('') + '</div>' +
          '<div class="grid g2 keep"><div><label class="lbl" for="nx-date">วันที่</label><input type="date" class="inp" id="nx-date" data-f="next.date" value="' + esc(n.date) + '"></div>' +
          '<div><label class="lbl" for="nx-time">เวลา</label><select class="inp" id="nx-time" data-f="next.time">' + TIMES.map(function (t) { return '<option' + (t === n.time ? ' selected' : '') + '>' + t + '</option>'; }).join('') + '</select></div></div>' +
          '<div class="small muted">' + esc(App.thaiDate(n.date, true)) + ' · มีนัดวันนั้นแล้ว ' + App.apptsOn(n.date).filter(function (a) { return a.id !== pl.apptId; }).length + ' ราย</div>' +
          '<div class="lbl" style="margin:0">ต้องทำก่อนพบแพทย์</div>' + preps +
          '<div><label class="lbl" for="nx-oth">เตรียมตัว / อื่น ๆ</label><input class="inp" id="nx-oth" data-f="next.oth" value="' + esc(n.oth) + '"></div>'
          : '<div class="small muted">ไม่นัดครั้งถัดไป</div>') +
        '</section>' +
        '<section class="card stack"><h3>ผู้บันทึก</h3>' +
        '<div class="small">พยาบาล: ' + esc(v.by || App.db.settings.nurse || '–') + '</div>' +
        '<div><label class="lbl" for="pl-doc">แพทย์ผู้ตรวจ</label><input class="inp" id="pl-doc" data-f="doctor" value="' + esc(pl.doctor) + '"></div></section>' +
        '<section class="card accent-yellow stack"><div class="card-h">' + App.ico('down', '#ffb703', '#3d2600') + '<h3>ส่งออกแนบเวชระเบียน</h3></div>' +
        '<div class="small muted">ระบบนี้ไม่เชื่อม HIS · ส่งออกแล้วแนบไฟล์ในระบบของโรงพยาบาล</div>' +
        '<div class="grid g2 keep">' + App.exportButtons('csv') + '</div></section>' +
        '<button class="btn primary big" data-act="close">' + I('check', '#fff', 20, 2.4) + (closed ? 'บันทึกการแก้ไข' : 'บันทึก ปิด visit &amp; ออกใบนัด') + '</button>' +
        (closed ? '<a class="btn line" href="#/slip/' + v.id + '">' + I('phone', null, 18) + 'ดูใบนัด</a>' : '') +
        '</aside></div>' +
        '<div class="print-only">' + App.visitReport(v, true) + '</div></main>';
    },

    field: function (name, val, el, type) {
      var v = App.visit(App.arg); if (!v) return false;
      var pl = ensurePlan(v);
      if (name === 'ref' || name === 'edu') {
        var key = name === 'ref' ? 'refs' : 'edus', id = el.getAttribute('data-id');
        pl[key] = pl[key].filter(function (x) { return x !== id; });
        if (val) pl[key].push(id);
      } else if (name.indexOf('next.') === 0) pl.next[name.slice(5)] = val;
      else pl[name] = val;
      if (type === 'change') { App.touch(v); return typeof val === 'boolean' || name === 'next.date'; }
      return false;
    },

    actions: {
      span: function (el) {
        var v = App.visit(App.arg); v.plan.next.date = App.addMonths(v.date, +el.getAttribute('data-m')); App.touch(v); App.render();
      },
      copy: function () {
        var t = document.getElementById('sumtext').textContent;
        (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject())
          .then(function () { App.toast('คัดลอกสรุปแล้ว วางลงเวชระเบียนได้เลย'); })
          .catch(function () { App.toast('คัดลอกไม่ได้ ให้เลือกข้อความแล้วกด Ctrl+C', true); });
      },
      csv: function () {
        var v = App.visit(App.arg);
        App.download('บันทึกคลินิกผู้สูงอายุ-HN' + App.safeName(v.hn) + '-' + App.safeName(App.thaiDate(v.date)) + '.csv', App.csv(App.visitCsvRows(v)));
      },
      close: function () {
        var v = App.visit(App.arg), pl = v.plan, n = pl.next, p = App.patient(v.hn) || {};
        if (n.on) {
          if (!n.date) { App.toast('เลือกวันนัดครั้งถัดไป', true); return; }
          if (n.date <= v.date) { App.toast('วันนัดต้องเป็นวันหลังจากวันนี้', true); return; }
          var a = pl.apptId && App.appt(pl.apptId);
          var data = { date: n.date, time: n.time, hn: v.hn, pre: p.pre, first: p.first, last: p.last, age: v.age, sex: v.sex,
            lab: n.lab, labTxt: n.labTxt, re: n.re, reTxt: n.reTxt, xr: n.xr, xrTxt: n.xrTxt, ekg: n.ekg, oth: n.oth, fromVisit: v.id, savedAt: new Date().toISOString() };
          if (a) Object.assign(a, data);
          else { a = Object.assign({ id: App.uid(), status: 'นัดไว้', visitId: null, createdAt: new Date().toISOString() }, data); App.db.appts.push(a); pl.apptId = a.id; }
          App.sync('appt', a);
        } else if (pl.apptId) {
          var old = App.appt(pl.apptId);
          if (old && !old.visitId) { App.db.appts = App.db.appts.filter(function (x) { return x.id !== old.id; }); App.sync('appt', old, true); }
          pl.apptId = null;
        }
        v.status = 'done';
        if (pl.doctor) App.db.settings.doctor = pl.doctor;
        var cur = v.apptId && App.appt(v.apptId);
        if (cur) { cur.status = 'เสร็จ'; App.sync('appt', cur); }
        App.touch(v);
        App.toast('บันทึกแล้ว' + (n.on ? ' · นัดครั้งถัดไป ' + App.thaiDate(n.date) : ''));
        App.go('#/slip/' + v.id);
      }
    }
  };

  /* ---------- ใบนัด (ให้ผู้ป่วย/ญาติ · พิมพ์ได้) ---------- */
  App.views.slip = {
    title: 'ใบนัด',
    render: function (id) {
      var v = App.visit(id);
      if (!v || !v.plan) return App.header() + '<main class="wrap"><div class="empty"><b>ยังไม่มีใบนัด</b><a class="btn primary" href="#/register">กลับหน้าลงทะเบียน</a></div></main>';
      var p = App.patient(v.hn) || {}, n = v.plan.next;
      var edus = App.planNames(App.EDUS, v.plan.edus);
      var preps = App.PREPS.filter(function (x) { return n[x.k]; }).map(function (x) {
        return '<div class="row" style="gap:10px;flex-wrap:nowrap">' + App.ico(x.ico, x.bg, x.col, 'sm') + '<span>' + esc(x.t.split(' /')[0]) + (n[x.k + 'Txt'] ? ' · ' + esc(n[x.k + 'Txt']) : '') + '</span></div>';
      }).join('') + (n.oth ? '<div class="row" style="gap:10px;flex-wrap:nowrap">' + App.ico('pill', 'var(--yellow-soft)', '#b26a00', 'sm') + '<span>' + esc(n.oth) + '</span></div>' : '');
      return App.header('register') +
        '<main class="wrap stack lg"><div class="row between noprint"><a href="#/plan/' + v.id + '">← กลับแผนการดูแล</a>' +
        '<div class="row"><button class="btn print" data-act="print">' + I('print', null, 18) + 'พิมพ์ใบนัด</button><a class="btn primary" href="#/register">ผู้ป่วยรายถัดไป ' + I('arrow', '#fff', 18) + '</a></div></div>' +
        '<div class="slip"><div class="rainbow"><span style="background:#ff6b6b"></span><span style="background:#ffb703"></span><span style="background:#2ec4b6"></span><span style="background:#8b5cf6"></span></div>' +
        '<div class="slip-head"><div class="small">คลินิกผู้สูงอายุ · โรงพยาบาลบ้านกรวด</div><h1 style="font-size:24px">ใบนัด ' + esc(App.fullName(p)) + '</h1><div class="small">HN ' + esc(v.hn) + '</div></div>' +
        '<div class="stack" style="padding:18px">' +
        (n.on ? '<div class="card stack" style="gap:4px"><div class="small muted">นัดครั้งถัดไป</div><div style="font:700 26px var(--f-head);color:var(--blue-ink)">' + esc(App.thaiDate(n.date, true)) + '</div>' +
          '<div style="font-size:18px;font-weight:600">เวลา ' + esc(n.time) + ' น. · คลินิกผู้สูงอายุ</div></div>'
          : '<div class="card">ไม่มีนัดครั้งถัดไป</div>') +
        (preps ? '<div class="card stack"><h3>เตรียมตัวก่อนมา</h3>' + preps + '</div>' : '') +
        (edus.length ? '<div class="card stack"><h3>คำแนะนำจากพยาบาล</h3><ul style="margin:0;padding-left:20px">' + edus.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div>' : '') +
        '<div class="small muted">นำใบนัดนี้มาแสดงที่จุดลงทะเบียน · สอบถาม: ' + esc(App.db.settings.clinicTel || '[เบอร์คลินิก]') + '</div>' +
        '</div></div></main>';
    }
  };
})();
