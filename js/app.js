/* =========================================================
 * app.js — router (#/หน้า/พารามิเตอร์) และการจัดการเหตุการณ์
 *
 * แต่ละหน้า (App.views.xxx) มี:
 *   render(arg)          → คืน HTML ของหน้า
 *   actions[name](el,ev) → เรียกเมื่อคลิกปุ่มที่มี data-act="name"
 *   field(name,val,el)   → เรียกเมื่อช่องกรอก data-f="name" เปลี่ยนค่า (คืน true = วาดหน้าใหม่)
 * ========================================================= */
(function () {
  'use strict';
  var App = window.App;
  App.views = App.views || {};

  function current() {
    var h = location.hash.replace(/^#\/?/, '') || 'register';
    var parts = h.split('/');
    return { name: parts[0], arg: decodeURIComponent(parts.slice(1).join('/')) };
  }

  /** วาดหน้าใหม่ โดยคงตำแหน่งเลื่อนและช่องที่กำลังพิมพ์ไว้ */
  App.render = function () {
    var r = current();
    var view = App.views[r.name];
    if (!view) { location.hash = '#/register'; return; }
    App.view = view; App.arg = r.arg;
    var active = document.activeElement, focusId = active && active.id, sel = null;
    try { if (focusId && active.selectionStart != null) sel = [active.selectionStart, active.selectionEnd]; } catch (e) { /* input type ไม่รองรับ */ }
    var y = window.scrollY;
    var html;
    try { html = view.render(r.arg); }
    catch (err) { console.error(err); html = App.header() + '<main class="wrap"><div class="card err-msg">เกิดข้อผิดพลาด: ' + App.esc(err.message) + '</div></main>'; }
    document.getElementById('app').innerHTML = html;
    document.title = (view.title || 'OPD Paperless') + ' · คลินิกผู้สูงอายุ รพ.บ้านกรวด';
    window.scrollTo(0, y);
    if (focusId) {
      var el = document.getElementById(focusId);
      if (el) { el.focus({ preventScroll: true }); try { if (sel) el.setSelectionRange(sel[0], sel[1]); } catch (e) { /* ignore */ } }
    }
  };

  App.go = function (hash) {
    if (location.hash === hash) App.render(); else location.hash = hash;
  };

  window.addEventListener('hashchange', function () { App.render(); window.scrollTo(0, 0); });

  /* ---------- คลิก ---------- */
  document.addEventListener('click', function (ev) {
    var t = ev.target.closest('[data-act]');
    if (!t || !App.view) return;
    var name = t.getAttribute('data-act');
    var fn = (App.view.actions && App.view.actions[name]) || App.actions[name];
    if (!fn) return;
    ev.preventDefault();
    fn(t, ev);
  });

  /* ---------- ช่องกรอก ---------- */
  function onField(ev) {
    var t = ev.target;
    if (!t.matches || !t.matches('[data-f]') || !App.view || !App.view.field) return;
    if (ev.type === 'input' && (t.type === 'checkbox' || t.type === 'radio' || t.type === 'file' || t.type === 'date' || t.tagName === 'SELECT')) return;
    var val = t.type === 'checkbox' ? t.checked : t.value;
    var redraw = App.view.field(t.getAttribute('data-f'), val, t, ev.type);
    if (redraw) App.render();
  }
  document.addEventListener('change', onField);
  document.addEventListener('input', onField);

  /* ---------- action ที่ใช้ได้ทุกหน้า ---------- */
  App.actions = {
    print: function () { window.print(); },
    go: function (el) { App.go(el.getAttribute('data-to')); }
  };

  /* ---------- เริ่มทำงาน ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    App.render();
    App.flush();
  });
  if (document.readyState !== 'loading') { App.render(); }

  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () { /* ใช้ออนไลน์ได้ตามปกติ */ }); });
  }
})();
