// Sizely page: wire the inputs to the core and show the answer. Keeps the
// current lookup in the URL so "Copy a link" shares exactly what's on screen.
(function () {
  "use strict";
  var S = window.Sizely, T = window.Tam;
  var $ = function (id) { return document.getElementById(id); };
  var on = function (el, ev, fn) { if (el) el.addEventListener(ev, fn); };

  // ---- tabs ----
  var tabs = [["tab-shoes", "panel-shoes", "shoes"], ["tab-women", "panel-women", "clothes"], ["tab-men", "panel-men", "clothes"]];
  var current = "shoes";

  function show(which) {
    tabs.forEach(function (t) {
      var sel = t[0] === "tab-" + which;
      $(t[0]).setAttribute("aria-selected", sel ? "true" : "false");
      $(t[1]).classList.toggle("hidden", !sel);
    });
    current = which;
    if (T) T.context(which === "shoes" ? "shoes" : "clothes");
    run();
  }
  tabs.forEach(function (t) { on($(t[0]), "click", function () { show(t[0].slice(4)); }); });

  // show/hide the right field block for a radio group
  function toggleByRadio(name, attr, host) {
    var val = (document.querySelector('input[name="' + name + '"]:checked') || {}).value;
    (host || document).querySelectorAll("[" + attr + "]").forEach(function (el) {
      el.classList.toggle("hidden", el.getAttribute(attr) !== val);
    });
    return val;
  }

  function cell(k, v) { return '<div class="cell"><span class="k">' + k + '</span><span class="v">' + v + "</span></div>"; }
  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; }); }

  function bad(host, msg) {
    host.innerHTML = '<div class="result bad"><h3>Can\'t place that yet</h3><p class="msg">' + esc(msg) + "</p></div>";
  }

  // ---- shoes ----
  function runShoes() {
    var host = $("shoe-out");
    var mode = toggleByRadio("shoe-mode", "data-shoe", $("panel-shoes"));
    var who = (document.querySelector('input[name="who"]:checked') || {}).value || "men";
    if (mode === "length") {
      var len = $("foot-len").value, unit = $("foot-unit").value;
      if (!String(len).trim()) { host.innerHTML = ""; return; }
      var cm = unit === "in" ? S.numify(len) * 2.54 : S.numify(len);
      var r = S.shoeFromLength(cm, who);
      if (!r.ok) { bad(host, r.reason === "bad-length" ? "Type your foot length as a number." : "That length is off my chart. Double-check the unit."); if (T) T.react("off"); return; }
      var grid = cell("US", r.us) + cell("UK", r.uk) + cell("EU", r.eu);
      var html = '<div class="result"><h3>For a ' + Math.round(cm * 10) / 10 + ' cm foot</h3><div class="grid">' + grid + "</div>";
      html += '<p class="msg' + (r.between ? " between" : "") + '">' + esc(r.note) + "</p>";
      if (r.snug) html += '<p class="snug">Snugger fit: US ' + r.snug.us + " · UK " + r.snug.uk + " · EU " + r.snug.eu + "</p>";
      host.innerHTML = html + "</div>";
      if (T) T.react(r.between ? "between" : "ok");
    } else {
      var val = $("shoe-size").value, sys = $("shoe-sys").value;
      if (!String(val).trim()) { host.innerHTML = ""; return; }
      var c = S.convertShoe(val, sys, who);
      if (!c.ok) { bad(host, "That size isn't on the chart. Check US/UK/EU is right, or measure your foot instead."); if (T) T.react("off"); return; }
      var g = cell("US", c.us) + cell("UK", c.uk) + cell("EU", c.eu) + cell("Foot", c.cm + " cm");
      var h = '<div class="result"><h3>' + esc(who[0].toUpperCase() + who.slice(1)) + "'s shoe, from " + sys.toUpperCase() + " " + esc(val) + '</h3><div class="grid">' + g + "</div>";
      if (c.note) h += '<p class="msg">' + esc(c.note) + "</p>";
      host.innerHTML = h + "</div>";
      if (T) T.react("ok");
    }
  }

  // ---- women ----
  function runWomen() {
    var host = $("w-out");
    var mode = toggleByRadio("w-mode", "data-w", $("panel-women"));
    if (mode === "measure") {
      var m = $("w-measure").value, kind = $("w-kind").value;
      if (!String(m).trim()) { host.innerHTML = ""; return; }
      var r = S.womensFromMeasure(kind, m);
      if (!r.ok) { bad(host, r.reason === "too-big" ? "That's past my chart's largest size." : "Type your measurement in centimetres."); if (T) T.react("off"); return; }
      var grid = cell("UK", r.uk) + cell("US", r.us) + cell("EU", r.eu) + cell("Size", r.alpha);
      var html = '<div class="result"><h3>For a ' + esc(m) + " cm " + esc(kind) + '</h3><div class="grid">' + grid + "</div>";
      html += '<p class="msg' + (r.between ? " between" : "") + '">' + esc(r.note) + (r.between ? " You're between sizes, so this is the roomier pick." : "") + "</p>";
      if (r.snug) html += '<p class="snug">Snugger fit: UK ' + r.snug.uk + " · US " + r.snug.us + " · EU " + r.snug.eu + "</p>";
      host.innerHTML = html + "</div>";
      if (T) T.react(r.between ? "between" : "ok");
    } else {
      var val = $("w-size").value, sys = $("w-sys").value;
      if (!String(val).trim()) { host.innerHTML = ""; return; }
      var c = S.convertWomens(val, sys);
      if (!c.ok) { bad(host, "That size isn't on the chart. Try another system, or use a measurement."); if (T) T.react("off"); return; }
      var g = cell("UK", c.uk) + cell("US", c.us) + cell("EU", c.eu) + cell("Size", c.alpha);
      var h = '<div class="result"><h3>Women\'s, from ' + (sys === "alpha" ? "size" : sys.toUpperCase()) + " " + esc(val) + '</h3><div class="grid">' + g + "</div>";
      h += '<p class="msg">About bust ' + c.bust + " · waist " + c.waist + " · hip " + c.hip + " cm.</p>";
      host.innerHTML = h + "</div>";
      if (T) T.react(c.band ? "between" : "ok");
    }
  }

  // ---- men ----
  function runMen() {
    var host = $("m-out");
    var what = toggleByRadio("m-what", "data-m", $("panel-men"));
    if (what === "trouser") {
      var w = $("m-waist").value, unit = $("m-waist-unit").value;
      if (!String(w).trim()) { host.innerHTML = ""; return; }
      var r = S.trouserWaist(w, unit);
      if (!r.ok) { bad(host, "That waist is off the usual range. Check the number and unit."); if (T) T.react("off"); return; }
      var g = cell("Waist in", r.inch + '"') + cell("Waist cm", r.cm) + cell("EU label", r.eu);
      host.innerHTML = '<div class="result"><h3>Trousers</h3><div class="grid">' + g + '</div><p class="msg">A trouser label is just the waist. Length (inside leg) is a separate number.</p></div>';
      if (T) T.react("ok");
      return;
    }
    var mode = toggleByRadio("m-mode", "data-mtop", $('[data-m="top"]'));
    if (mode === "measure") {
      var ch = $("m-chest").value;
      if (!String(ch).trim()) { host.innerHTML = ""; return; }
      var rr = S.mensTopFromChest(ch);
      if (!rr.ok) { bad(host, "Type your chest in centimetres."); if (T) T.react("off"); return; }
      var gg = cell("Size", rr.alpha) + cell("EU", rr.eu) + cell("Collar", rr.collar + " cm");
      host.innerHTML = '<div class="result"><h3>For a ' + esc(ch) + ' cm chest</h3><div class="grid">' + gg + '</div><p class="msg">That letter fits a chest of about ' + rr.chest[0] + "-" + rr.chest[1] + " cm.</p></div>";
      if (T) T.react("ok");
    } else {
      var val = $("m-size").value, sys = $("m-sys").value;
      if (!String(val).trim()) { host.innerHTML = ""; return; }
      var c = S.convertMensTop(val, sys);
      if (!c.ok) { bad(host, "That size isn't on the chart. Try S/M/L or an EU number, or measure your chest."); if (T) T.react("off"); return; }
      var g = cell("Size", c.alpha) + cell("EU", c.eu) + cell("Collar", c.collar + " cm");
      host.innerHTML = '<div class="result"><h3>Men\'s top, from ' + (sys === "alpha" ? "size" : sys.toUpperCase()) + " " + esc(val) + '</h3><div class="grid">' + g + '</div><p class="msg">Fits a chest of about ' + c.chest[0] + "-" + c.chest[1] + " cm.</p></div>";
      if (T) T.react("ok");
    }
  }

  function run() {
    if (current === "shoes") runShoes();
    else if (current === "women") runWomen();
    else runMen();
  }

  // react to any input or choice
  document.addEventListener("input", run);
  document.addEventListener("change", run);

  // ---- share link ----
  function readState() {
    if (current === "shoes") {
      var mode = (document.querySelector('input[name="shoe-mode"]:checked') || {}).value;
      var who = (document.querySelector('input[name="who"]:checked') || {}).value;
      return mode === "length"
        ? { tab: "shoes", who: who, mode: "length", len: $("foot-len").value, unit: $("foot-unit").value }
        : { tab: "shoes", who: who, mode: "size", value: $("shoe-size").value, sys: $("shoe-sys").value };
    }
    if (current === "women") {
      var wm = (document.querySelector('input[name="w-mode"]:checked') || {}).value;
      return wm === "measure"
        ? { tab: "women", mode: "measure", value: $("w-measure").value, kind: $("w-kind").value }
        : { tab: "women", mode: "size", value: $("w-size").value, sys: $("w-sys").value };
    }
    var what = (document.querySelector('input[name="m-what"]:checked') || {}).value;
    if (what === "trouser") return { tab: "men", what: "trouser", value: $("m-waist").value, unit: $("m-waist-unit").value };
    var mm = (document.querySelector('input[name="m-mode"]:checked') || {}).value;
    return mm === "measure"
      ? { tab: "men", what: "top", mode: "measure", value: $("m-chest").value }
      : { tab: "men", what: "top", mode: "size", value: $("m-size").value, sys: $("m-sys").value };
  }

  function setRadio(name, value) { var el = document.querySelector('input[name="' + name + '"][value="' + value + '"]'); if (el) el.checked = true; }
  function setVal(id, v) { var el = $(id); if (el != null && v != null) el.value = v; }

  function applyState(s) {
    if (!s || !s.tab) return;
    if (s.tab === "shoes") {
      setRadio("who", s.who || "men"); setRadio("shoe-mode", s.mode || "size");
      if (s.mode === "length") { setVal("foot-len", s.len); setVal("foot-unit", s.unit); }
      else { setVal("shoe-size", s.value); setVal("shoe-sys", s.sys); }
      show("shoes");
    } else if (s.tab === "women") {
      setRadio("w-mode", s.mode || "size");
      if (s.mode === "measure") { setVal("w-measure", s.value); setVal("w-kind", s.kind); }
      else { setVal("w-size", s.value); setVal("w-sys", s.sys); }
      show("women");
    } else if (s.tab === "men") {
      setRadio("m-what", s.what || "top");
      if (s.what === "trouser") { setVal("m-waist", s.value); setVal("m-waist-unit", s.unit); }
      else { setRadio("m-mode", s.mode || "size"); if (s.mode === "measure") setVal("m-chest", s.value); else { setVal("m-size", s.value); setVal("m-sys", s.sys); } }
      show("men");
    }
  }

  on($("share"), "click", function () {
    var link = location.origin + location.pathname + "#" + S.pack(readState());
    var done = $("share-done");
    function ok() { done.textContent = "Link copied"; setTimeout(function () { done.textContent = ""; }, 2500); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(ok, function () { prompt("Copy this link:", link); });
    else prompt("Copy this link:", link);
  });

  // restore from a shared link, then start
  var restored = false;
  if (location.hash.length > 1) { var st = S.unpack(location.hash.slice(1)); if (st) { applyState(st); restored = true; } }
  if (!restored) show("shoes");
})();
