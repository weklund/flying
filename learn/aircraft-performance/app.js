(function () {
  "use strict";

  const M = window.PerfModel;
  if (!M) {
    console.error("PerfModel missing — load model.js first");
    return;
  }

  const state = {
    elevation: 0,
    altimeter: 29.92,
    oatC: 15,
    dewPointC: 5,
    includeHumidity: false,
    weightRatio: 1,
    headwindKt: 0,
    surface: "paved",
    slope: "level",
    flaps: "takeoff",
    runwayLen: 3500,
    applyHumidityMargin: false,
    obstacle: true,
    storyIdx: 0,
    quizIdx: 0,
    quizAnswered: {},
  };

  const $ = (id) => document.getElementById(id);

  function clampDew() {
    if (state.dewPointC > state.oatC) {
      state.dewPointC = state.oatC;
      $("dewpoint").value = state.dewPointC;
    }
  }

  function compute() {
    clampDew();
    const pa = M.pressureAltitude(state.elevation, state.altimeter);
    const isa = M.isaTempC(pa);
    const da = M.densityAltitude(pa, state.oatC, state.dewPointC, true);
    const daSelected = state.includeHumidity ? da.total : da.dry;
    const air = M.airDensityState(
      state.elevation,
      state.altimeter,
      state.oatC,
      state.dewPointC
    );
    const mass = air.ratio;
    const rot = M.humidityRotFt(state.dewPointC);
    const humidityHigh = state.dewPointC >= 18 && state.oatC >= 20;
    const perf = M.toyPerformance({
      densityAltFt: daSelected,
      weightRatio: state.weightRatio,
      headwindKt: state.headwindKt,
      surface: state.surface,
      slope: state.slope,
      flaps: state.flaps,
      humidityHigh,
      applyHumidityMargin: state.applyHumidityMargin,
    });
    const verdict = M.runwayVerdict(
      perf.groundRollFt,
      state.runwayLen,
      state.obstacle ? 50 : 0
    );
    return { pa, isa, da, daSelected, mass, air, rot, perf, verdict, humidityHigh };
  }

  function fmtFt(n) {
    return Math.round(n).toLocaleString() + " ft";
  }

  function tapeTop(valueFt, maxFt) {
    const max = Math.max(maxFt, 2000);
    const v = Math.max(0, Math.min(max, valueFt));
    // 8% top padding, 92% bottom
    const pct = 8 + (1 - v / max) * 84;
    return pct + "%";
  }

  /**
   * Schematic decoration only. Particle count tracks ρ/ρ₀; H₂O share tracks
   * vapor mole fraction e/p (capped ~5% of dots — real air is never mostly vapor).
   */
  function drawMolecules(air) {
    const canvas = $("molCanvas");
    if (!canvas || !air) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || 400;
    const h = canvas.clientHeight || 220;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const mass = Math.max(0.2, Math.min(1.2, air.ratio));
    const thin = 1 - Math.min(1, mass);
    ctx.fillStyle = `rgba(${40 + thin * 80}, ${30 + thin * 20}, ${50}, 1)`;
    ctx.fillRect(0, 0, w, h);

    // Dot count scales with mass ratio (decoration of ρ/ρ₀, not absolute N)
    const baseCount = 100;
    const count = Math.max(12, Math.round(baseCount * mass));
    // Real vapor mole fraction is small (often < 4%); never paint "half the box" as water
    const vaporFrac = Math.max(0, Math.min(0.05, air.vaporMoleFraction || 0));
    let nH2O = Math.round(count * vaporFrac);
    // Ensure at least 1 cyan dot when humidity is meaningfully present
    if (vaporFrac > 0.005 && nH2O < 1) nH2O = 1;
    const nDry = Math.max(0, count - nH2O);

    let seed =
      (Math.round(air.ratio * 10000) +
        Math.round((air.eHpa || 0) * 100) +
        Math.round(air.tempK || 0)) |
      0;
    function rnd() {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    }

    function drawDot(x, y, r, color) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }

    for (let i = 0; i < nDry; i++) {
      drawDot(rnd() * w, rnd() * h, 2.2 + rnd() * 1.4, "rgba(107, 140, 174, 0.85)");
    }
    for (let i = 0; i < nH2O; i++) {
      drawDot(rnd() * w, rnd() * h, 2.4 + rnd() * 1.2, "rgba(126, 203, 255, 0.95)");
    }

    ctx.fillStyle = "rgba(232, 238, 252, 0.5)";
    ctx.font = "11px system-ui, sans-serif";
    ctx.fillText("1 volume · dots ≈ density (schematic)", 10, h - 12);
  }

  function updateUI() {
    const c = compute();

    $("elevVal").textContent = Math.round(state.elevation).toLocaleString() + " ft";
    $("altVal").textContent = state.altimeter.toFixed(2) + " inHg";
    $("oatVal").textContent = state.oatC + " °C (" + Math.round(state.oatC * 9 / 5 + 32) + " °F)";
    $("dpVal").textContent = state.dewPointC + " °C";
    $("includeHumidity").checked = state.includeHumidity;

    $("paOut").textContent = fmtFt(c.pa);
    $("isaOut").textContent = c.isa.toFixed(1) + " °C";
    $("daDryOut").textContent = fmtFt(c.da.dry);
    $("humAddOut").textContent = "+" + Math.round(c.da.humidityAdd) + " ft";
    $("daOut").textContent = fmtFt(c.daSelected) + (state.includeHumidity ? " (with humidity)" : " (dry)");
    const massPct = c.mass * 100;
    $("massOut").textContent = massPct.toFixed(1) + "%";
    $("massHint").textContent =
      "ρ = " +
      c.air.rho.toFixed(3) +
      " kg/m³ vs ρ₀ = " +
      c.air.rho0.toFixed(3) +
      " kg/m³ (SL dry 15 °C) · RH ≈ " +
      Math.round(c.air.relativeHumidity * 100) +
      "%";
    $("vaporFracOut").textContent =
      (c.air.vaporMoleFraction * 100).toFixed(2) + "% of molecules";
    $("rhoOut").textContent = c.air.rho.toFixed(3) + " kg/m³";
    $("rotOut").textContent = "~" + Math.round(c.rot) + " ft";

    const maxTape = Math.max(
      4000,
      state.elevation,
      c.pa,
      c.da.dry,
      c.da.total,
      1000
    ) * 1.15;
    $("mkElev").style.top = tapeTop(state.elevation, maxTape);
    $("mkPa").style.top = tapeTop(c.pa, maxTape);
    $("mkDaDry").style.top = tapeTop(c.da.dry, maxTape);
    $("mkDaHum").style.top = tapeTop(c.da.total, maxTape);
    $("mkDaHum").style.opacity = state.includeHumidity || c.da.humidityAdd > 50 ? "1" : "0.35";

    $("tapeCaption").textContent =
      "Performs about like " +
      fmtFt(c.daSelected) +
      " density altitude" +
      (state.includeHumidity
        ? " (humidity adds ~" + Math.round(c.da.humidityAdd) + " ft vs dry)."
        : " (humidity off — dry chart-style DA).");

    drawMolecules(c.air);

    // Mission
    $("mDaOut").textContent = fmtFt(c.daSelected);
    $("mHumState").textContent = state.includeHumidity
      ? "On (+" + Math.round(c.da.humidityAdd) + " ft)"
      : "Off (dry DA)";
    $("wtVal").textContent = Math.round(state.weightRatio * 100) + "%";
    $("windVal").textContent =
      (state.headwindKt >= 0 ? "+" : "") + state.headwindKt + " kt";
    $("rwyVal").textContent = state.runwayLen.toLocaleString() + " ft";

    $("rollOut").textContent = fmtFt(c.perf.groundRollFt);
    $("climbOut").textContent = c.perf.climbFpm + " fpm";
    $("angleOut").textContent = c.perf.climbAngleDeg + "°";
    $("landOut").textContent = fmtFt(c.perf.landingRollFt);

    $("engPct").textContent = c.perf.engine + "%";
    $("propPct").textContent = c.perf.prop + "%";
    $("liftPct").textContent = c.perf.lift + "%";
    $("engFill").style.width = c.perf.engine + "%";
    $("propFill").style.width = c.perf.prop + "%";
    $("liftFill").style.width = c.perf.lift + "%";

    const scene = $("runwayScene");
    scene.classList.remove("grass", "soft");
    if (state.surface === "grass") scene.classList.add("grass");
    if (state.surface === "soft") scene.classList.add("soft");

    const rollPct = Math.min(100, (c.perf.groundRollFt / state.runwayLen) * 100);
    $("rollBar").style.width = rollPct + "%";
    if (c.perf.humidityMarginApplied) {
      $("rollMargin").classList.remove("hidden");
      $("rollMargin").style.width = Math.min(100, rollPct * 1.0) + "%";
      // margin is included in groundRoll already when applied; show gold tint bar slightly wider visual
      $("rollMargin").style.width = Math.min(100, rollPct + 2) + "%";
    } else {
      $("rollMargin").classList.add("hidden");
    }
    $("plane").style.left = "calc(5% + " + Math.max(0, rollPct - 3) + "% * 0.9)";

    const ang = c.perf.climbAngleDeg;
    const rise = Math.min(70, ang * 6);
    const run = 90;
    $("climbWedge").style.borderWidth = "0 0 " + rise + "px " + run + "px";
    $("climbWedge").style.borderColor =
      "transparent transparent rgba(61, 214, 198, 0.35) transparent";

    $("obstacleMark").classList.toggle("hidden", !state.obstacle);

    let windText = "Wind calm";
    if (state.headwindKt > 0) windText = "← " + state.headwindKt + " kt headwind";
    if (state.headwindKt < 0) windText = Math.abs(state.headwindKt) + " kt tailwind →";
    $("windArrow").textContent = windText;

    const v = $("verdict");
    v.className = "verdict " + c.verdict.level;
    v.textContent = c.verdict.label;
    $("verdictDetail").textContent =
      "Toy need ~" +
      c.verdict.needed.toLocaleString() +
      " ft equivalent vs " +
      state.runwayLen.toLocaleString() +
      " ft available" +
      (c.perf.humidityMarginApplied ? " (includes +10% humid margin)." : ".");

    $("missionTeach").textContent = c.humidityHigh
      ? "Humidity is high (warm + high dew point). Compare dry vs humidity-on DA in Density mode, then try FAASTeam +10% margin here."
      : "At the same DA, try raising weight ~10% vs only raising dew point — weight often hurts the mission more.";
  }

  function applyPreset(key) {
    const p = M.PRESETS[key];
    if (!p) return;
    state.elevation = p.elevation;
    state.altimeter = p.altimeter;
    state.oatC = Math.round(p.oatC);
    state.dewPointC = Math.round(p.dewPointC);
    state.includeHumidity = !!p.includeHumidity;
    state.weightRatio = p.weightRatio ?? 1;
    state.headwindKt = p.headwindKt ?? 0;
    state.surface = p.surface ?? "paved";
    state.slope = p.slope ?? "level";
    state.flaps = p.flaps ?? "takeoff";
    if (p.applyHumidityMargin) state.applyHumidityMargin = true;

    $("elev").value = state.elevation;
    $("altimeter").value = state.altimeter;
    $("oat").value = state.oatC;
    $("dewpoint").value = state.dewPointC;
    $("includeHumidity").checked = state.includeHumidity;
    $("weight").value = state.weightRatio;
    $("wind").value = state.headwindKt;
    $("surface").value = state.surface;
    $("slope").value = state.slope;
    $("flaps").value = state.flaps;
    $("humMargin").checked = state.applyHumidityMargin;

    document.querySelectorAll("#densityPresets button").forEach((b) => {
      b.classList.toggle("active", b.dataset.key === key);
    });
    updateUI();
  }

  function bindControls() {
    $("elev").addEventListener("input", (e) => {
      state.elevation = +e.target.value;
      updateUI();
    });
    $("altimeter").addEventListener("input", (e) => {
      state.altimeter = +e.target.value;
      updateUI();
    });
    $("oat").addEventListener("input", (e) => {
      state.oatC = +e.target.value;
      updateUI();
    });
    $("dewpoint").addEventListener("input", (e) => {
      state.dewPointC = +e.target.value;
      updateUI();
    });
    $("includeHumidity").addEventListener("change", (e) => {
      state.includeHumidity = e.target.checked;
      updateUI();
    });
    $("weight").addEventListener("input", (e) => {
      state.weightRatio = +e.target.value;
      updateUI();
    });
    $("wind").addEventListener("input", (e) => {
      state.headwindKt = +e.target.value;
      updateUI();
    });
    $("surface").addEventListener("change", (e) => {
      state.surface = e.target.value;
      updateUI();
    });
    $("slope").addEventListener("change", (e) => {
      state.slope = e.target.value;
      updateUI();
    });
    $("flaps").addEventListener("change", (e) => {
      state.flaps = e.target.value;
      updateUI();
    });
    $("runwayLen").addEventListener("input", (e) => {
      state.runwayLen = +e.target.value;
      updateUI();
    });
    $("humMargin").addEventListener("change", (e) => {
      state.applyHumidityMargin = e.target.checked;
      updateUI();
    });
    $("obstacle").addEventListener("change", (e) => {
      state.obstacle = e.target.checked;
      updateUI();
    });

    document.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        document.querySelectorAll(".tab").forEach((t) => {
          t.classList.remove("active");
          t.setAttribute("aria-selected", "false");
        });
        tab.classList.add("active");
        tab.setAttribute("aria-selected", "true");
        document.querySelectorAll(".mode").forEach((m) => m.classList.remove("active"));
        $("mode-" + tab.dataset.mode).classList.add("active");
        if (tab.dataset.mode === "density") drawMolecules(compute().air);
      });
    });

    window.addEventListener("resize", () => {
      drawMolecules(compute().air);
    });
  }

  function buildPresets() {
    const host = $("densityPresets");
    Object.keys(M.PRESETS).forEach((key) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.dataset.key = key;
      btn.textContent = M.PRESETS[key].name;
      btn.addEventListener("click", () => applyPreset(key));
      host.appendChild(btn);
    });
  }

  function renderStory() {
    const step = M.STORY_STEPS[state.storyIdx];
    $("storyTitle").textContent = step.title;
    $("storyText").textContent = step.text;
    $("storyInd").textContent = state.storyIdx + 1 + " / " + M.STORY_STEPS.length;
  }

  function applyStoryStep() {
    const step = M.STORY_STEPS[state.storyIdx];
    if (step.preset) {
      applyPreset(step.preset);
    } else if (step.apply) {
      const p = step.apply();
      state.elevation = p.elevation;
      state.altimeter = p.altimeter;
      state.oatC = Math.round(p.oatC);
      state.dewPointC = Math.round(p.dewPointC);
      state.includeHumidity = !!p.includeHumidity;
      state.weightRatio = p.weightRatio ?? 1;
      state.headwindKt = p.headwindKt ?? 0;
      state.surface = p.surface ?? "paved";
      state.slope = p.slope ?? "level";
      state.flaps = p.flaps ?? "takeoff";
      state.applyHumidityMargin = !!p.applyHumidityMargin;
      $("elev").value = state.elevation;
      $("altimeter").value = state.altimeter;
      $("oat").value = state.oatC;
      $("dewpoint").value = state.dewPointC;
      $("includeHumidity").checked = state.includeHumidity;
      $("weight").value = state.weightRatio;
      $("wind").value = state.headwindKt;
      $("surface").value = state.surface;
      $("slope").value = state.slope;
      $("flaps").value = state.flaps;
      $("humMargin").checked = state.applyHumidityMargin;
      updateUI();
    }
  }

  function bindStory() {
    $("storyPrev").addEventListener("click", () => {
      state.storyIdx = Math.max(0, state.storyIdx - 1);
      renderStory();
    });
    $("storyNext").addEventListener("click", () => {
      state.storyIdx = Math.min(M.STORY_STEPS.length - 1, state.storyIdx + 1);
      renderStory();
    });
    $("storyApply").addEventListener("click", applyStoryStep);
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
        else if (i === answered && answered !== item.answer) b.classList.add("wrong");
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

  function bindPrimer() {
    const primer = $("primer");
    const btn = $("primerToggle");
    if (!primer || !btn) return;
    btn.addEventListener("click", () => {
      const collapsed = primer.classList.toggle("collapsed");
      btn.setAttribute("aria-expanded", collapsed ? "false" : "true");
      btn.textContent = collapsed ? "Expand intro" : "Collapse";
    });
  }

  // init
  buildPresets();
  bindControls();
  bindStory();
  bindQuiz();
  bindPrimer();
  renderStory();
  renderQuiz();
  applyPreset("standard");
})();
