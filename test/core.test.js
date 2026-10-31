"use strict";
var test = require("node:test");
var assert = require("node:assert");
var S = require("../src/core.js");

test("a men's US size converts to UK, EU and foot length", function () {
  var r = S.convertShoe(9, "us", "men");
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.uk, 8.5);
  assert.strictEqual(r.eu, 42.5);
  assert.strictEqual(r.exact, true);
});

test("a women's EU size converts back to US and UK", function () {
  var r = S.convertShoe(38, "eu", "women");
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.us, 7);
  assert.strictEqual(r.uk, 4.5);
});

test("kids keep the C/Y label", function () {
  var r = S.convertShoe("1Y", "us", "kids");
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.eu, 32);
  assert.strictEqual(r.uk, 13.5);
});

test("a number off the end of the chart is reported, not snapped", function () {
  var r = S.convertShoe(30, "us", "men");
  assert.strictEqual(r.ok, false);
  assert.strictEqual(r.reason, "off-chart");
});

test("a size between two is rounded with a note", function () {
  var r = S.convertShoe(9.25, "us", "men");
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.exact, false);
  assert.ok(r.note.length > 0);
});

test("foot length picks the size cut for it", function () {
  var r = S.shoeFromLength(26.0, "men");
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.eu, 42);
  assert.strictEqual(r.between, false);
});

test("a foot between sizes returns the roomier fit plus the snug one", function () {
  var r = S.shoeFromLength(26.35, "men");
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.between, true);
  assert.ok(r.snug && r.snug.eu < r.eu);
});

test("a foot off the chart is refused both ways", function () {
  assert.strictEqual(S.shoeFromLength(10, "men").ok, false);
  assert.strictEqual(S.shoeFromLength(40, "men").ok, false);
});

test("a women's UK dress size converts to US and EU", function () {
  var r = S.convertWomens(12, "uk");
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.us, "8");
  assert.strictEqual(r.eu, "40");
  assert.strictEqual(r.band, false);
});

test("an alpha women's size comes back as a band", function () {
  var r = S.convertWomens("M", "alpha");
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.band, true);
  assert.strictEqual(r.uk, "10-12");
});

test("a bust measurement rounds up when it falls between sizes", function () {
  var r = S.womensFromMeasure("bust", 95);
  assert.strictEqual(r.ok, true);
  // 95 cm is between the 92 (UK10) and 97 (UK12) rows, so it rounds to UK12.
  assert.strictEqual(r.uk, 12);
  assert.strictEqual(r.between, true);
  assert.ok(r.snug && r.snug.uk === 10);
});

test("a bust sitting on a size is not flagged as between", function () {
  var r = S.womensFromMeasure("bust", 92);
  assert.strictEqual(r.uk, 10);
  assert.strictEqual(r.between, false);
});

test("a men's chest in cm maps to a letter and EU jacket size", function () {
  var r = S.mensTopFromChest(100);
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.alpha, "M");
  assert.strictEqual(r.eu, 48);
});

test("a men's L converts to an EU jacket number and a collar", function () {
  var r = S.convertMensTop("L", "alpha");
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.eu, 50);
  assert.strictEqual(r.collar, 42);
});

test("trouser waist converts between inches, cm and EU", function () {
  var r = S.trouserWaist(32, "in");
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.cm, 81);
  assert.strictEqual(r.eu, 48);
  var back = S.trouserWaist(48, "eu");
  assert.strictEqual(back.inch, 32);
});

test("a share link round-trips the lookup", function () {
  var state = { tab: "shoes", who: "men", sys: "us", value: "9" };
  var out = S.unpack(S.pack(state));
  assert.deepStrictEqual(out, state);
});

test("a broken share link is refused, not thrown", function () {
  assert.strictEqual(S.unpack("@@@not-base64@@@"), null);
});

test("kids' size from height anchors on the EU height number", () => {
  const r = S.kidsFromHeight(104);
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.eu, 104);
  assert.strictEqual(r.us, "4T");
  assert.strictEqual(r.uk, "4-5y");
});

test("a height between kids' sizes rounds up to the roomier one", () => {
  const r = S.kidsFromHeight(101); // between the 98 and 104 bands
  assert.strictEqual(r.eu, 104);   // rounds up
  assert.strictEqual(r.between, true);
  assert.strictEqual(r.snug.eu, 98);
});

test("a kid's height off the chart is refused, not snapped", () => {
  assert.strictEqual(S.kidsFromHeight(40).ok, false);
  assert.strictEqual(S.kidsFromHeight(300).ok, false);
  assert.strictEqual(S.kidsFromHeight("nope").ok, false);
});

test("convert a kid's US toddler size to EU height and UK age", () => {
  const r = S.convertKids("2T", "us");
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.eu, 92);
  assert.strictEqual(r.uk, "2-3y");
  assert.strictEqual(r.height, "86-92");
});

test("convert a kid's EU size number to the US and UK labels", () => {
  const r = S.convertKids(110, "eu");
  assert.strictEqual(r.us, "5");
  assert.strictEqual(r.uk, "5-6y");
});

test("an unknown kid's size is off-chart", () => {
  assert.strictEqual(S.convertKids(999, "eu").ok, false);
  assert.strictEqual(S.convertKids("99Z", "us").ok, false);
});

test("ring: EU size is the inner circumference (ISO 8653)", function () {
  var r = S.ringFromCircumference(54.4, "mm");
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.eu, 54);
  assert.strictEqual(r.us, 7);     // 54.4 mm is the US 7 row
  assert.strictEqual(r.uk, "N");
  assert.ok(r.approxUsUk);
});

test("ring: US 6 lines up with ~51.9 mm", function () {
  var r = S.convertRing(6, "us");
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.circMm, 51.9);
  assert.strictEqual(r.eu, 52);
  assert.strictEqual(r.uk, "L");
});

test("ring: a UK letter converts both ways", function () {
  var r = S.convertRing("n", "uk");
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.us, 7);
  assert.strictEqual(r.eu, 54);
});

test("ring: diameter input matches the circumference it implies", function () {
  var byCirc = S.ringFromCircumference(54.4, "mm");
  var byDia = S.ringFromDiameter(54.4 / Math.PI, "mm");
  assert.strictEqual(byDia.us, byCirc.us);
  assert.strictEqual(byDia.eu, byCirc.eu);
});

test("ring: a between-sizes circumference is flagged as rounded", function () {
  var r = S.ringFromCircumference(55.0, "mm"); // between 54.4 (US7) and 55.7 (US7.5)
  assert.strictEqual(r.ok, true);
  assert.strictEqual(r.off, true);
});

test("ring: off-chart sizes are refused, not snapped", function () {
  assert.strictEqual(S.ringFromCircumference(30, "mm").reason, "too-small");
  assert.strictEqual(S.ringFromCircumference(90, "mm").reason, "too-big");
  assert.strictEqual(S.convertRing("ZZ", "uk").reason, "off-chart");
});
