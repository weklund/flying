(function () {
  "use strict";
  const M = window.LiftModel;
  if (!M) return;

  const $ = (id) => document.getElementById(id);

  const state = {
    vin: 30,
    areaRatio: 2,
    rhoB: 1.225,
    alpha: 4,
    camber: 0.35,
    vinf: 50,
    rhoA: 1.225,
    mdot: 200,
    vdw: 5,
    alphaC: 4,
    chord: 1.5,
    vinfC: 50,
    arWing: 7,
    storyIdx: 0,
    quizIdx: 0,
    quizAnswered: {},
  };

  function bindPrimer() {
    const primer = $("primer");
    const btn = $("primerToggle");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const c = primer.classList.toggle("collapsed");
      btn.setAttribute("aria-expanded", c ? "false" : "true");
      btn.textContent = c ? "Expand intro" : "Collapse";
    });
  }

  function bindTabs() {
    document.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
        document.querySelectorAll(".mode").forEach((m) => m.classList.remove("active"));
        tab.classList.add("active");
        $("mode-" + tab.dataset.mode).classList.add("active");
        update();
      });
    });
  }

  function switchMode(mode) {
    document.querySelectorAll(".tab").forEach((t) => {
      t.classList.toggle("active", t.dataset.mode === mode);
    });
    document.querySelectorAll(".mode").forEach((m) => m.classList.remove("active"));
    const el = $("mode-" + mode);
    if (el) el.classList.add("active");
    update();
  }

  function bindControls() {
    const map = [
      ["vin", "vin"],
      ["areaRatio", "areaRatio"],
      ["rhoB", "rhoB"],
      ["alpha", "alpha"],
      ["camber", "camber"],
      ["vinf", "vinf"],
      ["rhoA", "rhoA"],
      ["mdot", "mdot"],
      ["vdw", "vdw"],
      ["alphaC", "alphaC"],
      ["chord", "chord"],
      ["vinfC", "vinfC"],
      ["arWing", "arWing"],
    ];
    map.forEach(([id, key]) => {
      const el = $(id);
      if (!el) return;
      el.addEventListener("input", () => {
        state[key] = +el.value;
        update();
      });
    });
  }

  function buildPresets() {
    const host = $("airfoilPresets");
    if (!host) return;
    Object.keys(M.PRESETS).forEach((key) => {
      const p = M.PRESETS[key];
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = key;
      b.addEventListener("click", () => {
        state.alpha = p.alphaDeg;
        state.camber = p.camber;
        state.vinf = p.Vinf;
        state.rhoA = p.rho;
        state.alphaC = p.alphaDeg;
        state.chord = p.chord;
        state.vinfC = p.Vinf;
        state.arWing = p.AR;
        $("alpha").value = state.alpha;
        $("camber").value = state.camber;
        $("vinf").value = state.vinf;
        $("rhoA").value = state.rhoA;
        $("alphaC").value = state.alphaC;
        $("chord").value = state.chord;
        $("vinfC").value = state.vinfC;
        $("arWing").value = state.arWing;
        document.querySelectorAll("#airfoilPresets button").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        update();
      });
      host.appendChild(b);
    });
  }

  function sizeCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || 520;
    const h = canvas.clientHeight || 280;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h };
  }

  function drawVenturi() {
    const canvas = $("venturiCanvas");
    if (!canvas) return;
    const { ctx, w, h } = sizeCanvas(canvas);
    ctx.clearRect(0, 0, w, h);
    const v = M.venturi({
      Vin: state.vin,
      areaRatio: state.areaRatio,
      rho: state.rhoB,
      pInf: 101325,
    });
    // tube shape
    const mid = h / 2;
    const throatW = 36 / state.areaRatio;
    ctx.fillStyle = "#0d1524";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(232,238,252,0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(20, mid - 50);
    ctx.lineTo(w * 0.35, mid - 50);
    ctx.lineTo(w * 0.5, mid - throatW);
    ctx.lineTo(w * 0.65, mid - 50);
    ctx.lineTo(w - 20, mid - 50);
    ctx.moveTo(20, mid + 50);
    ctx.lineTo(w * 0.35, mid + 50);
    ctx.lineTo(w * 0.5, mid + throatW);
    ctx.lineTo(w * 0.65, mid + 50);
    ctx.lineTo(w - 20, mid + 50);
    ctx.stroke();

    function arrow(x, speed, label) {
      const len = 18 + speed * 0.9;
      const cool = Math.min(1, (speed - state.vin) / (state.vin * 2 + 1));
      ctx.strokeStyle = `rgba(${126 - cool * 40}, ${180 + cool * 40}, 255, 0.95)`;
      ctx.fillStyle = ctx.strokeStyle;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x - len / 2, mid);
      ctx.lineTo(x + len / 2, mid);
      ctx.lineTo(x + len / 2 - 6, mid - 5);
      ctx.moveTo(x + len / 2, mid);
      ctx.lineTo(x + len / 2 - 6, mid + 5);
      ctx.stroke();
      ctx.font = "11px system-ui";
      ctx.fillText(label, x - 20, mid - throatW - 12);
    }
    arrow(w * 0.2, v.Vin, v.Vin.toFixed(0) + " m/s");
    arrow(w * 0.5, v.Vt, v.Vt.toFixed(0) + " m/s");
    arrow(w * 0.8, v.Vout, v.Vout.toFixed(0) + " m/s");
    ctx.fillStyle = "rgba(232,238,252,0.55)";
    ctx.font = "12px system-ui";
    ctx.fillText("p high", w * 0.15, mid + 70);
    ctx.fillText("p low", w * 0.45, mid + 70);
    ctx.fillText("p recovers", w * 0.72, mid + 70);
  }

  function drawAirfoil() {
    const canvas = $("airfoilCanvas");
    if (!canvas) return;
    const { ctx, w, h } = sizeCanvas(canvas);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0a101c";
    ctx.fillRect(0, 0, w, h);

    const dist = M.surfaceDistribution(state.alpha, state.camber, 48);
    const x0 = 40;
    const x1 = w - 30;
    const y0 = h * 0.55;
    const chord = x1 - x0;
    const a = state.alpha * M.DEG;
    const cam = state.camber;

    // airfoil path
    ctx.save();
    ctx.translate(x0, y0);
    ctx.rotate(-a * 0.35);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let i = 0; i <= 40; i++) {
      const t = i / 40;
      const x = t * chord;
      const yu = -18 * (cam + 0.35) * Math.sin(Math.PI * t) - 6 * Math.sin(Math.PI * t);
      ctx.lineTo(x, yu);
    }
    for (let i = 40; i >= 0; i--) {
      const t = i / 40;
      const x = t * chord;
      const yl = 8 * (0.5 + 0.3 * cam) * Math.sin(Math.PI * t);
      ctx.lineTo(x, yl);
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(91,157,255,0.25)";
    ctx.fill();
    ctx.strokeStyle = "rgba(232,238,252,0.7)";
    ctx.stroke();
    ctx.restore();

    // Cp plot above
    const plotTop = 16;
    const plotH = h * 0.32;
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.beginPath();
    ctx.moveTo(x0, plotTop + plotH / 2);
    ctx.lineTo(x1, plotTop + plotH / 2);
    ctx.stroke();
    ctx.font = "10px system-ui";
    ctx.fillStyle = "rgba(232,238,252,0.5)";
    ctx.fillText("−Cp (suction up)", x0, plotTop + 10);

    function plot(series, color) {
      ctx.beginPath();
      series.forEach((p, i) => {
        const x = x0 + p.x * chord;
        const y = plotTop + plotH / 2 - p.Cp * 28;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    plot(dist.upper, "rgba(126,203,255,0.95)");
    plot(dist.lower, "rgba(255,159,107,0.95)");
    ctx.fillStyle = "rgba(126,203,255,0.9)";
    ctx.fillText("upper", x1 - 70, plotTop + 14);
    ctx.fillStyle = "rgba(255,159,107,0.9)";
    ctx.fillText("lower", x1 - 70, plotTop + 28);
  }

  function drawNewton() {
    const canvas = $("newtonCanvas");
    if (!canvas) return;
    const { ctx, w, h } = sizeCanvas(canvas);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0a101c";
    ctx.fillRect(0, 0, w, h);
    const wingX = w * 0.4;
    const wingY = h * 0.42;
    const defl = state.vdw * 2.2;

    for (let i = 0; i < 7; i++) {
      const y = h * 0.2 + i * (h * 0.1);
      ctx.beginPath();
      ctx.strokeStyle = "rgba(126,203,255,0.45)";
      ctx.lineWidth = 1.5;
      ctx.moveTo(10, y);
      ctx.bezierCurveTo(wingX - 20, y, wingX + 40, y + defl * (i / 6 + 0.3), w - 10, y + defl * (0.8 + i * 0.12));
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(91,157,255,0.5)";
    ctx.beginPath();
    ctx.ellipse(wingX, wingY, 50, 10, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(62,207,142,0.9)";
    ctx.font = "12px system-ui";
    ctx.fillText("↑ Lift (reaction)", wingX - 30, wingY - 28);
    ctx.fillStyle = "rgba(255,159,107,0.9)";
    ctx.fillText("↓ Δv downwash", w * 0.62, h * 0.78);
  }

  function drawCirc() {
    const canvas = $("circCanvas");
    if (!canvas) return;
    const { ctx, w, h } = sizeCanvas(canvas);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0a101c";
    ctx.fillRect(0, 0, w, h);
    const cx = w * 0.45;
    const cy = h * 0.5;
    const CL = M.sectionCL(state.alphaC, 0.2, false);
    const G = M.circulation(state.vinfC, state.chord, CL);
    const loops = 4 + Math.min(6, Math.abs(G) / 8);

    for (let r = 18; r < 18 + loops * 14; r += 14) {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(126,203,255,0.35)";
      ctx.lineWidth = 1.5;
      ctx.arc(cx, cy, r, 0.2, Math.PI * 2 - 0.2);
      ctx.stroke();
    }
    // freestream
    for (let y = 30; y < h; y += 28) {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255,255,255,0.15)";
      ctx.moveTo(10, y);
      ctx.lineTo(w - 10, y - G * 0.15);
      ctx.stroke();
    }
    ctx.fillStyle = "rgba(91,157,255,0.55)";
    ctx.beginPath();
    ctx.ellipse(cx, cy, 55, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(232,238,252,0.7)";
    ctx.font = "12px system-ui";
    ctx.fillText("Γ ≈ " + G.toFixed(1) + " m²/s", cx - 40, cy + 40);
    ctx.fillText("Kutta: smooth TE exit selects Γ", 16, h - 16);
  }

  function drawSyn() {
    const canvas = $("synCanvas");
    if (!canvas) return;
    const { ctx, w, h } = sizeCanvas(canvas);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0a101c";
    ctx.fillRect(0, 0, w, h);
    const boxes = [
      { t: "Pressure ∫", x: 0.12 },
      { t: "Bernoulli Cp", x: 0.38 },
      { t: "Momentum", x: 0.62 },
      { t: "ρVΓ", x: 0.88 },
    ];
    boxes.forEach((b, i) => {
      const x = w * b.x;
      ctx.fillStyle = "rgba(91,157,255,0.2)";
      ctx.strokeStyle = "rgba(61,214,198,0.6)";
      ctx.lineWidth = 2;
      roundRect(ctx, x - 48, h * 0.28, 96, 52, 10);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#e8eefc";
      ctx.font = "bold 12px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(b.t, x, h * 0.28 + 32);
      if (i < boxes.length - 1) {
        ctx.strokeStyle = "rgba(232,238,252,0.35)";
        ctx.beginPath();
        ctx.moveTo(x + 50, h * 0.45);
        ctx.lineTo(w * boxes[i + 1].x - 50, h * 0.45);
        ctx.stroke();
      }
    });
    ctx.textAlign = "left";
    ctx.fillStyle = "rgba(232,238,252,0.55)";
    ctx.font = "12px system-ui";
    ctx.fillText("Same lift · different bookkeeping", 16, h - 14);
  }

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function update() {
    // Bernoulli
    const ven = M.venturi({
      Vin: state.vin,
      areaRatio: state.areaRatio,
      rho: state.rhoB,
      pInf: 101325,
    });
    $("vinVal").textContent = state.vin + " m/s";
    $("arVal").textContent = state.areaRatio.toFixed(1);
    $("rhoBVal").textContent = state.rhoB.toFixed(3) + " kg/m³";
    $("vtOut").textContent = ven.Vt.toFixed(1) + " m/s";
    $("dpOut").textContent = (ven.dP / 1000).toFixed(2) + " kPa";
    $("cpTOut").textContent = ven.CpThroat.toFixed(2);
    $("qOut").textContent = (0.5 * state.rhoB * state.vin * state.vin / 1000).toFixed(2) + " kPa";

    // Airfoil
    const CL = M.sectionCL(state.alpha, state.camber, state.alpha > 15);
    const dist = M.surfaceDistribution(state.alpha, state.camber);
    const clDist = M.clFromDistribution(dist);
    const S = 15;
    const L = M.liftForce(state.rhoA, state.vinf, S, CL);
    $("alphaVal").textContent = state.alpha.toFixed(1) + "°";
    $("camberVal").textContent = state.camber.toFixed(2);
    $("vinfVal").textContent = state.vinf + " m/s";
    $("rhoAVal").textContent = state.rhoA.toFixed(3);
    $("clOut").textContent = CL.toFixed(2);
    $("clDistOut").textContent = clDist.toFixed(2);
    $("liftOut").textContent = L.toFixed(0) + " N";

    // Newton
    const Ln = state.mdot * state.vdw;
    $("mdotVal").textContent = state.mdot + " kg/s";
    $("vdwVal").textContent = state.vdw.toFixed(1) + " m/s";
    $("liftNOut").textContent = Ln.toFixed(0) + " N";
    $("powerNOut").textContent = (0.5 * state.mdot * state.vdw * state.vdw / 1000).toFixed(2) + " kW";
    const eps = M.downwashDeg(CL, state.arWing);
    const cdi = M.inducedDragFactor(CL, state.arWing, 0.8);
    $("epsOut").textContent = eps.toFixed(2) + "°";
    $("cdiOut").textContent = cdi.toFixed(3);

    // Circulation
    const CLc = M.sectionCL(state.alphaC, 0.2, false);
    const G = M.circulation(state.vinfC, state.chord, CLc);
    const Lp = M.liftPerSpan(state.rhoA, state.vinfC, G);
    const Lp2 = 0.5 * state.rhoA * state.vinfC * state.vinfC * state.chord * CLc;
    $("alphaCVal").textContent = state.alphaC.toFixed(1) + "°";
    $("chordVal").textContent = state.chord.toFixed(1) + " m";
    $("vinfCVal").textContent = state.vinfC + " m/s";
    $("arWingVal").textContent = state.arWing.toFixed(1);
    $("clCOut").textContent = CLc.toFixed(2);
    $("gammaOut").textContent = G.toFixed(2) + " m²/s";
    $("lpOut").textContent = Lp.toFixed(0) + " N/m";
    $("lp2Out").textContent = Lp2.toFixed(0) + " N/m";

    // Synthesis
    const CLs = M.sectionCL(state.alpha, state.camber, state.alpha > 15);
    const Gs = M.circulation(state.vinf, state.chord, CLs);
    const L1 = M.liftPerSpan(state.rhoA, state.vinf, Gs);
    const L2 = 0.5 * state.rhoA * state.vinf * state.vinf * state.chord * CLs;
    $("synAlpha").textContent = state.alpha.toFixed(1) + "° / " + state.camber.toFixed(2);
    $("synCL").textContent = CLs.toFixed(2);
    $("synG").textContent = Gs.toFixed(2) + " m²/s";
    const match = Math.abs(L1 - L2) < 1;
    $("synMatch").textContent = match ? "L′ forms agree ✓" : "Δ " + Math.abs(L1 - L2).toFixed(1) + " N/m";
    $("synMatch").className = "v " + (match ? "good" : "hot");

    drawVenturi();
    drawAirfoil();
    drawNewton();
    drawCirc();
    drawSyn();
  }

  function renderStory() {
    const s = M.STORY[state.storyIdx];
    $("storyTitle").textContent = s.title;
    $("storyText").textContent = s.text;
    $("storyInd").textContent = state.storyIdx + 1 + " / " + M.STORY.length;
  }

  function bindStory() {
    $("storyPrev").addEventListener("click", () => {
      state.storyIdx = Math.max(0, state.storyIdx - 1);
      renderStory();
    });
    $("storyNext").addEventListener("click", () => {
      state.storyIdx = Math.min(M.STORY.length - 1, state.storyIdx + 1);
      renderStory();
    });
    $("storyJump").addEventListener("click", () => {
      switchMode(M.STORY[state.storyIdx].mode);
    });
  }

  function renderQuiz() {
    const item = M.QUIZ[state.quizIdx];
    const box = $("quizBox");
    const answered = state.quizAnswered[state.quizIdx];
    box.innerHTML = "";
    const prompt = document.createElement("div");
    prompt.className = "prompt";
    prompt.textContent = state.quizIdx + 1 + ". " + item.q;
    box.appendChild(prompt);
    const choices = document.createElement("div");
    choices.className = "choices";
    item.choices.forEach((text, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = text;
      if (answered !== undefined) {
        if (i === item.answer) b.classList.add("correct");
        else if (i === answered) b.classList.add("wrong");
      }
      b.addEventListener("click", () => {
        state.quizAnswered[state.quizIdx] = i;
        renderQuiz();
      });
      choices.appendChild(b);
    });
    box.appendChild(choices);
    if (answered !== undefined) {
      const ex = document.createElement("div");
      ex.className = "explain";
      ex.textContent = item.explain;
      box.appendChild(ex);
    }
  }

  function bindQuiz() {
    $("quizPrev").addEventListener("click", () => {
      state.quizIdx = Math.max(0, state.quizIdx - 1);
      renderQuiz();
    });
    $("quizNext").addEventListener("click", () => {
      state.quizIdx = Math.min(M.QUIZ.length - 1, state.quizIdx + 1);
      renderQuiz();
    });
  }

  bindPrimer();
  bindTabs();
  bindControls();
  buildPresets();
  bindStory();
  bindQuiz();
  renderStory();
  renderQuiz();
  window.addEventListener("resize", update);
  update();
})();
