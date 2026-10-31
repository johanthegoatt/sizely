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

  // ---------------------------------------------------------- kids' clothes

  // Children's clothing splits by system in an awkward way: Europe sizes by the
  // child's HEIGHT in centimetres (the EU number is the height), while the US
  // and UK go by age, which only roughly tracks height because children of the
  // same age vary a lot. Height is the one fixed anchor, so Sizely keys on it:
  // each row is a height band in cm, the EU size (its upper bound), the common
  // US size (toddler "T" sizes, then numbers) and the UK age label. Ages are a
  // guide; the height is what to trust. Figures follow widely published
  // international children's size charts.
  var KIDS = [
    { h: [80, 86],  eu: 86,  us: "18-24M", uk: "18-24m" },
    { h: [86, 92],  eu: 92,  us: "2T",     uk: "2-3y" },
    { h: [92, 98],  eu: 98,  us: "3T",     uk: "3-4y" },
    { h: [98, 104], eu: 104, us: "4T",     uk: "4-5y" },
    { h: [104, 110], eu: 110, us: "5",     uk: "5-6y" },
    { h: [110, 116], eu: 116, us: "6",     uk: "6-7y" },
    { h: [116, 122], eu: 122, us: "7",     uk: "7-8y" },
    { h: [122, 128], eu: 128, us: "8",     uk: "8-9y" },
    { h: [128, 140], eu: 140, us: "10",    uk: "9-10y" },
    { h: [140, 152], eu: 152, us: "12",    uk: "11-12y" }
  ];

  // A kid's size from height in cm, the recommended route. A height between two
  // sizes rounds UP to the roomier one (a child grows into it, and a size too
  // small can't be let out); the snugger size is noted. Off the chart either
  // way is refused rather than snapped to an end.
  function kidsFromHeight(cm) {
    var v = numify(cm);
    if (!(v > 0)) return { ok: false, reason: "bad" };
    var first = KIDS[0], last = KIDS[KIDS.length - 1];
    if (v < first.h[0] - 0.5) return { ok: false, reason: "too-small" };
    if (v > last.h[1] + 0.5) return { ok: false, reason: "too-big" };
    var pick = last, snug = null;
    for (var i = 0; i < KIDS.length; i++) {
      if (v <= KIDS[i].h[1] + 1e-9) {
        pick = KIDS[i];
        snug = i > 0 ? KIDS[i - 1] : null;
        break;
      }
    }
    // "Between" when the height is above the snugger size's top by a clear
    // margin, i.e. it genuinely sits inside this band rather than on its edge.
    var between = !!snug && v > snug.h[1] + 0.5 && v < pick.h[1] - 0.5;
    return {
      ok: true, height: v,
      eu: pick.eu, us: pick.us, uk: pick.uk,
      between: between,
      snug: between ? { eu: snug.eu, us: snug.us, uk: snug.uk } : null,
      note: "Measure the child's standing height without shoes. Ages are a guide; go by the height."
    };
  }

  // Convert a kid's size typed in one system to the others. EU is matched on
  // the number (the height), US on its label (2T, 5, 10...). UK age labels are
  // too loose to type, so the UK comes out of a match, not into one.
  function convertKids(value, fromSys) {
    var row = null;
    if (fromSys === "eu") {
      var n = numify(value);
      for (var i = 0; i < KIDS.length; i++) if (KIDS[i].eu === n) { row = KIDS[i]; break; }
    } else if (fromSys === "us") {
      var a = String(value).toUpperCase().replace(/\s+/g, "");
      for (var j = 0; j < KIDS.length; j++) if (String(KIDS[j].us).toUpperCase() === a) { row = KIDS[j]; break; }
    }
    if (!row) return { ok: false, reason: "off-chart" };
    return {
      ok: true, from: fromSys,
      eu: row.eu, us: row.us, uk: row.uk,
      height: row.h[0] + "-" + row.h[1],
      note: "Ages and US sizes vary by brand; the height band is the fixed one."
    };
  }

  // ------------------------------------------------------------ share link

  // The whole lookup goes in the URL fragment, which browsers never send to a
  // server, so a shared link opens on the same answer without anything leaving
  // the device.
  // ---------------------------------------------------------------- rings

  // Ring sizes are the one thing you genuinely can't eyeball. The fixed anchor
  // is the inner circumference in millimetres: ISO 8653 defines the EU/ISO size
  // as exactly that number (a 54 mm circumference is EU 54). The US scale and
  // the UK letters have no clean formula to mm and differ a little between
  // charts, so they're given from a lookup and flagged as approximate; the EU
  // number and the diameter are exact. Circumferences are the commonly
  // published half-size steps (US 6 = 51.9 mm, US 7 = 54.4 mm line up with the
  // standard chart).
  var RINGS = [
    { circ: 44.2, us: 3, uk: "F" }, { circ: 45.5, us: 3.5, uk: "G" },
    { circ: 46.8, us: 4, uk: "H" }, { circ: 48.0, us: 4.5, uk: "I" },
    { circ: 49.3, us: 5, uk: "J" }, { circ: 50.6, us: 5.5, uk: "K" },
    { circ: 51.9, us: 6, uk: "L" }, { circ: 53.1, us: 6.5, uk: "M" },
    { circ: 54.4, us: 7, uk: "N" }, { circ: 55.7, us: 7.5, uk: "O" },
    { circ: 57.0, us: 8, uk: "P" }, { circ: 58.3, us: 8.5, uk: "Q" },
    { circ: 59.5, us: 9, uk: "R" }, { circ: 60.8, us: 9.5, uk: "S" },
    { circ: 62.1, us: 10, uk: "T" }, { circ: 63.4, us: 10.5, uk: "U" },
    { circ: 64.6, us: 11, uk: "V" }, { circ: 65.9, us: 11.5, uk: "W" },
    { circ: 67.2, us: 12, uk: "Y" }, { circ: 68.5, us: 12.5, uk: "Z" }
  ];
  var PI = Math.PI;
  function round1(x) { return Math.round(x * 10) / 10; }

  function ringRow(row, off) {
    return {
      ok: true,
      circMm: round1(row.circ),
      diameterMm: round1(row.circ / PI),
      us: row.us, uk: row.uk,
      eu: Math.round(row.circ),       // ISO 8653: EU size == inner circumference
      off: !!off,
      approxUsUk: true                // US and UK are from a chart, not a formula
    };
  }

  // From the inner circumference (what you get measuring a string round the
  // finger, or an existing ring's inside with a tape).
  function ringFromCircumference(value, unit) {
    var n = numify(value);
    if (!isFinite(n)) return { ok: false, reason: "bad" };
    var mm = unit === "in" ? n * IN : n;
    if (mm < RINGS[0].circ - 2) return { ok: false, reason: "too-small" };
    if (mm > RINGS[RINGS.length - 1].circ + 2) return { ok: false, reason: "too-big" };
    var best = 0, bd = Infinity;
    for (var i = 0; i < RINGS.length; i++) {
      var d = Math.abs(RINGS[i].circ - mm);
      if (d < bd - 1e-9) { bd = d; best = i; }
    }
    var out = ringRow(RINGS[best], bd > 0.5);
    out.inputCircMm = round1(mm);
    return out;
  }

  // From the inside diameter (measuring across an existing ring).
  function ringFromDiameter(value, unit) {
    var n = numify(value);
    if (!isFinite(n)) return { ok: false, reason: "bad" };
    var mm = unit === "in" ? n * IN : n;
    return ringFromCircumference(mm * PI, "mm");
  }

  // Convert a known size in one system to the rest. EU is the circumference, so
  // it goes straight through the circumference lookup.
  function convertRing(value, fromSys) {
    var f = String(fromSys == null ? "" : fromSys).toLowerCase();
    if (f === "eu") return ringFromCircumference(value, "mm");
    if (f === "us") {
      var n = numify(value);
      if (!isFinite(n)) return { ok: false, reason: "bad" };
      var best = -1, bd = Infinity;
      for (var i = 0; i < RINGS.length; i++) {
        var d = Math.abs(RINGS[i].us - n);
        if (d < bd - 1e-9) { bd = d; best = i; }
      }
      if (best < 0 || bd > 0.75) return { ok: false, reason: "off-chart" };
      return ringRow(RINGS[best], bd > 1e-9);
    }
    if (f === "uk") {
      var key = String(value == null ? "" : value).trim().toUpperCase();
      for (var j = 0; j < RINGS.length; j++) if (RINGS[j].uk === key) return ringRow(RINGS[j], false);
      return { ok: false, reason: "off-chart" };
    }
    return { ok: false, reason: "bad" };
  }

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
    SHOES: SHOES, WOMENS: WOMENS, MENS_TOP: MENS_TOP, KIDS: KIDS, SYS_LABEL: SYS_LABEL, IN: IN,
    numify: numify,
    findShoe: findShoe, convertShoe: convertShoe, shoeFromLength: shoeFromLength,
    findWomens: findWomens, convertWomens: convertWomens, womensFromMeasure: womensFromMeasure,
    mensTopFromChest: mensTopFromChest, convertMensTop: convertMensTop, trouserWaist: trouserWaist,
    kidsFromHeight: kidsFromHeight, convertKids: convertKids,
    RINGS: RINGS, ringFromCircumference: ringFromCircumference, ringFromDiameter: ringFromDiameter, convertRing: convertRing,
    pack: pack, unpack: unpack
  };
});
