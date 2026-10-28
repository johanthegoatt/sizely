# Sizely

Your clothes and shoe size in another country's sizes. Pick a system you know
(US, UK or EU) and read off the rest, or measure once and let Sizely find the
size for you. Covers shoes, women's clothes, men's clothes and kids' clothes.
It runs in the browser; nothing you type is uploaded.

Live: https://sizely.johanthegoat.xyz

## Why

Online clothing is returned more than almost anything else people buy, and the
single biggest reason is the size being wrong, not the price or the look. One
survey of apparel brands put size and fit at the top of the list by a wide
margin, well ahead of colour or damage, and online clothing return rates run
far above the shop average. A big part of that is simply that a US 9, a UK 8.5
and an EU 42.5 are the same shoe, and nobody carries the chart in their head.

Sizely does two things about that:

- **Convert a size you already know.** Type a US, UK or EU size and get the
  others, with the body measurement it's cut for.
- **Start from a measurement.** Foot length for shoes, chest, bust, waist or
  hip for clothes. This is the reliable path, because a measurement in
  centimetres means the same thing everywhere; a label doesn't.

## How it's built

- **One small engine, no framework.** `src/core.js` holds the size tables and
  the lookups and runs with no page around it, so the same code is tested under
  `node --test` and used live. `npm test` runs 17 checks.
- **Nothing leaves the device.** The lookup is done in the browser. "Copy a
  link" packs the current size into the URL fragment, which browsers never send
  to a server, so a shared link opens on the same answer without a round trip.
- **Honest about tolerance.** Sizing isn't standardised, so every answer carries
  the measurement it maps to, and a measurement that lands between two sizes
  rounds up to the roomier one (taking a garment in is easier than letting it
  out) with the snugger size shown too. A number off the end of the chart is
  reported, not snapped to the nearest size.
- **Tam the tape measure** gives a tip when tapped, cheers a clean match and
  looks careful when you're between sizes. Everything Tam says is in a live
  region so it's read aloud, and all the motion stops under
  `prefers-reduced-motion`.

## The size data

Shoe sizes are anchored on foot length (the ISO 9407 / Mondopoint idea: the
size is cut for a foot of a given length). Clothing sizes are anchored on the
body measurement in centimetres. Kids' clothes are anchored on the child's
height: Europe sizes children by height in centimetres (the EU number is the
height), while the US and UK go by age, which only roughly tracks height, so
the height band is treated as the fixed one and the ages as a guide. The
country-to-country numbers follow the widely published conversion charts
(women's UK = US + 4, EU = UK + 28; men's
jacket EU ≈ chest in cm ÷ 2; a trouser label is the waist itself). Treat them
as a well-aligned guide, not a guarantee, and check a brand's own size guide
where it matters.

Sources:
- [Coresight Research — apparel returns, size and fit the top reason](https://coresight.com/research/the-true-cost-of-apparel-returns-alarming-return-rates-require-loss-minimization-solutions)
- [National Retail Federation — US online return rates](https://nrf.com/research/2024-consumer-returns-retail-industry)
- [ISO 9407 — shoe sizes, Mondopoint system](https://www.iso.org/standard/60550.html)

## Run it

```
npm test        # the engine checks
```

Open `index.html` in a browser for the page itself; there is no build step.

## Licence

MIT. See [LICENSE](LICENSE).
