/* =========================================================
 * ui.js — ส่วนประกอบหน้าจอที่ใช้ร่วมกัน (ไอคอน หัวหน้า ขั้นตอน รายงานสำหรับพิมพ์)
 * ========================================================= */
(function () {
  'use strict';
  var App = window.App;

  /** escape ข้อความทุกครั้งก่อนใส่ลง HTML */
  App.esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  };
  var esc = App.esc;

  /* ---------- ไอคอน (เส้น SVG) ---------- */
  var P = {
    heart: '<path d="M12 20s-7-4.4-9-8.6A4.8 4.8 0 0 1 12 6.5a4.8 4.8 0 0 1 9 4.9C19 15.6 12 20 12 20z"/><path d="M7 12h3l1.5-2.5 2 4 1.5-1.5h2"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    userplus: '<circle cx="9" cy="8" r="4"/><path d="M2 21c0-4 3-6 7-6s7 2 7 6M19 8v6M16 11h6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    down: '<path d="M12 3v12M7 10l5 5 5-5M4 21h16"/>',
    up: '<path d="M12 21V9M7 14l5-5 5 5M4 3h16"/>',
    print: '<path d="M6 9V3h12v6M6 18H4v-7h16v7h-2M8 14h8v7H8z"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    left: '<path d="M15 6l-6 6 6 6"/>', right: '<path d="M9 6l6 6-6 6"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    drop: '<path d="M12 3s6 7 6 11a6 6 0 0 1-12 0c0-4 6-11 6-11z"/>',
    repeat: '<path d="M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7"/>',
    xray: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M12 6v12M8 9h8M8 12h8M8 15h8"/>',
    ekg: '<path d="M2 12h4l3-7 4 14 3-7h6"/>',
    list: '<path d="M4 6h16M4 12h16M4 18h10"/>',
    card: '<rect x="3" y="5" width="18" height="14" rx="3"/><circle cx="9" cy="12" r="2.5"/><path d="M14 10h4M14 14h3"/>',
    thermo: '<path d="M14 14.8V4a2 2 0 0 0-4 0v10.8a4 4 0 1 0 4 0z"/><path d="M12 9v7"/>',
    note: '<path d="M5 4h10l4 4v12H5zM9 12h6M9 16h4"/>',
    clip: '<rect x="5" y="4" width="14" height="18" rx="2"/><path d="M9 4h6v3H9zM9 12l2 2 4-4M9 18h6"/>',
    steth: '<path d="M6 3v6a4 4 0 0 0 8 0V3M10 13v3a5 5 0 0 0 10 0v-2"/><circle cx="20" cy="12" r="2"/>',
    book: '<path d="M4 5h7a2 2 0 0 1 2 2v13a2 2 0 0 0-2-2H4zM20 5h-7a2 2 0 0 0-2 2v13a2 2 0 0 1 2-2h7z"/>',
    pill: '<path d="M10.5 3.5a5 5 0 0 1 7 7l-7 7a5 5 0 0 1-7-7zM7 7l10 10"/>',
    cloud: '<path d="M7 18a5 5 0 1 1 .9-9.9A6 6 0 0 1 19 10a4 4 0 0 1-1 8z"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16zM14 6l4 4"/>',
    phone: '<rect x="7" y="2" width="10" height="20" rx="2"/><path d="M11 18h2"/>'
  };
  App.icon = function (name, color, size, sw) {
    return '<svg width="' + (size || 20) + '" height="' + (size || 20) + '" viewBox="0 0 24 24" fill="none" stroke="' + (color || 'currentColor') +
      '" stroke-width="' + (sw || 2) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[name] || '') + '</svg>';
  };
  /** ไอคอนในกรอบสี */
  App.ico = function (name, bg, color, cls, size) {
    return '<span class="ico ' + (cls || '') + '" style="background:' + bg + '">' + App.icon(name, color, size || (cls === 'sm' ? 18 : cls === 'lg' ? 28 : 22)) + '</span>';
  };

  /* ---------- ส่วนหัวและเมนู ---------- */
  var NAV = [
    ['appts', 'นัดหมาย & คิว', 'cal', '#3a86ff'],
    ['register', 'ลงทะเบียน', 'userplus', '#14a89a'],
    ['patients', 'ค้นประวัติ', 'search', '#8b5cf6'],
    ['report', 'รายงาน', 'chart', '#f08c00'],
    ['settings', 'ตั้งค่า', 'gear', '#5a6080']
  ];
  App.header = function (current) {
    var s = App.db.settings;
    var pending = App.db.outbox.length;
    return '<header class="top noprint">' +
      '<div class="rainbow"><span style="background:#ff6b6b"></span><span style="background:#ffb703"></span><span style="background:#2ec4b6"></span><span style="background:#3a86ff"></span><span style="background:#8b5cf6"></span></div>' +
      '<div class="top-in">' +
      '<a class="brand" href="#/register"><span class="brand-mark">' + App.icon('heart', '#fff', 24, 2.2) + '</span>' +
      '<span><b>คลินิกผู้สูงอายุ · รพ.บ้านกรวด</b><span class="tiny muted">OPD Paperless</span></span></a>' +
      '<nav class="nav" aria-label="เมนูหลัก">' + NAV.map(function (n) {
        return '<a href="#/' + n[0] + '"' + (current === n[0] ? ' aria-current="page"' : '') + '>' + App.icon(n[2], n[3]) + n[1] + '</a>';
      }).join('') + '</nav>' +
      '<div class="small muted">' + esc(App.thaiDate(App.today(), true)) + ' · ' + (s.nurse ? esc(s.nurse) : '<a href="#/settings">ตั้งชื่อผู้บันทึก</a>') +
      (s.syncUrl ? ' · <span title="Google Sheets">' + App.icon('cloud', pending ? '#f08c00' : '#14a89a', 16) + (pending ? ' รอส่ง ' + pending : '') + '</span>' : '') + '</div>' +
      '</div></header>';
  };

  /** แถบขั้นตอน + ชื่อผู้ป่วย */
  App.patientBar = function (v, step) {
    var p = App.patient(v.hn) || {};
    var st = [['1', 'ลงทะเบียน / คิว', '#/register', '#2ec4b6'], ['2', 'ซักประวัติ & ประเมิน', '#/visit/' + v.id, '#8b5cf6'], ['3', 'แผนการดูแล & นัด', '#/plan/' + v.id, '#ff6b6b']];
    return '<div class="patientbar noprint"><div class="patientbar-in"><nav class="steps" aria-label="ขั้นตอน">' + st.map(function (s, i) {
      var n = i + 1, done = n < step, cur = n === step;
      return '<a href="' + s[2] + '"' + (cur ? ' aria-current="step" style="color:var(--ink)"' : '') + '><span class="num" style="' +
        (cur ? 'background:' + s[3] + ';color:#fff' : done ? 'background:#c8f2e4;color:#06604a' : '') + '">' + (done ? '✓' : s[0]) + '</span>' + s[1] + '</a>';
    }).join('') + '</nav>' +
      '<div><strong>' + esc(v.q) + ' · ' + esc(App.fullName(p)) + '</strong> · HN ' + esc(v.hn) + ' · ' + esc(v.sex || '') + ' ' + esc(v.age) + ' ปี</div></div></div>';
  };

  App.pageHead = function (icon, bg, color, title, sub, right) {
    return '<div class="row between"><div class="pagehead">' + App.ico(icon, bg, color, 'lg') +
      '<div><h1>' + title + '</h1>' + (sub ? '<div class="muted">' + sub + '</div>' : '') + '</div></div>' + (right || '') + '</div>';
  };

  App.exportButtons = function (csvAct, printAct) {
    return '<button class="btn csv" data-act="' + csvAct + '">' + App.icon('down', null, 18, 2.2) + 'ส่งออก CSV</button>' +
      '<button class="btn print" data-act="' + (printAct || 'print') + '">' + App.icon('print', null, 18) + 'พิมพ์ / PDF</button>';
  };

  App.prepPills = function (a) {
    var out = App.PREPS.filter(function (p) { return a[p.k]; }).map(function (p) {
      return '<span class="pill ' + p.cls + '">' + App.icon(p.ico, null, 14, 2.4) + esc(p.t.split(' /')[0]) + (a[p.k + 'Txt'] ? ' ' + esc(a[p.k + 'Txt']) : '') + '</span>';
    });
    if (a.oth) out.push('<span class="pill p-yellow">' + esc(a.oth) + '</span>');
    return out.join('');
  };

  /* ---------- toast / dialog ---------- */
  App.toast = function (msg, isErr) {
    var t = document.getElementById('toast');
    t.textContent = msg; t.className = isErr ? 'err' : ''; t.hidden = false;
    clearTimeout(App._toastT);
    App._toastT = setTimeout(function () { t.hidden = true; }, 3200);
  };
  /** กล่องยืนยัน: App.confirm(หัวข้อ, html, ปุ่มยืนยัน) → Promise<boolean> */
  App.confirm = function (title, html, okText, danger) {
    return new Promise(function (resolve) {
      var d = document.getElementById('dlg');
      d.innerHTML = '<form method="dialog" class="stack"><h2>' + esc(title) + '</h2><div>' + html + '</div>' +
        '<div class="row end"><button class="btn line" value="no">ยกเลิก</button><button class="btn ' + (danger ? 'danger' : 'primary') + '" value="ok">' + esc(okText || 'ตกลง') + '</button></div></form>';
      d.onclose = function () { resolve(d.returnValue === 'ok'); };
      d.returnValue = '';
      if (d.showModal) d.showModal(); else resolve(window.confirm(title));
    });
  };

  /* ---------- รายงานสำหรับพิมพ์แนบเวชระเบียน ---------- */
  App.visitReport = function (v, withPlan) {
    var p = App.patient(v.hn) || {}, e = App.evaluate(v), vt = v.vitals || {};
    var cell = function (x) { return esc(x == null || x === '' ? '–' : x); };
    var h = '<div class="report">' +
      '<div class="report-head"><div><b style="font-size:17px">บันทึกคลินิกผู้สูงอายุ โรงพยาบาลบ้านกรวด</b><br>' +
      'แบบคัดกรอง/ประเมินสุขภาพผู้สูงอายุ (คู่มือกระทรวงสาธารณสุข พ.ศ. 2564)</div>' +
      '<div style="text-align:right">วันที่ ' + esc(App.thaiDate(v.date)) + '<br>คิว ' + esc(v.q) + '</div></div>' +
      '<table><tr><th>ชื่อ-สกุล</th><td>' + esc(App.fullName(p)) + '</td><th>HN</th><td>' + esc(v.hn) + '</td><th>อายุ/เพศ</th><td>' + esc(v.age) + ' ปี ' + esc(v.sex || '') + '</td></tr>' +
      '<tr><th>ประเภทการมา</th><td>' + esc(v.type) + '</td><th>สิทธิ</th><td>' + cell(v.right) + '</td><th>การเคลื่อนไหว</th><td>' + cell(v.mob) + '</td></tr></table>' +
      '<h2>สัญญาณชีพและประวัติ</h2><table><tr><th>BP</th><td>' + cell(vt.sys && (vt.sys + '/' + vt.dia)) + '</td><th>PR</th><td>' + cell(vt.pr) + '</td><th>RR</th><td>' + cell(vt.rr) + '</td><th>T</th><td>' + cell(vt.t) + '</td><th>SpO₂</th><td>' + cell(vt.o2) + '</td></tr>' +
      '<tr><th>น้ำหนัก</th><td>' + cell(vt.wt) + '</td><th>ส่วนสูง</th><td>' + cell(vt.ht) + '</td><th>BMI</th><td>' + cell(e.c.bmiTxt) + '</td><th>OSTA</th><td>' + cell(isNaN(e.c.osta) ? '' : e.c.osta.toFixed(1) + ' (' + e.c.ostaLv + ')') + '</td><th>DTX</th><td>' + cell(vt.dtx) + '</td></tr></table>' +
      '<p><b>อาการสำคัญ:</b> ' + cell(v.cc) + '<br><b>โรคประจำตัว:</b> ' + cell((v.dz || []).concat(v.dzOther ? [v.dzOther] : []).join(', ')) +
      ' · <b>ยาประจำ:</b> ' + cell(v.meds) + ' ชนิด · <b>แพ้ยา:</b> ' + cell(v.alg) + '</p>' +
      '<h2>ประเมินเบื้องต้น 13 ข้อ (เสี่ยง ' + e.riskCount + ' ด้าน)</h2><table><tr><th>ด้าน</th><th>ผล</th><th>ด้าน</th><th>ผล</th></tr>';
    var ds = e.domains.map(function (x) { return [x.d.no + '. ' + x.d.title, x.result]; });
    ds.push(['13. OSTA index', e.c.ostaLv ? 'ความเสี่ยง' + e.c.ostaLv : '–']);
    for (var i = 0; i < ds.length; i += 2) {
      h += '<tr><td>' + esc(ds[i][0]) + '</td><td><b>' + esc(ds[i][1]) + '</b></td><td>' + (ds[i + 1] ? esc(ds[i + 1][0]) : '') + '</td><td><b>' + (ds[i + 1] ? esc(ds[i + 1][1]) : '') + '</b></td></tr>';
    }
    h += '</table><h2>ประเมินแบบละเอียด</h2>';
    var rows = e.tools.filter(function (t) { return e.results[t.id].j.lv !== 'wait'; });
    h += rows.length ? '<table><tr><th>แบบประเมิน</th><th>คะแนน</th><th>แปลผล</th></tr>' + rows.map(function (t) {
      var r = e.results[t.id];
      return '<tr><td>' + esc(t.name) + '</td><td>' + (t.noSum ? '–' : esc(r.sum)) + '</td><td>' + esc(r.j.res) + '</td></tr>';
    }).join('') + '</table>' : '<p>ไม่ได้ประเมินแบบละเอียดในครั้งนี้</p>';
    if (withPlan && v.plan) {
      var pl = v.plan;
      h += '<h2>แผนการดูแล</h2><p><b>ส่งต่อ:</b> ' + cell(planNames(App.REFERRALS, pl.refs).concat(pl.refOther ? [pl.refOther] : []).join(', ')) + '<br>' +
        '<b>สุขศึกษา:</b> ' + cell(planNames(App.EDUS, pl.edus).join(', ')) + (pl.eduNote ? ' · ' + esc(pl.eduNote) : '') + '<br>' +
        '<b>นัดครั้งถัดไป:</b> ' + cell(pl.next && pl.next.date ? App.thaiDate(pl.next.date, true) + ' ' + pl.next.time + ' น.' : '') +
        (pl.next && App.prepText(pl.next) ? ' · ก่อนพบแพทย์: ' + esc(App.prepText(pl.next)) : '') + '</p>' +
        (pl.note ? '<p><b>บันทึกเพิ่มเติม:</b> ' + esc(pl.note) + '</p>' : '');
    }
    h += '<p style="margin-top:18px">ผู้ประเมิน ' + esc(v.by || '................................') + (withPlan && v.plan ? ' &nbsp; แพทย์ ' + esc(v.plan.doctor || '................................') : '') + '</p></div>';
    return h;
  };
  function planNames(list, ids) {
    ids = ids || [];
    return list.filter(function (x) { return ids.indexOf(x.id) >= 0; }).map(function (x) { return x.t; });
  }
  App.planNames = planNames;

  /** CSV ของ visit 1 ครั้ง (แนบเวชระเบียน) */
  App.visitCsvRows = function (v) {
    var p = App.patient(v.hn) || {}, e = App.evaluate(v), vt = v.vitals || {};
    var rows = [['หมวด', 'รายการ', 'ผล']];
    rows.push(['ผู้ป่วย', 'ชื่อ-สกุล', App.fullName(p)], ['ผู้ป่วย', 'HN', v.hn], ['ผู้ป่วย', 'อายุ/เพศ', v.age + ' ปี ' + (v.sex || '')], ['ผู้ป่วย', 'วันที่', App.thaiDate(v.date)], ['ผู้ป่วย', 'คิว', v.q]);
    [['BP', vt.sys ? vt.sys + '/' + vt.dia : ''], ['ชีพจร', vt.pr], ['หายใจ', vt.rr], ['อุณหภูมิ', vt.t], ['SpO2', vt.o2], ['DTX', vt.dtx], ['ปวด (0-10)', vt.pain],
      ['น้ำหนัก (กก.)', vt.wt], ['ส่วนสูง (ซม.)', vt.ht], ['BMI', e.c.bmiTxt], ['OSTA', isNaN(e.c.osta) ? '' : e.c.osta.toFixed(1) + ' (' + e.c.ostaLv + ')']]
      .forEach(function (x) { rows.push(['สัญญาณชีพ', x[0], x[1] == null ? '' : x[1]]); });
    rows.push(['ประวัติ', 'อาการสำคัญ', v.cc], ['ประวัติ', 'โรคประจำตัว', (v.dz || []).concat(v.dzOther ? [v.dzOther] : []).join(', ')], ['ประวัติ', 'ยาประจำ (ชนิด)', v.meds], ['ประวัติ', 'แพ้ยา/อาหาร', v.alg]);
    e.domains.forEach(function (x) { rows.push(['ประเมินเบื้องต้น 13 ข้อ', x.d.no + '. ' + x.d.title, x.result]); });
    rows.push(['ประเมินเบื้องต้น 13 ข้อ', '13. OSTA index', e.c.ostaLv]);
    e.tools.forEach(function (t) { var r = e.results[t.id]; if (r.j.lv !== 'wait') rows.push(['ประเมินละเอียด', t.name, (t.noSum ? '' : 'คะแนน ' + r.sum + ' · ') + r.j.res]); });
    if (v.plan) {
      var pl = v.plan;
      planNames(App.REFERRALS, pl.refs).concat(pl.refOther ? [pl.refOther] : []).forEach(function (t) { rows.push(['ส่งต่อ', t, '']); });
      planNames(App.EDUS, pl.edus).forEach(function (t) { rows.push(['สุขศึกษา', t, '']); });
      if (pl.eduNote) rows.push(['สุขศึกษา', 'บันทึกเพิ่มเติม', pl.eduNote]);
      if (pl.next && pl.next.date) rows.push(['นัดครั้งถัดไป', App.thaiDate(pl.next.date) + ' ' + pl.next.time, App.prepText(pl.next)]);
      if (pl.note) rows.push(['แผนการดูแล', 'บันทึกเพิ่มเติม', pl.note]);
    }
    rows.push(['ผู้บันทึก', 'พยาบาล', v.by || '']);
    if (v.plan && v.plan.doctor) rows.push(['ผู้บันทึก', 'แพทย์', v.plan.doctor]);
    return rows;
  };
})();
