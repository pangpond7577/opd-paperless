/* =========================================================
 * หน้า "รายงาน" — สรุปรายเดือน + ส่งออกข้อมูลทุก visit เป็น CSV เพื่อทำสถิติ
 * ========================================================= */
(function () {
  'use strict';
  var App = window.App, esc = App.esc, I = App.icon;
  var t0 = App.parse(App.today());
  var S = { y: t0.getFullYear(), m: t0.getMonth() };

  function monthVisits() {
    var prefix = S.y + '-' + App.pad(S.m + 1);
    return App.db.visits.filter(function (v) { return v.date.indexOf(prefix) === 0; }).sort(function (a, b) { return (a.date + a.q) < (b.date + b.q) ? -1 : 1; });
  }
  function pct(n, d) { return d ? Math.round(n / d * 100) + '%' : '–'; }

  App.views.report = {
    title: 'รายงาน',
    render: function () {
      var vs = monthVisits(), evs = vs.map(function (v) { return App.evaluate(v); });
      var prefix = S.y + '-' + App.pad(S.m + 1);
      var appts = App.db.appts.filter(function (a) { return a.date.indexOf(prefix) === 0; });
      var noShow = appts.filter(function (a) { return a.status === 'ไม่มาตามนัด'; }).length;
      var people = {}; vs.forEach(function (v) { people[v.hn] = 1; });
      var screened = evs.filter(function (e) { return e.answered === e.total; }).length;

      var domainRows = App.DOMAINS.map(function (d, i) {
        var n = evs.filter(function (e) { return e.domains[i].lv === 'risk'; }).length;
        return '<tr><td>' + d.no + '. ' + esc(d.title) + '</td><td class="c">' + n + '</td><td class="c">' + pct(n, evs.length) + '</td></tr>';
      }).join('');
      var ostaN = evs.filter(function (e) { return e.ostaRisk; }).length;
      domainRows += '<tr><td>13. OSTA ปานกลาง–สูง</td><td class="c">' + ostaN + '</td><td class="c">' + pct(ostaN, evs.length) + '</td></tr>';

      var toolCount = {};
      evs.forEach(function (e) { e.tools.forEach(function (t) { var r = e.results[t.id].j; if (r.lv !== 'wait') { toolCount[t.name] = toolCount[t.name] || [0, 0]; toolCount[t.name][0]++; if (r.lv !== 'ok') toolCount[t.name][1]++; } }); });
      var toolRows = Object.keys(toolCount).map(function (k) { return '<tr><td>' + esc(k) + '</td><td class="c">' + toolCount[k][0] + '</td><td class="c">' + toolCount[k][1] + '</td></tr>'; }).join('');

      return App.header('report') + '<main class="wrap stack lg">' +
        App.pageHead('chart', 'var(--yellow-soft)', '#b26a00', 'รายงานประจำเดือน', 'สรุปการให้บริการและผลคัดกรองของคลินิก',
          '<div class="row noprint"><div class="row" style="gap:2px;background:#fff;border:1.5px solid var(--field);border-radius:12px;padding:2px">' +
          '<button class="btn icon" data-act="prevM" aria-label="เดือนก่อน" style="background:transparent">' + I('left') + '</button>' +
          '<strong style="min-width:110px;text-align:center">' + App.TM[S.m] + ' ' + (S.y + 543) + '</strong>' +
          '<button class="btn icon" data-act="nextM" aria-label="เดือนถัดไป" style="background:transparent">' + I('right') + '</button></div>' +
          App.exportButtons('csv') + '</div>') +
        '<div class="print-only"><b>รายงานคลินิกผู้สูงอายุ รพ.บ้านกรวด · ' + App.TM[S.m] + ' ' + (S.y + 543) + '</b></div>' +
        '<div class="grid g4">' +
        '<div class="card stat"><div class="small muted">มารับบริการ</div><div class="v">' + vs.length + ' ครั้ง</div><div class="tiny muted">' + Object.keys(people).length + ' ราย</div></div>' +
        '<div class="card stat"><div class="small muted">นัดในเดือน</div><div class="v">' + appts.length + '</div><div class="tiny muted">ไม่มาตามนัด ' + noShow + '</div></div>' +
        '<div class="card stat"><div class="small muted">ประเมิน 13 ข้อครบ</div><div class="v">' + screened + '</div><div class="tiny muted">' + pct(screened, vs.length) + ' ของผู้มารับบริการ</div></div>' +
        '<div class="card stat"><div class="small muted">เสี่ยง ≥ 3 ด้าน</div><div class="v" style="color:#8a3f0a">' + evs.filter(function (e) { return e.riskCount >= 3; }).length + '</div></div>' +
        '</div>' +
        '<div class="cols"><section class="card main-col stack"><h2>ผลประเมินเบื้องต้น: จำนวนผู้ที่เสี่ยงแต่ละด้าน</h2>' +
        '<div class="tablebox"><table><thead><tr><th>ด้าน</th><th class="c">ราย</th><th class="c">ร้อยละ</th></tr></thead><tbody>' + domainRows + '</tbody></table></div></section>' +
        '<section class="card side-col stack"><h2>แบบประเมินละเอียดที่ทำ</h2>' +
        (toolRows ? '<div class="tablebox"><table><thead><tr><th>แบบประเมิน</th><th class="c">ทำ</th><th class="c">ผิดปกติ</th></tr></thead><tbody>' + toolRows + '</tbody></table></div>' : '<div class="empty" style="padding:16px">ยังไม่มีข้อมูล</div>') +
        '</section></div></main>';
    },
    actions: {
      prevM: function () { if (S.m === 0) { S.m = 11; S.y--; } else S.m--; App.render(); },
      nextM: function () { if (S.m === 11) { S.m = 0; S.y++; } else S.m++; App.render(); },
      csv: function () {
        var vs = monthVisits();
        if (!vs.length) { App.toast('เดือนนี้ยังไม่มีข้อมูล'); return; }
        var tools = App.tools({ age: 0, bmi: NaN, osta: NaN, sys: NaN, wt: NaN, htcm: NaN, meds: 0 });
        var head = ['วันที่', 'คิว', 'HN', 'ชื่อ-สกุล', 'อายุ', 'เพศ', 'ประเภทการมา', 'BP', 'น้ำหนัก', 'ส่วนสูง', 'BMI', 'OSTA']
          .concat(App.DOMAINS.map(function (d) { return d.no + '. ' + d.title; }))
          .concat(['จำนวนด้านที่เสี่ยง']).concat(tools.map(function (t) { return t.name; })).concat(['ส่งต่อ', 'นัดครั้งถัดไป', 'ผู้บันทึก']);
        var rows = [head];
        vs.forEach(function (v) {
          var e = App.evaluate(v), p = App.patient(v.hn) || {}, vt = v.vitals;
          rows.push([App.thaiDate(v.date), v.q, v.hn, App.fullName(p), v.age, v.sex, v.type, vt.sys ? vt.sys + '/' + vt.dia : '', vt.wt, vt.ht, e.c.bmiTxt, isNaN(e.c.osta) ? '' : e.c.osta.toFixed(1)]
            .concat(e.domains.map(function (x) { return x.lv === 'wait' ? '' : x.result; }))
            .concat([e.riskCount])
            .concat(e.tools.map(function (t) { var r = e.results[t.id]; return r.j.lv === 'wait' ? '' : (t.noSum ? '' : r.sum + ' ') + r.j.res; }))
            .concat([v.plan ? App.planNames(App.REFERRALS, v.plan.refs).join(', ') : '', v.plan && v.plan.next && v.plan.next.on ? App.thaiDate(v.plan.next.date) : '', v.by]));
        });
        App.download('รายงาน-คลินิกผู้สูงอายุ-' + App.TM[S.m] + (S.y + 543) + '.csv', App.csv(rows));
      }
    }
  };
})();
