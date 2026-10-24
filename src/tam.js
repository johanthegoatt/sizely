// Tam, the tape measure who helps you read your size. Tam gives a tip when
// tapped, cheers when a size lands cleanly, looks careful when you're between
// sizes, and unspools a little tape if you tap five times fast. Everything Tam
// says goes through the bubble's live region, so it's read aloud too.
(function () {
  "use strict";
  var btn = document.getElementById("tam");
  var bubble = document.getElementById("tam-bubble");
  var dock = document.getElementById("tam-dock");
  var hide = document.getElementById("tam-hide");
  if (!btn) { window.Tam = { react: function () {}, context: function () {}, say: function () {} }; return; }

  var still = matchMedia("(prefers-reduced-motion: reduce)");
  var baseMood = "sleepy", tipKey = "start";
  var bubbleTimer = null, flashTimer = null, taps = [], tipAt = {};

  var TIPS = {
    start: [
      "Hi, I'm Tam! Pick what you're sizing, then tell me a size or a measurement.",
      "Not sure of your size? Switch to the measure option and I'll read it off for you.",
      "Measure once, keep the number. It works in any country's sizes."
    ],
    shoes: [
      "Stand on paper with your heel to a wall and mark your longest toe. That's your foot length.",
      "Feet aren't a matched pair. Measure the bigger one and size to that.",
      "Shoes change shape in the afternoon when your feet are at their biggest. Measure then."
    ],
    clothes: [
      "Keep the tape level and snug, not tight, over the fullest part.",
      "Between two sizes? I'll nudge you to the bigger one. Taking in is easier than letting out.",
      "A letter like M can cover two number sizes, so I show the range."
    ],
    result: [
      "These line up with the common charts, but brands drift. Check the label's own size guide too.",
      "If you're on the edge, the measurement wins over the number every time.",
      "Happy with it? Tap 'Copy a link' to keep this to hand or send it on."
    ]
  };

  function setMood(m) { btn.setAttribute("data-mood", m); }

  function say(text, ms) {
    if (dock.classList.contains("tucked")) return;
    bubble.textContent = text;
    bubble.classList.remove("pop"); void bubble.offsetWidth; bubble.classList.add("pop");
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(function () { bubble.textContent = ""; }, ms || 7000);
  }

  function flash(m, ms) {
    setMood(m);
    clearTimeout(flashTimer);
    flashTimer = setTimeout(function () { setMood(baseMood); }, ms || 1500);
  }

  // Cycle through the tips for wherever the user is, so tapping again says
  // something new rather than repeating.
  function tip() {
    var list = TIPS[tipKey] || TIPS.start;
    var i = tipAt[tipKey] || 0;
    say(list[i % list.length]);
    tipAt[tipKey] = i + 1;
  }

  function unspool() {
    if (still.matches) return;
    var rect = btn.getBoundingClientRect();
    for (var i = 0; i < 5; i++) {
      (function (n) {
        var s = document.createElement("span");
        s.className = "tape-fly"; s.textContent = "➰";
        s.style.left = (rect.left + 20) + "px";
        s.style.top = (rect.top + 10) + "px";
        s.style.setProperty("--dx", (Math.random() * 160 - 80) + "px");
        s.style.setProperty("--dy", (-60 - Math.random() * 90) + "px");
        s.style.setProperty("--dr", (Math.random() * 540 - 270) + "deg");
        s.style.animationDelay = (n * 0.05) + "s";
        document.body.appendChild(s);
        setTimeout(function () { s.remove(); }, 1200);
      })(i);
    }
  }

  btn.addEventListener("click", function () {
    var now = Date.now();
    taps = taps.filter(function (t) { return now - t < 900; });
    taps.push(now);
    if (taps.length >= 5) { taps = []; unspool(); say("Wheee! Right, back to measuring."); flash("happy"); return; }
    tip();
    flash("think", 900);
  });

  hide.addEventListener("click", function () {
    var tucked = dock.classList.toggle("tucked");
    hide.textContent = tucked ? "" : "tuck away";
    if (!tucked) { say("Back! Ask me anything by tapping."); }
  });

  // Follow the pointer a little, so Tam feels awake. Eyes only, cheap.
  if (!still.matches) {
    document.addEventListener("pointermove", function (e) {
      var r = btn.getBoundingClientRect();
      var dx = Math.max(-2, Math.min(2, (e.clientX - (r.left + r.width / 2)) / 60));
      btn.querySelector(".tam-face").style.transform = "translateX(" + dx + "px)";
    }, { passive: true });
  }

  // Public hooks the page calls.
  window.Tam = {
    // Where the user is, so the next tip fits: "shoes", "clothes" or "start".
    context: function (key) { tipKey = TIPS[key] ? key : "start"; baseMood = "sleepy"; setMood(baseMood); },
    // React to a result: "ok" (clean match), "between" (edge), "off" (no match).
    react: function (kind) {
      tipKey = "result";
      if (kind === "ok") { flash("happy"); say("There you go. Fits the chart cleanly."); }
      else if (kind === "between") { flash("warn"); say("You're between sizes. I've leaned to the roomier one."); }
      else if (kind === "off") { flash("think"); say("That's off the end of my chart. Try a measurement instead?"); }
    },
    say: say
  };

  setTimeout(function () { if (!dock.classList.contains("tucked")) say(TIPS.start[0]); }, 900);
})();
