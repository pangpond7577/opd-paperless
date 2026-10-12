/* =========================================================
 * หน้า "ซักประวัติ & ประเมิน"
 *   ส่วนบน: สัญญาณชีพ + ประวัติ
 *   หน้าต่างประเมิน: เมนูบาร์ 1 ประเมินเบื้องต้น 13 ข้อ · เมนูบาร์ 2 แบบประเมินละเอียด
 * ========================================================= */
(function () {
  'use strict';
  var App = window.App, esc = App.esc, I = App.icon;

  var VITALS = [
    ['sys', 'BP ตัวบน', 'mmHg', 'numeric'], ['dia', 'BP ตัวล่าง', 'mmHg', 'numeric'], ['pr', 'ชีพจร', 'ครั้ง/นาที', 'numeric'], ['rr', 'หายใจ', 'ครั้ง/นาที', 'numeric'],
    ['t', 'อุณหภูมิ', '°C', 'decimal'], ['o2', 'SpO₂', '%', 'numeric'], ['dtx', 'DTX', 'mg/dL', 'numeric'], ['pain', 'ปวด (0–10)', 'คะแนน', 'numeric'],
    ['wt', 'น้ำหนัก', 'กก.', 'decimal'], ['ht', 'ส่วนสูง', 'ซม.', 'decimal']
  ];

  function notFound() {
    return App.header('register') + '<main class="wrap"><div class="empty"><b>ไม่พบข้อมูลการมารับบริการนี้</b><a class="btn primary" href="#/register">กลับไปหน้าลงทะเบียน</a></div></main>';
  }

  /** หาค่าส่วนสูงครั้งก่อนของผู้ป่วย */
  function lastHeight(v) {
    var prev = App.visitsOf(v.hn).filter(function (x) { return x.id !== v.id && x.vitals && x.vitals.ht; });
    return prev.length ? prev[prev.length - 1].vitals.ht : '';
  }

  function lvClass(lv) { return 'lv-' + (lv || 'wait'); }

  /* ---------- เมนูบาร์ 1: 13 ข้อ ---------- */
  function tab1(v, e) {
    var pct = Math.round(e.answered / e.total * 100);
    var cards = e.domains.map(function (x) {
      var d = x.d;
      var items = d.items.map(function (t, i) {
        var k = d.id + '-' + i, val = e.screen[k], auto = d.auto && d.auto.indexOf(i) >= 0;
        var yesCls = val === true ? (d.invert ? 'on-ok' : 'on-risk') : '', noCls = val === false ? (d.invert ? 'on-risk' : 'on-ok') : '';
        return '<div class="qa"><div style="font-size:15px">' + esc(t) + (auto ? ' <span class="pill p-blue" style="font-size:12px">อัตโนมัติ</span>' : '') + '</div>' +
          (auto ? '<div class="pill ' + (val == null ? 'lv-wait' : val ? 'lv-risk' : 'lv-ok') + '" style="font-size:14px;padding:8px 12px">' + (val == null ? 'รอสัญญาณชีพ/ประวัติ' : val ? 'ใช่' : 'ไม่ใช่') + '</div>'
            : '<div class="yn" role="group" aria-label="' + esc(t) + '">' +
            '<button class="' + yesCls + '" data-act="yn" data-k="' + k + '" data-v="1" aria-pressed="' + (val === true) + '">ใช่</button>' +
            '<button class="' + noCls + '" data-act="yn" data-k="' + k + '" data-v="0" aria-pressed="' + (val === false) + '">ไม่ใช่</button></div>') + '</div>';
      }).join('');
      return '<section class="domain"><div class="bar" style="background:' + d.c + '"></div><div class="in">' +
        '<div class="row between"><h3 style="font-size:16px">' + d.no + '. ' + esc(d.title) + '</h3><span class="pill ' + lvClass(x.lv) + '">' + esc(x.result) + '</span></div>' +
        (d.note2 ? '<div class="tiny muted" style="margin-top:-6px">' + esc(d.note2) + '</div>' : '') + items + '</div></section>';
    }).join('');
    var ostaCard = '<section class="domain"><div class="bar" style="background:#7b6cd9"></div><div class="in"><div class="row between"><h3 style="font-size:16px">13. OSTA index ภาวะกระดูกพรุน</h3>' +
      '<span class="pill ' + (e.c.ostaLv === 'สูง' ? 'lv-risk' : e.c.ostaLv === 'ปานกลาง' ? 'lv-mid' : e.c.ostaLv ? 'lv-ok' : 'lv-wait') + '">' + (e.c.ostaLv || 'รอข้อมูล') + '</span></div>' +
      '<div style="font-size:15px">0.2 × (น้ำหนัก − อายุ) = <b>' + (isNaN(e.c.osta) ? '–' : e.c.osta.toFixed(1)) + '</b></div>' +
      '<div class="tiny muted">ต่ำ &gt; −1 · ปานกลาง −1 ถึง −4 · สูง &lt; −4</div></div></section>';

    var follow = e.risky.map(function (d) {
      var t = d.tool && e.byId[d.tool];
      return '<div class="box" style="background:#fff8f2;border-color:#f0d6bf"><div style="font-weight:700;color:#6b3108">' + d.no + '. ' + esc(d.title) + '</div>' +
        (t ? '<button class="btn line sm" data-act="tool" data-id="' + t.id + '" style="margin-top:6px;border-color:#e0b896;color:#6b3108">ประเมินต่อ: ' + esc(t.name) + ' ' + I('arrow', null, 16) + '</button>'
          : '<div class="small">' + esc(d.note || '') + '</div>') + '</div>';
    }).join('');
    if (e.ostaRisk) follow += '<div class="box" style="background:#fff8f2;border-color:#f0d6bf"><div style="font-weight:700;color:#6b3108">13. OSTA ' + esc(e.c.ostaLv) + '</div>' +
      '<button class="btn line sm" data-act="tool" data-id="frax" style="margin-top:6px;border-color:#e0b896;color:#6b3108">ประเมินต่อ: FRAX score ' + I('arrow', null, 16) + '</button></div>';

    return '<div class="panel" role="tabpanel" aria-label="ประเมินเบื้องต้น">' +
      '<div class="main-col stack"><div class="row between"><div class="small muted">ตอบ “ใช่” = เสี่ยง · ข้อ 10 ตอบ “ใช่” = ปกติ · ป้าย <b>อัตโนมัติ</b> = คำนวณจากสัญญาณชีพ/ประวัติด้านบน</div>' +
      '<div class="small">ตอบแล้ว <b>' + e.answered + '</b> / ' + e.total + ' ข้อ</div></div>' +
      '<div class="progress"><div style="width:' + pct + '%"></div></div>' +
      '<div class="grid g2">' + cards + ostaCard + '</div></div>' +
      '<aside class="side-col stack"><h3 style="font-size:18px">สรุปเบื้องต้น</h3>' +
      '<div class="row" style="gap:8px;align-items:baseline"><span style="font:700 40px var(--f-head);color:#8a3f0a">' + e.riskCount + '</span><span class="muted">ด้านที่เสี่ยง (รวม OSTA)</span></div>' +
      (follow ? '<div class="small muted">ด้านที่เสี่ยงมีแบบประเมินละเอียดรออยู่ในเมนูบาร์ที่ 2</div>' + follow : '<div class="box small">ยังไม่พบด้านที่เสี่ยง</div>') +
      '<button class="btn go" data-act="tab" data-v="2">ไปแบบประเมินละเอียด ' + I('arrow', '#fff', 18) + '</button></aside></div>';
  }

  /* ---------- เมนูบาร์ 2: แบบละเอียด ---------- */
  function tab2(v, e) {
    var toolId = v.tool && e.byId[v.tool] ? v.tool : (Object.keys(e.rec)[0] || 'tug');
    v.tool = toolId;
    var t = e.byId[toolId], ev = e.results[toolId], A = (v.detail || {})[toolId] || {};
    var groups = [], gi = {};
    e.tools.forEach(function (x) {
      if (gi[x.g] == null) { gi[x.g] = groups.length; groups.push({ g: x.g, items: [] }); }
      groups[gi[x.g]].items.push(x);
    });
    var nav = groups.map(function (g) {
      return '<div><div class="g">' + esc(g.g) + '</div>' + g.items.map(function (x) {
        var r = e.results[x.id].j, cur = x.id === toolId;
        var badge = r.lv !== 'wait' ? '<span class="pill ' + lvClass(r.lv) + '">' + App.LV_TEXT[r.lv] + '</span>'
          : e.rec[x.id] ? '<span class="pill p-blue">แนะนำ</span>' : '';
        return '<button class="toolbtn" data-act="tool" data-id="' + x.id + '" aria-current="' + cur + '"><span>' + esc(x.name) + '</span>' + badge + '</button>';
      }).join('') + '</div>';
    }).join('');

    var qs = t.qs.map(function (q, i) {
      var val = A[i];
      if (q.t === 'head') return '<div class="qitem"><div style="font:700 15px var(--f-head);color:var(--teal-ink)">' + esc(q.q) + '</div></div>';
      if (q.t === 'auto') return '<div class="qitem"><div class="row between"><div class="q">' + esc(q.q) + '</div><div class="row" style="gap:8px"><b>' + esc(q.v) + '</b><span class="pill p-blue">อัตโนมัติ</span></div></div></div>';
      if (q.t === 'num') return '<div class="qitem"><div class="row between"><label class="q" for="tq-' + toolId + '-' + i + '">' + esc(q.q) + '</label><div class="row" style="gap:8px">' +
        '<input class="inp" style="width:130px" inputmode="decimal" id="tq-' + toolId + '-' + i + '" data-f="num" data-i="' + i + '" value="' + esc(val == null ? '' : val) + '"><span class="muted">' + esc(q.unit) + '</span></div></div></div>';
      var skip = toolId === 'mmse' && A[0] === 0 && (i === 4 || i === 9 || i === 10);
      return '<div class="qitem"' + (skip ? ' style="opacity:.5"' : '') + '><div class="q">' + esc(q.q) + (skip ? ' <span class="pill lv-wait">ไม่ต้องทำ</span>' : '') + '</div><div class="opts" role="group" aria-label="' + esc(q.q) + '">' +
        q.o.map(function (o, oi) {
          return '<button class="opt" data-act="opt" data-i="' + i + '" data-o="' + oi + '" aria-pressed="' + (val === oi) + '">' + esc(o[0]) +
            (!t.noSum && !q.pts ? ' <span style="opacity:.75">(' + o[1] + ')</span>' : '') + '</button>';
        }).join('') + '</div></div>';
    }).join('');

    var j = ev.j;
    var next = j.lv === 'wait' ? '' : j.next.map(function (n) {
      return '<button class="btn" data-act="tool" data-id="' + n + '" style="border-color:currentColor;color:inherit;background:#fff">ประเมินต่อ: ' + esc(e.byId[n].name) + ' ' + I('arrow', null, 16) + '</button>';
    }).join('');
    var scoreTxt = !t.noSum && j.lv !== 'wait' ? '<div class="small" style="font-weight:600">คะแนนรวม ' + ev.sum + (toolId === 'mnafull' ? ' / 30 (รวม Short form)' : '') + '</div>' : '';

    return '<div class="panel" role="tabpanel" aria-label="แบบประเมินละเอียด"><nav class="toolnav" aria-label="เครื่องมือประเมินแบบละเอียด">' + nav + '</nav>' +
      '<div class="main-col stack"><div class="stack" style="gap:4px"><div class="small muted">' + esc(t.g) + ' · คู่มือหน้า ' + esc(t.page) + '</div>' +
      '<h3 style="font-size:22px">' + esc(t.name) + '</h3><div class="muted" style="font-size:15px">' + esc(t.how) + '</div></div>' +
      '<div class="qlist">' + qs + '</div>' +
      '<div class="result ' + lvClass(j.lv) + '"><div>' + scoreTxt + '<div class="r">' + esc(j.res) + '</div><div class="small">' + esc(j.crit) + '</div></div>' +
      '<div class="row">' + next + (Object.keys(A).length ? '<button class="btn line sm" data-act="clearTool" style="background:#fff">ล้างคำตอบ</button>' : '') + '</div></div></div></div>';
  }

  /* ---------- หน้าหลัก ---------- */
  App.views.visit = {
    title: 'ซักประวัติ & ประเมิน',
    render: function (id) {
      var v = App.visit(id);
      if (!v) return notFound();
      if (v.status === 'registered') {
        v.status = 'assess';
        if (!v.vitals.ht) { var h = lastHeight(v); if (h) v.vitals.ht = h; }
        var a = v.apptId && App.appt(v.apptId);
        if (a && a.status !== 'ซักประวัติ/ประเมิน') { a.status = 'ซักประวัติ/ประเมิน'; App.sync('appt', a); }
        App.touch(v);
      }
      var e = App.evaluate(v), vt = v.vitals, c = e.c;
      var bmiLv = isNaN(c.bmi) ? 'wait' : (c.bmi < 18.5 || c.bmi >= 23) ? 'mid' : 'ok';
      var ostaLv = c.ostaLv === 'สูง' ? 'risk' : c.ostaLv === 'ปานกลาง' ? 'mid' : c.ostaLv ? 'ok' : 'wait';

      var vit = VITALS.map(function (x) {
        var warn = (x[0] === 'sys' || x[0] === 'dia') && c.bpHigh;
        return '<div><label class="lbl" for="vt-' + x[0] + '">' + x[1] + '</label><input class="inp" id="vt-' + x[0] + '" data-f="vt.' + x[0] + '" inputmode="' + x[3] + '" value="' + esc(vt[x[0]] || '') + '"' +
          (warn ? ' style="border-color:#c2410c;background:#fff8f2"' : '') + '><div class="hint"' + (warn && x[0] === 'sys' ? ' style="color:#8a3f0a;font-weight:600"' : '') + '>' +
          (warn && x[0] === 'sys' ? 'สูงกว่าเกณฑ์ · วัดซ้ำ' : x[2]) + '</div></div>';
      }).join('');

      var dz = App.DISEASES.map(function (d) {
        var on = (v.dz || []).indexOf(d) >= 0;
        return '<button class="btn sm" data-act="dz" data-v="' + esc(d) + '" aria-pressed="' + on + '" style="border-radius:999px;' + (on ? 'background:var(--primary);color:#fff' : 'border-color:var(--field)') + '">' + esc(d) + '</button>';
      }).join('');

      return App.header('register') + App.patientBar(v, 2) +
        '<main class="wrap stack lg">' +
        '<div class="noprint stack lg">' +
        App.pageHead('steth', 'var(--purple-soft)', '#5b3fe0', 'ซักประวัติ &amp; ประเมินผู้สูงอายุ', '') +
        '<div class="cols">' +
        '<section class="card main-col stack" style="flex-basis:560px"><div class="card-h">' + App.ico('thermo', 'var(--red-soft)', '#d63c3c') + '<h2>สัญญาณชีพ &amp; สัดส่วนร่างกาย</h2></div>' +
        '<div class="grid g4">' + vit +
        '<div class="vbox ' + lvClass(bmiLv) + '"><div class="small" style="font-weight:600">BMI</div><div class="v">' + (isNaN(c.bmi) ? '–' : c.bmi.toFixed(1)) + '</div><div class="tiny">' + (isNaN(c.bmi) ? 'รอข้อมูล' : c.bmi < 18.5 ? 'น้อยกว่าเกณฑ์' : c.bmi >= 23 ? 'เกินเกณฑ์ (≥ 23)' : 'ปกติ') + '</div></div>' +
        '<div class="vbox ' + lvClass(ostaLv) + '"><div class="small" style="font-weight:600">OSTA</div><div class="v">' + (isNaN(c.osta) ? '–' : c.osta.toFixed(1)) + '</div><div class="tiny">' + (c.ostaLv ? 'เสี่ยงกระดูกพรุน' + c.ostaLv : 'รอข้อมูล') + '</div></div>' +
        '</div></section>' +
        '<section class="card side-col stack" style="flex-basis:400px"><div class="card-h">' + App.ico('note', 'var(--yellow-soft)', '#b26a00') + '<h2>ประวัติ</h2></div>' +
        '<div><label class="lbl" for="h-cc">อาการสำคัญ</label><textarea class="inp" id="h-cc" data-f="cc">' + esc(v.cc) + '</textarea></div>' +
        '<div><span class="lbl">โรคประจำตัว</span><div class="row" style="gap:6px">' + dz + '</div>' +
        '<input class="inp" style="margin-top:8px" id="h-dzo" data-f="dzOther" placeholder="โรคอื่น ๆ" value="' + esc(v.dzOther) + '"></div>' +
        '<div class="grid g2 keep"><div><label class="lbl" for="h-meds">ยาที่ใช้ประจำ (ชนิด)</label><input class="inp" id="h-meds" data-f="meds" inputmode="numeric" value="' + esc(v.meds) + '"></div>' +
        '<div><label class="lbl" for="h-alg">แพ้ยา / อาหาร</label><input class="inp" id="h-alg" data-f="alg" value="' + esc(v.alg) + '" placeholder="เช่น ปฏิเสธ"></div></div>' +
        '</section></div>' +

        '<section class="assess"><div class="tabs" role="tablist" aria-label="แบบประเมินผู้สูงอายุ">' +
        '<button class="tabbtn" role="tab" data-act="tab" data-v="1" aria-selected="' + (v.tab !== 2) + '">' + App.ico('clip', '#2ec4b6', '#fff', '', 24) +
        '<span>1 · ประเมินเบื้องต้น<small>แบบประเมิน 13 ข้อ (One Page)</small></span></button>' +
        '<button class="tabbtn" role="tab" data-act="tab" data-v="2" aria-selected="' + (v.tab === 2) + '">' + App.ico('steth', '#8b5cf6', '#fff', '', 24) +
        '<span>2 · แบบประเมินผู้สูงอายุแบบละเอียด<small>ตามคู่มือคัดกรอง/ประเมินสุขภาพผู้สูงอายุ พ.ศ. 2564</small></span></button></div>' +
        (v.tab === 2 ? tab2(v, e) : tab1(v, e)) + '</section>' +

        '<div class="row end"><span class="small muted grow">บันทึกอัตโนมัติทุกครั้งที่กรอก · ไม่ได้เชื่อม HIS ส่งออกไฟล์เพื่อแนบเวชระเบียนในระบบของโรงพยาบาล</span>' +
        App.exportButtons('csv') +
        '<a class="btn primary big" href="#/plan/' + v.id + '">บันทึก &amp; สร้างแผนการดูแล ' + I('arrow', '#fff', 20) + '</a></div>' +
        '</div>' +
        '<div class="print-only">' + App.visitReport(v, false) + '</div>' +
        '</main>';
    },

    field: function (name, val, el, type) {
      var v = App.visit(App.arg); if (!v) return false;
      if (name.indexOf('vt.') === 0) v.vitals[name.slice(3)] = String(val).trim();
      else if (name === 'num') {
        v.detail = v.detail || {};
        var tid = v.tool, i = el.getAttribute('data-i');
        v.detail[tid] = Object.assign({}, v.detail[tid] || {});
        if (val === '') delete v.detail[tid][i]; else v.detail[tid][i] = String(val).trim();
      } else v[name] = val;
      if (type === 'change') { App.touch(v); return true; }
      return false;
    },

    actions: {
      yn: function (el) {
        var v = App.visit(App.arg), k = el.getAttribute('data-k'), val = el.getAttribute('data-v') === '1';
        v.screen = Object.assign({}, v.screen);
        if (v.screen[k] === val) delete v.screen[k]; else v.screen[k] = val;
        App.touch(v); App.render();
      },
      dz: function (el) {
        var v = App.visit(App.arg), d = el.getAttribute('data-v');
        v.dz = v.dz || [];
        var i = v.dz.indexOf(d); if (i >= 0) v.dz.splice(i, 1); else v.dz.push(d);
        App.touch(v); App.render();
      },
      tab: function (el) {
        var v = App.visit(App.arg); v.tab = +el.getAttribute('data-v'); App.touch(v); App.render();
        var box = document.querySelector('.assess'); if (box) box.scrollIntoView({ block: 'start', behavior: 'smooth' });
      },
      tool: function (el) {
        var v = App.visit(App.arg); v.tab = 2; v.tool = el.getAttribute('data-id'); App.touch(v); App.render();
        var box = document.querySelector('.assess'); if (box) box.scrollIntoView({ block: 'start', behavior: 'smooth' });
      },
      opt: function (el) {
        var v = App.visit(App.arg), e = App.evaluate(v);
        var tid = v.tool && e.byId[v.tool] ? v.tool : (Object.keys(e.rec)[0] || 'tug');
        v.tool = tid;
        var i = el.getAttribute('data-i'), o = +el.getAttribute('data-o');
        v.detail = v.detail || {};
        var A = Object.assign({}, v.detail[tid] || {});
        if (A[i] === o) delete A[i]; else A[i] = o;
        v.detail[tid] = A;
        App.touch(v); App.render();
      },
      clearTool: function () {
        var v = App.visit(App.arg);
        if (v.detail && v.tool) { delete v.detail[v.tool]; App.touch(v); App.render(); }
      },
      csv: function () {
        var v = App.visit(App.arg);
        App.download('ประเมินผู้สูงอายุ-HN' + App.safeName(v.hn) + '-' + App.safeName(App.thaiDate(v.date)) + '.csv', App.csv(App.visitCsvRows(v)));
      }
    }
  };
})();
