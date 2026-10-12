/* =========================================================
 * หน้า "ค้นประวัติ" (รายชื่อผู้ป่วย) และ "ประวัติผู้ป่วยรายบุคคล"
 * ========================================================= */
(function () {
  'use strict';
  var App = window.App, esc = App.esc, I = App.icon;
  var S = { q: '' };

  App.views.patients = {
    title: 'ค้นประวัติ',
    render: function () {
      var q = S.q.trim().toLowerCase();
      var list = Object.keys(App.db.patients).map(function (hn) { return App.db.patients[hn]; })
        .filter(function (p) { return !q || (p.hn + ' ' + App.fullName(p)).toLowerCase().indexOf(q) >= 0; })
        .map(function (p) { var vs = App.visitsOf(p.hn); return { p: p, n: vs.length, last: vs.length ? vs[vs.length - 1] : null }; })
        .sort(function (a, b) { return (b.last ? b.last.date : '') < (a.last ? a.last.date : '') ? -1 : 1; });
      return App.header('patients') + '<main class="wrap stack lg">' +
        App.pageHead('search', 'var(--purple-soft)', '#5b3fe0', 'ค้นประวัติผู้ป่วย', 'ค้นด้วยชื่อหรือ HN · กดชื่อเพื่อดูผลประเมินทุกครั้ง') +
        '<div class="card"><label class="lbl" for="pt-q">ค้นหา</label><input class="inp" id="pt-q" data-f="q" value="' + esc(S.q) + '" placeholder="พิมพ์ชื่อ หรือ HN" autocomplete="off"></div>' +
        '<section class="card stack"><div class="small muted">' + list.length + ' ราย</div>' +
        (list.length ? '<div class="tablebox"><table><thead><tr><th>HN</th><th>ชื่อ-สกุล</th><th>อายุ</th><th>มาครั้งล่าสุด</th><th class="c">จำนวนครั้ง</th><th>ด้านที่เสี่ยงล่าสุด</th></tr></thead><tbody>' +
          list.map(function (x) {
            var e = x.last ? App.evaluate(x.last) : null;
            return '<tr><td>' + esc(x.p.hn) + '</td><td><a href="#/patient/' + encodeURIComponent(x.p.hn) + '"><b>' + esc(App.fullName(x.p)) + '</b></a></td><td>' + esc(x.p.age || '') + '</td>' +
              '<td>' + (x.last ? esc(App.thaiDate(x.last.date)) : '<span class="muted">มีแต่นัด</span>') + '</td><td class="c">' + x.n + '</td>' +
              '<td>' + (e ? (e.riskCount ? '<span class="pill lv-risk">' + e.riskCount + ' ด้าน</span> ' + esc(e.riskNames.join(', ')) : '<span class="pill lv-ok">ไม่พบ</span>') : '') + '</td></tr>';
          }).join('') + '</tbody></table></div>'
          : '<div class="empty">' + I('search', '#8b5cf6', 30) + '<b>' + (q ? 'ไม่พบผู้ป่วยที่ค้นหา' : 'ยังไม่มีข้อมูลผู้ป่วย') + '</b><span>ข้อมูลผู้ป่วยจะเพิ่มเมื่อลงนัดหรือลงทะเบียน</span></div>') +
        '</section></main>';
    },
    field: function (name, val) { S.q = val; App.render(); return false; }
  };

  App.views.patient = {
    title: 'ประวัติผู้ป่วย',
    render: function (hn) {
      var p = App.patient(hn);
      if (!p) return App.header('patients') + '<main class="wrap"><div class="empty"><b>ไม่พบผู้ป่วย HN ' + esc(hn) + '</b><a class="btn primary" href="#/patients">กลับไปค้นหา</a></div></main>';
      var vs = App.visitsOf(hn), evs = vs.map(function (v) { return App.evaluate(v); });
      var last = evs[evs.length - 1], prev = evs[evs.length - 2];
      var appts = App.db.appts.filter(function (a) { return a.hn === hn && a.date >= App.today() && !a.visitId; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
      var show = vs.slice(-6), showE = evs.slice(-6);

      var grid = App.DOMAINS.map(function (d, di) {
        return '<tr><td>' + d.no + '. ' + esc(d.title) + '</td>' + showE.map(function (e) {
          var x = e.domains[di];
          return '<td style="padding:4px 6px"><div class="cell ' + (x.lv === 'risk' ? 'lv-risk' : x.lv === 'ok' ? 'lv-ok' : 'lv-wait') + '">' + (x.lv === 'risk' ? 'เสี่ยง' : x.lv === 'ok' ? '' : '–') + '</div></td>';
        }).join('') + '</tr>';
      }).join('') + '<tr><td>13. OSTA</td>' + showE.map(function (e) {
        var l = e.c.ostaLv;
        return '<td style="padding:4px 6px"><div class="cell ' + (l === 'สูง' ? 'lv-risk' : l === 'ปานกลาง' ? 'lv-mid' : l ? 'lv-ok' : 'lv-wait') + '">' + esc(l || '–') + '</div></td>';
      }).join('') + '</tr>';

      var vit = vs.slice().reverse().map(function (v) {
        var e = App.evaluate(v), vt = v.vitals;
        return '<tr><td><a href="#/plan/' + v.id + '">' + esc(App.thaiDate(v.date)) + '</a></td><td' + (e.c.bpHigh ? ' style="color:#8a3f0a;font-weight:700"' : '') + '>' + esc(vt.sys ? vt.sys + '/' + vt.dia : '–') + '</td>' +
          '<td>' + esc(vt.wt || '–') + '</td><td>' + esc(e.c.bmiTxt || '–') + '</td><td>' + esc(isNaN(e.c.osta) ? '–' : e.c.osta.toFixed(1)) + '</td>' +
          '<td>' + esc(v.plan ? App.planNames(App.REFERRALS, v.plan.refs).concat(App.planNames(App.EDUS, v.plan.edus)).join(', ') : '') + '</td><td>' + esc(v.by) + '</td></tr>';
      }).join('');

      return App.header('patients') + '<main class="wrap stack lg">' +
        '<div class="row between"><div class="pagehead"><span class="ico lg" style="background:#8b5cf6;color:#fff;font:700 20px var(--f-head)">' + esc((p.first || '?').slice(0, 1)) + '</span>' +
        '<div><h1>' + esc(App.fullName(p)) + '</h1><div class="muted">HN ' + esc(p.hn) + ' · ' + esc(p.sex || '') + ' ' + esc(p.age || '') + ' ปี' + (p.cg ? ' · ผู้ดูแล: ' + esc(p.cg) : '') + (p.tel ? ' · โทร ' + esc(p.tel) : '') + '</div></div></div>' +
        '<div class="row noprint">' + App.exportButtons('csv') + '<a class="btn primary" href="#/register">เปิด visit ใหม่</a></div></div>' +
        '<div class="grid g4">' +
        '<div class="card stat"><div class="small muted">มาคลินิก</div><div class="v">' + vs.length + ' ครั้ง</div><div class="tiny muted">' + (vs.length ? 'ตั้งแต่ ' + esc(App.thaiDate(vs[0].date)) : '') + '</div></div>' +
        '<div class="card stat"><div class="small muted">ด้านที่เสี่ยง ล่าสุด</div><div class="v" style="color:#8a3f0a">' + (last ? last.riskCount : '–') +
        (last && prev ? ' <span style="font-size:15px">' + (last.riskCount > prev.riskCount ? '▲' : last.riskCount < prev.riskCount ? '▼' : '=') + ' จาก ' + prev.riskCount + '</span>' : '') + '</div></div>' +
        '<div class="card stat"><div class="small muted">BP ล่าสุด</div><div class="v">' + (last && vs[vs.length - 1].vitals.sys ? esc(vs[vs.length - 1].vitals.sys + '/' + vs[vs.length - 1].vitals.dia) : '–') + '</div></div>' +
        '<div class="card stat"><div class="small muted">นัดครั้งถัดไป</div><div class="v" style="font-size:20px">' + (appts.length ? esc(App.thaiDate(appts[0].date)) : '–') + '</div><div class="tiny muted">' + (appts.length ? esc(appts[0].time + ' น. ' + App.prepText(appts[0])) : '') + '</div></div>' +
        '</div>' +
        (vs.length ? '<section class="card stack"><div class="row between"><h2>ผลประเมินเบื้องต้น 13 ข้อ แต่ละครั้ง</h2><div class="chips"><span class="pill lv-risk">เสี่ยง</span><span class="pill lv-ok">ปกติ</span><span class="pill lv-wait">ไม่ได้ประเมิน</span></div></div>' +
          '<div class="tablebox"><table style="min-width:640px"><thead><tr><th style="width:240px">ด้าน</th>' + show.map(function (v) { return '<th class="c">' + esc(App.thaiDate(v.date)) + '</th>'; }).join('') + '</tr></thead><tbody>' + grid + '</tbody></table></div></section>' +
          '<section class="card stack"><h2>สัญญาณชีพและแผนการดูแล</h2><div class="tablebox"><table style="min-width:760px"><thead><tr><th>วันที่</th><th>BP</th><th>น้ำหนัก</th><th>BMI</th><th>OSTA</th><th>ส่งต่อ / สุขศึกษา</th><th>ผู้บันทึก</th></tr></thead><tbody>' + vit + '</tbody></table></div></section>'
          : '<div class="empty"><b>ยังไม่มีประวัติการมารับบริการ</b></div>') +
        '</main>';
    },
    actions: {
      csv: function () {
        var hn = App.arg, p = App.patient(hn), vs = App.visitsOf(hn);
        var rows = [['ชื่อ-สกุล', App.fullName(p), 'HN', hn], []];
        var head = ['ด้าน'].concat(vs.map(function (v) { return App.thaiDate(v.date); }));
        rows.push(head);
        var evs = vs.map(function (v) { return App.evaluate(v); });
        App.DOMAINS.forEach(function (d, i) { rows.push([d.no + '. ' + d.title].concat(evs.map(function (e) { return e.domains[i].result; }))); });
        rows.push(['13. OSTA'].concat(evs.map(function (e) { return e.c.ostaLv; })));
        rows.push(['BP'].concat(vs.map(function (v) { return v.vitals.sys ? v.vitals.sys + '/' + v.vitals.dia : ''; })));
        rows.push(['น้ำหนัก'].concat(vs.map(function (v) { return v.vitals.wt || ''; })));
        rows.push(['BMI'].concat(evs.map(function (e) { return e.c.bmiTxt; })));
        rows.push(['ประเมินละเอียด'].concat(evs.map(function (e) { return e.detailText.join(' | '); })));
        App.download('ประวัติ-HN' + App.safeName(hn) + '.csv', App.csv(rows));
      }
    }
  };
})();
