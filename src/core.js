// Sizely core: turn a size or a body measurement into the matching size in
// another country's system, for shoes and clothes. No DOM in here, so the
// same file runs in the page and under `node --test`.
//
// Sizing is not standardised. The size-to-size tables below follow widely
// published conversion charts, but two brands labelled the same can differ by
// a size, so every answer carries a range and the advice to go by the body
// measurement, which is the one fixed thing. Foot length (Mondopoint, ISO
// 9407) and chest/bust/waist in centimetres are the anchors; the country
// labels hang off them.
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Sizely = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var IN = 25.4; // mm per inch

  // ---------------------------------------------------------------- shoes

  // Rows go up in order. cm is the foot length the size is cut for (the inside
  // of the shoe is a little longer). Men's and women's follow common US/UK/EU
  // charts; the UK-to-US gap is about 1 size for men and 2 for women, which is
  // why a "unisex" number never quite lines up.
  var SHOES = {
    men: [
      { us: 6, uk: 5.5, eu: 38.5, cm: 24.1 },
      { us: 6.5, uk: 6, eu: 39, cm: 24.4 },
      { us: 7, uk: 6.5, eu: 40, cm: 25.0 },
      { us: 7.5, uk: 7, eu: 40.5, cm: 25.4 },
      { us: 8, uk: 7.5, eu: 41, cm: 25.7 },
      { us: 8.5, uk: 8, eu: 42, cm: 26.0 },
      { us: 9, uk: 8.5, eu: 42.5, cm: 26.7 },
      { us: 9.5, uk: 9, eu: 43, cm: 27.0 },
      { us: 10, uk: 9.5, eu: 44, cm: 27.3 },
      { us: 10.5, uk: 10, eu: 44.5, cm: 27.9 },
      { us: 11, uk: 10.5, eu: 45, cm: 28.3 },
      { us: 11.5, uk: 11, eu: 45.5, cm: 28.6 },
      { us: 12, uk: 11.5, eu: 46, cm: 29.4 },
      { us: 13, uk: 12.5, eu: 47.5, cm: 30.2 },
      { us: 14, uk: 13.5, eu: 48.5, cm: 31.1 }
    ],
    women: [
      { us: 5, uk: 2.5, eu: 35.5, cm: 21.6 },
      { us: 5.5, uk: 3, eu: 36, cm: 22.2 },
      { us: 6, uk: 3.5, eu: 36.5, cm: 22.5 },
      { us: 6.5, uk: 4, eu: 37.5, cm: 23.0 },
      { us: 7, uk: 4.5, eu: 38, cm: 23.5 },
      { us: 7.5, uk: 5, eu: 38.5, cm: 23.8 },
      { us: 8, uk: 5.5, eu: 39, cm: 24.1 },
      { us: 8.5, uk: 6, eu: 40, cm: 24.6 },
      { us: 9, uk: 6.5, eu: 40.5, cm: 25.1 },
      { us: 9.5, uk: 7, eu: 41, cm: 25.4 },
      { us: 10, uk: 7.5, eu: 42, cm: 25.9 },
      { us: 10.5, uk: 8, eu: 42.5, cm: 26.2 },
      { us: 11, uk: 8.5, eu: 43, cm: 26.7 }
    ],
    // Kids run on foot length above all; US splits into C (little) and Y (big).
    kids: [
      { us: "10C", uk: 9.5, eu: 27, cm: 16.5 },
      { us: "11C", uk: 10.5, eu: 28, cm: 17.1 },
      { us: "12C", uk: 11.5, eu: 30, cm: 18.1 },
      { us: "13C", uk: 12.5, eu: 31, cm: 19.1 },
      { us: "1Y", uk: 13.5, eu: 32, cm: 20.0 },
      { us: "2Y", uk: 1.5, eu: 33, cm: 20.6 },
      { us: "3Y", uk: 2.5, eu: 34, cm: 21.6 },
      { us: "4Y", uk: 3.5, eu: 36, cm: 22.2 },
      { us: "5Y", uk: 4.5, eu: 37, cm: 23.0 },
      { us: "6Y", uk: 5.5, eu: 38.5, cm: 23.8 }
    ]
  };

  function numify(v) {
    if (typeof v === "number") return v;
    var n = parseFloat(String(v == null ? "" : v).replace(",", "."));
    return isFinite(n) ? n : NaN;
  }

  // Match a typed size to a row in one system. US kid sizes keep their C/Y
  // label; everything else is a number. Returns { row, index } or null.
  function findShoe(value, sys, who) {
    var table = SHOES[who] || SHOES.men;
    if (sys === "us" && who === "kids") {
      var key = String(value).toUpperCase().replace(/\s+/g, "");
      for (var i = 0; i < table.length; i++) if (String(table[i].us).toUpperCase() === key) return { row: table[i], index: i };
      return null;
    }
    var n = numify(value);
    if (!isFinite(n)) return null;
    var best = -1, diff = Infinity;
    for (var j = 0; j < table.length; j++) {
      var d = Math.abs(numify(table[j][sys]) - n);
      if (d < diff - 1e-9) { diff = d; best = j; }
    }
    // Only a match if it is within half a size; otherwise the number is off
    // the chart and we say so rather than snapping to the nearest end.
    if (best < 0 || diff > 0.75) return null;
    return { row: table[best], index: best, off: diff > 1e-9 };
  }

  // Convert a shoe size from one system to the others. Returns the matched row
  // (us/uk/eu/cm), whether the input sat exactly on a size, and a short note.
  function convertShoe(value, fromSys, who) {
    var hit = findShoe(value, fromSys, who);
    if (!hit) return { ok: false, reason: "off-chart" };
    return {
      ok: true, who: who || "men", from: fromSys,
      us: hit.row.us, uk: hit.row.uk, eu: hit.row.eu, cm: hit.row.cm,
      exact: !hit.off,
      note: hit.off ? "Rounded to the nearest size on the chart." : ""
    };
  }

  // The most reliable way in: measure the longer foot flat against a wall,
  // heel to longest toe, and read the size off the length. Between two sizes,
  // the larger is the safer buy, so that is the one returned, with the snugger
  // size noted. Length in cm.
  function shoeFromLength(cm, who) {
    var table = SHOES[who] || SHOES.men;
    var len = numify(cm);
    if (!(len > 0)) return { ok: false, reason: "bad-length" };
    if (len < table[0].cm - 0.5) return { ok: false, reason: "too-small" };
    if (len > table[table.length - 1].cm + 0.5) return { ok: false, reason: "too-big" };
    var pick = table[table.length - 1], snug = null, exact = false;
    for (var i = 0; i < table.length; i++) {
      if (len <= table[i].cm + 1e-9) {
        pick = table[i];
        snug = i > 0 ? table[i - 1] : null;
        exact = Math.abs(table[i].cm - len) <= 0.15;
        break;
      }
    }
    var between = !exact && snug && len > snug.cm + 0.15;
    return {
      ok: true, who: who || "men",
      us: pick.us, uk: pick.uk, eu: pick.eu, cm: pick.cm,
      between: !!between,
      snug: between ? { us: snug.us, uk: snug.uk, eu: snug.eu } : null,
      note: between
        ? "Your foot is between sizes. This is the roomier fit; the snugger one is shown too."
        : "This size is cut for your foot length."
    };
  }

  // -------------------------------------------------------------- clothes

  // Women's tops and dresses. Body measurements in cm are the anchor; the
  // country numbers follow the common UK = US + 4, EU = UK + 28 chart. Alpha
  // (XS-XL) is a band, so more than one numeric size shares one letter.
  var WOMENS = [
    { uk: 4, us: 0, eu: 32, alpha: "XS", bust: 80, waist: 62, hip: 86 },
    { uk: 6, us: 2, eu: 34, alpha: "XS", bust: 84, waist: 66, hip: 90 },
    { uk: 8, us: 4, eu: 36, alpha: "S", bust: 88, waist: 70, hip: 94 },
    { uk: 10, us: 6, eu: 38, alpha: "M", bust: 92, waist: 74, hip: 98 },
    { uk: 12, us: 8, eu: 40, alpha: "M", bust: 97, waist: 79, hip: 103 },
    { uk: 14, us: 10, eu: 42, alpha: "L", bust: 102, waist: 84, hip: 108 },
    { uk: 16, us: 12, eu: 44, alpha: "L", bust: 107, waist: 90, hip: 114 },
    { uk: 18, us: 14, eu: 46, alpha: "XL", bust: 113, waist: 96, hip: 120 },
    { uk: 20, us: 16, eu: 48, alpha: "XL", bust: 119, waist: 103, hip: 126 }
  ];

  // Men's tops. Chest in cm is the anchor for a jumper or t-shirt; collar in
  // cm for a formal shirt. EU jacket number is about chest_cm / 2.
  var MENS_TOP = [
    { alpha: "XS", chest: [84, 89], collar: 36, eu: 44 },
    { alpha: "S", chest: [89, 94], collar: 38, eu: 46 },
    { alpha: "M", chest: [97, 102], collar: 40, eu: 48 },
    { alpha: "L", chest: [104, 109], collar: 42, eu: 50 },
    { alpha: "XL", chest: [112, 117], collar: 44, eu: 52 },
    { alpha: "XXL", chest: [120, 125], collar: 46, eu: 54 }
  ];

  var SYS_LABEL = { uk: "UK", us: "US", eu: "EU", alpha: "S/M/L" };

  // Find the women's row for a size typed in one system.
  function findWomens(value, sys) {
    if (sys === "alpha") {
      var a = String(value).toUpperCase().replace(/\s+/g, "");
      var rows = WOMENS.filter(function (r) { return r.alpha === a; });
      return rows.length ? { rows: rows } : null;
    }
    var n = numify(value);
    if (!isFinite(n)) return null;
    for (var i = 0; i < WOMENS.length; i++) if (WOMENS[i][sys] === n) return { rows: [WOMENS[i]] };
    return null;
  }

  // Convert a women's size between systems. For a numeric input it is one row;
  // for an alpha input it is a band, so a from/to range comes back.
  function convertWomens(value, fromSys) {
    var hit = findWomens(value, fromSys);
    if (!hit) return { ok: false, reason: "off-chart" };
    var lo = hit.rows[0], hi = hit.rows[hit.rows.length - 1];
    return {
      ok: true, from: fromSys, band: hit.rows.length > 1,
      uk: span(lo.uk, hi.uk), us: span(lo.us, hi.us), eu: span(lo.eu, hi.eu),
      alpha: lo.alpha === hi.alpha ? lo.alpha : lo.alpha + "-" + hi.alpha,
      bust: span(lo.bust, hi.bust), waist: span(lo.waist, hi.waist), hip: span(lo.hip, hi.hip)
    };
  }

  function span(a, b) { return a === b ? String(a) : a + "-" + b; }

  // Women's size from a body measurement (bust, waist or hip) in cm. A
  // measurement between two sizes rounds up, since a size too small can't be
  // let out; the snugger size is noted.
  function womensFromMeasure(kind, cm) {
    var v = numify(cm);
    if (!(v > 0) || !/^(bust|waist|hip)$/.test(kind)) return { ok: false, reason: "bad" };
    if (v > WOMENS[WOMENS.length - 1][kind] + 2) return { ok: false, reason: "too-big" };
    var pick = WOMENS[0], snug = null;
    for (var i = 0; i < WOMENS.length; i++) {
      if (v <= WOMENS[i][kind] + 1e-9) { pick = WOMENS[i]; snug = i > 0 ? WOMENS[i - 1] : null; break; }
      pick = WOMENS[i];
    }
    var between = snug && v > snug[kind] + 0.5 && v < pick[kind] - 0.5;
    return {
      ok: true, kind: kind, uk: pick.uk, us: pick.us, eu: pick.eu, alpha: pick.alpha,
      between: !!between,
      snug: between ? { uk: snug.uk, us: snug.us, eu: snug.eu } : null,
      note: "Measured the fullest part, tape level and snug but not tight."
    };
  }

  // Men's top from a chest measurement in cm.
  function mensTopFromChest(cm) {
    var v = numify(cm);
    if (!(v > 0)) return { ok: false, reason: "bad" };
    var pick = null;
    for (var i = 0; i < MENS_TOP.length; i++) {
      if (v <= MENS_TOP[i].chest[1] + 1e-9) { pick = MENS_TOP[i]; break; }
    }
    if (!pick) pick = MENS_TOP[MENS_TOP.length - 1];
    return { ok: true, alpha: pick.alpha, eu: pick.eu, collar: pick.collar, chest: pick.chest };
  }

  function convertMensTop(value, fromSys) {
    if (fromSys === "alpha") {
      var a = String(value).toUpperCase().replace(/\s+/g, "");
      for (var i = 0; i < MENS_TOP.length; i++) if (MENS_TOP[i].alpha === a) return mensRow(MENS_TOP[i]);
    } else if (fromSys === "eu") {
      var n = numify(value);
      for (var j = 0; j < MENS_TOP.length; j++) if (MENS_TOP[j].eu === n) return mensRow(MENS_TOP[j]);
    }
    return { ok: false, reason: "off-chart" };
  }

  function mensRow(r) {
    return { ok: true, alpha: r.alpha, eu: r.eu, collar: r.collar, chest: r.chest };
  }

  // Trousers go by waist. The country numbers are the waist itself: inches in
  // the US and UK, centimetres (inch + about 16) on an EU label.
  function trouserWaist(value, unit) {
    var v = numify(value);
    if (!(v > 0)) return { ok: false, reason: "bad" };
    var inch = unit === "cm" ? v / IN * 10 : unit === "eu" ? v - 16 : v;
    inch = Math.round(inch);
    if (inch < 24 || inch > 48) return { ok: false, reason: "off-chart" };
    return { ok: true, inch: inch, cm: Math.round(inch * IN / 10), eu: inch + 16 };
  }

  // ------------------------------------------------------------ share link

  // The whole lookup goes in the URL fragment, which browsers never send to a
  // server, so a shared link opens on the same answer without anything leaving
  // the device.
  function pack(state) {
    var json = JSON.stringify(state);
    var b64 = typeof btoa === "function" ? btoa(unescape(encodeURIComponent(json))) : Buffer.from(json, "utf8").toString("base64");
    return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  function unpack(text) {
    try {
      var b64 = String(text).replace(/-/g, "+").replace(/_/g, "/");
      while (b64.length % 4) b64 += "=";
      var json = typeof atob === "function" ? decodeURIComponent(escape(atob(b64))) : Buffer.from(b64, "base64").toString("utf8");
      var o = JSON.parse(json);
      return o && typeof o === "object" ? o : null;
    } catch (e) { return null; }
  }

  return {
    SHOES: SHOES, WOMENS: WOMENS, MENS_TOP: MENS_TOP, SYS_LABEL: SYS_LABEL, IN: IN,
    numify: numify,
    findShoe: findShoe, convertShoe: convertShoe, shoeFromLength: shoeFromLength,
    findWomens: findWomens, convertWomens: convertWomens, womensFromMeasure: womensFromMeasure,
    mensTopFromChest: mensTopFromChest, convertMensTop: convertMensTop, trouserWaist: trouserWaist,
    pack: pack, unpack: unpack
  };
});
