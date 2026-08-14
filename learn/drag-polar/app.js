(function () {
  "use strict";
  const M = window.DragModel;
  if (!M) return;
  const $ = (id) => document.getElementById(id);

  const state = {
    config: "clean",
    ar: 7,
    weight: 11000,
    v: 50,
    storyIdx: 0,
    quizIdx: 0,
    quizAnswered: {},
  };

  function bindPrimer() {
    const primer = $("primer");
    const btn = $("primerToggle");
    btn.addEventListener("click", () => {
      const c = primer.classList.toggle("collapsed");
      btn.textContent = c ? "Expand intro" : "Collapse";
    });
  }

  function switchMode(mode) {
    document.querySelectorAll(".tab").forEach((t) => {
      t.classList.toggle("active", t.dataset.mode === mode);
    });
    document.querySelectorAll(".mode").forEach((m) => m.classList.remove("active"));
    $("mode-" + mode).classList.add("active");
    update();
  }

  function bindTabs() {
    document.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", () => switchMode(tab.dataset.mode));
    });
  }

  function bindControls() {
    $("config").addEventListener("change", (e) => {
      state.config = e.target.value;
      update();
    });
    $("ar").addEventListener("input", (e) => {
      state.ar = +e.target.value;
      update();
    });
    $("weight").addEventListener("input", (e) => {
      state.weight = +e.target.value;
      update();
    });
    $("v").addEventListener("input", (e) => {
      state.v = +e.target.value;
      update();
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

  function drawCurves() {
    const canvas = $("dragCanvas");
    if (!canvas) return;
    const { ctx, w, h } = sizeCanvas(canvas);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0a101c";
    ctx.fillRect(0, 0, w, h);

    const padL = 48;
    const padB = 36;
    const padT = 16;
    const padR = 16;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;
    const vMin = 28;
    const vMax = 85;
    let dMax = 0;
    const pts = [];
    for (let v = vMin; v <= vMax; v += 1) {
      const dp = M.parasiteDrag(v, state.config);
      const di = M.inducedDrag(v, state.config, state.ar, state.weight);
      const dt = dp + di;
      dMax = Math.max(dMax, dt, dp, di);
      pts.push({ v, dp, di, dt });
    }
    dMax *= 1.1;
    const best = M.findBest(state.config, state.ar, state.weight);

    function xOf(v) {
      return padL + ((v - vMin) / (vMax - vMin)) * plotW;
    }
    function yOf(d) {
      return padT + plotH - (d / dMax) * plotH;
    }

    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, padT + plotH);
    ctx.lineTo(padL + plotW, padT + plotH);
    ctx.stroke();

    function strokeSeries(key, color, width) {
      ctx.beginPath();
      pts.forEach((p, i) => {
        const x = xOf(p.v);
        const y = yOf(p[key]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.stroke();
    }
    strokeSeries("dp", "#ff9f6b", 2);
    strokeSeries("di", "#7ecbff", 2);
    strokeSeries("dt", "#3ecf8e", 3);

    // L/D max marker
    ctx.fillStyle = "#3ecf8e";
    ctx.beginPath();
    ctx.arc(xOf(best.vBest), yOf(best.minD), 6, 0, Math.PI * 2);
    ctx.fill();

    // current speed
    ctx.strokeStyle = "rgba(240,193,75,0.8)";
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(xOf(state.v), padT);
    ctx.lineTo(xOf(state.v), padT + plotH);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#9aa8c7";
    ctx.font = "11px system-ui";
    ctx.fillText("Airspeed →", padL + plotW / 2 - 30, h - 10);
    ctx.fillStyle = "#ff9f6b";
    ctx.fillText("Parasite", padL + 8, padT + 14);
    ctx.fillStyle = "#7ecbff";
    ctx.fillText("Induced", padL + 80, padT + 14);
    ctx.fillStyle = "#3ecf8e";
    ctx.fillText("Total · ● min drag", padL + 150, padT + 14);
  }

  function drawBars() {
    const canvas = $("barCanvas");
    if (!canvas) return;
    const { ctx, w, h } = sizeCanvas(canvas);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0a101c";
    ctx.fillRect(0, 0, w, h);

    const dp = M.parasiteDrag(state.v, state.config);
    const di = M.inducedDrag(state.v, state.config, state.ar, state.weight);
    const dt = dp + di;
    const max = Math.max(dt, 1);
    const barW = w * 0.55;
    const x0 = w * 0.2;
    const bh = 36;
    const gap = 28;

    function bar(y, val, color, label) {
      ctx.fillStyle = "rgba(255,255,255,0.08)";
      ctx.fillRect(x0, y, barW, bh);
      ctx.fillStyle = color;
      ctx.fillRect(x0, y, barW * (val / max), bh);
      ctx.fillStyle = "#e8eefc";
      ctx.font = "13px system-ui";
      ctx.fillText(label + " " + val.toFixed(0) + " N", x0, y - 8);
    }
    bar(h * 0.25, dp, "#ff9f6b", "Parasite");
    bar(h * 0.25 + bh + gap, di, "#7ecbff", "Induced");
    bar(h * 0.25 + 2 * (bh + gap), dt, "#3ecf8e", "Total");
  }

  function update() {
    $("arVal").textContent = state.ar.toFixed(1);
    $("wVal").textContent = state.weight + " N";
    $("vVal").textContent = state.v.toFixed(1) + " m/s";
    $("cd0Out").textContent = M.cd0(state.config).toFixed(3);

    const best = M.findBest(state.config, state.ar, state.weight);
    $("ldBest").textContent = best.bestLD.toFixed(1);
    $("vBest").textContent = M.msToKt(best.vBest).toFixed(0) + " kt · " + best.vBest.toFixed(0) + " m/s";
    $("dMin").textContent = best.minD.toFixed(0) + " N";

    const dp = M.parasiteDrag(state.v, state.config);
    const di = M.inducedDrag(state.v, state.config, state.ar, state.weight);
    const dt = dp + di;
    const ld = M.liftDragRatio(state.v, state.config, state.ar, state.weight);
    const cl = M.clLevel(state.v, state.weight);
    $("ktOut").textContent = M.msToKt(state.v).toFixed(0) + " kt";
    $("clOut").textContent = cl.toFixed(2);
    $("dpOut").textContent = dp.toFixed(0) + " N";
    $("diOut").textContent = di.toFixed(0) + " N";
    $("dtOut").textContent = dt.toFixed(0) + " N";
    $("ldOut").textContent = ld.toFixed(1);

    let note = "At this speed, ";
    if (di > dp * 1.2) note += "induced drag dominates — classic slow-flight regime.";
    else if (dp > di * 1.2) note += "parasite drag dominates — clean up and don’t fly faster than you need.";
    else note += "parasite and induced are comparable — near the drag valley / L/D region.";
    $("pointNote").textContent = note;

    drawCurves();
    drawBars();
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
  bindStory();
  bindQuiz();
  renderStory();
  renderQuiz();
  window.addEventListener("resize", update);
  update();
})();
