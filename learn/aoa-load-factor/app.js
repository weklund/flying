(function () {
  "use strict";
  const M = window.AoaModel;
  if (!M) return;
  const $ = (id) => document.getElementById(id);

  const state = {
    aoaG: 6,
    pitch: 4,
    aoaC: 8,
    flaps: "up",
    bank: 30,
    vs1: 50,
    ias: 90,
    nS: 1,
    vs1S: 50,
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
      btn.setAttribute("aria-expanded", c ? "false" : "true");
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
    const map = [
      ["aoaG", "aoaG"],
      ["pitch", "pitch"],
      ["aoaC", "aoaC"],
      ["bank", "bank"],
      ["vs1", "vs1"],
      ["ias", "ias"],
      ["nS", "nS"],
      ["vs1S", "vs1S"],
    ];
    map.forEach(([id, key]) => {
      $(id).addEventListener("input", (e) => {
        state[key] = +e.target.value;
        update();
      });
    });
    $("flaps").addEventListener("change", (e) => {
      state.flaps = e.target.value;
      update();
    });
    $("scenario").addEventListener("change", (e) => {
      applyScenario(e.target.value);
    });
  }

  function applyScenario(name) {
    if (name === "cruise") {
      state.ias = 100;
      state.nS = 1;
    } else if (name === "approach") {
      state.ias = 60;
      state.nS = 1;
    } else if (name === "steep") {
      state.ias = 90;
      state.nS = 2;
    } else if (name === "accel") {
      state.ias = 95;
      state.nS = 2.5;
    }
    $("ias").value = state.ias;
    $("nS").value = state.nS;
    update();
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

  function drawGeo() {
    const canvas = $("geoCanvas");
    if (!canvas) return;
    const { ctx, w, h } = sizeCanvas(canvas);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0a101c";
    ctx.fillRect(0, 0, w, h);

    // horizon
    const hy = h * 0.55 - state.pitch * 1.5;
    ctx.strokeStyle = "rgba(154,168,199,0.45)";
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(0, hy);
    ctx.lineTo(w, hy);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(154,168,199,0.7)";
    ctx.font = "11px system-ui";
    ctx.fillText("Horizon", 12, hy - 6);

    // relative wind
    const ry = h * 0.55;
    ctx.strokeStyle = "#7ecbff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(20, ry);
    ctx.lineTo(w * 0.35, ry);
    ctx.stroke();
    ctx.fillStyle = "#7ecbff";
    ctx.fillText("Relative wind", 20, ry - 10);

    // airfoil at AOA
    ctx.save();
    ctx.translate(w * 0.42, ry);
    ctx.rotate((-state.aoaG * Math.PI) / 180);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(40, -8, 90, -28, 160, -18);
    ctx.bezierCurveTo(120, 4, 50, 8, 0, 0);
    ctx.closePath();
    ctx.fillStyle = "rgba(91,157,255,0.4)";
    ctx.fill();
    ctx.strokeStyle = "#e8eefc";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = "#f0c14b";
    ctx.setLineDash([6, 3]);
    ctx.beginPath();
    ctx.moveTo(-10, 0);
    ctx.lineTo(170, 0);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    ctx.fillStyle = "#ff9f6b";
    ctx.font = "bold 13px system-ui";
    ctx.fillText("AOA " + state.aoaG.toFixed(1) + "°", w * 0.55, ry - 40);
    ctx.fillStyle = "#9aa8c7";
    ctx.font = "12px system-ui";
    ctx.fillText("Pitch " + state.pitch.toFixed(1) + "° (horizon)", w * 0.55, hy + 18);
  }

  function drawCL() {
    const canvas = $("clCanvas");
    if (!canvas) return;
    const { ctx, w, h } = sizeCanvas(canvas);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0a101c";
    ctx.fillRect(0, 0, w, h);

    const padL = 50;
    const padB = 40;
    const padT = 20;
    const padR = 20;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;
    const aMin = -4;
    const aMax = 22;
    const clMaxPlot = 2.2;

    function xOf(a) {
      return padL + ((a - aMin) / (aMax - aMin)) * plotW;
    }
    function yOf(cl) {
      return padT + plotH - (cl / clMaxPlot) * plotH;
    }

    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, padT + plotH);
    ctx.lineTo(padL + plotW, padT + plotH);
    ctx.stroke();
    ctx.fillStyle = "#9aa8c7";
    ctx.font = "11px system-ui";
    ctx.fillText("AOA", padL + plotW / 2, h - 12);
    ctx.fillText("CL", 8, padT + 10);

    const curve = M.clCurve(state.flaps, aMin, aMax, 0.5);
    ctx.beginPath();
    curve.forEach((p, i) => {
      const x = xOf(p.alpha);
      const y = yOf(p.cl);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = "#5b9dff";
    ctx.lineWidth = 2.5;
    ctx.stroke();

    const crit = M.criticalAOA(state.flaps);
    ctx.strokeStyle = "rgba(255,107,122,0.7)";
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(xOf(crit), padT);
    ctx.lineTo(xOf(crit), padT + plotH);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#ff6b7a";
    ctx.fillText("crit " + crit + "°", xOf(crit) + 4, padT + 14);

    const cl = M.clAtAlpha(state.aoaC, state.flaps);
    ctx.beginPath();
    ctx.arc(xOf(state.aoaC), yOf(cl), 6, 0, Math.PI * 2);
    ctx.fillStyle = M.isStalled(state.aoaC, state.flaps) ? "#ff6b7a" : "#3ecf8e";
    ctx.fill();
  }

  function drawBank() {
    const canvas = $("bankCanvas");
    if (!canvas) return;
    const { ctx, w, h } = sizeCanvas(canvas);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0a101c";
    ctx.fillRect(0, 0, w, h);

    const cx = w * 0.35;
    const cy = h * 0.5;
    const n = M.loadFactorLevelTurn(state.bank);
    const vs = M.stallSpeed(state.vs1, n);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((-state.bank * Math.PI) / 180);
    ctx.fillStyle = "rgba(91,157,255,0.45)";
    ctx.strokeStyle = "#e8eefc";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 70, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // lift
    ctx.strokeStyle = "#3ecf8e";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -80);
    ctx.stroke();
    ctx.restore();

    // weight
    ctx.strokeStyle = "#ff9f6b";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy + 70);
    ctx.stroke();
    ctx.fillStyle = "#ff9f6b";
    ctx.font = "12px system-ui";
    ctx.fillText("Weight", cx + 8, cy + 65);
    ctx.fillStyle = "#3ecf8e";
    ctx.fillText("Lift", cx - 90, cy - 50);

    ctx.fillStyle = "#e8eefc";
    ctx.font = "bold 16px system-ui";
    ctx.fillText(state.bank + "° bank", w * 0.58, h * 0.35);
    ctx.fillStyle = "#ff9f6b";
    ctx.fillText("n = " + n.toFixed(2) + " G", w * 0.58, h * 0.48);
    ctx.fillStyle = "#7ecbff";
    ctx.fillText("Vs ≈ " + vs.toFixed(0) + " KIAS", w * 0.58, h * 0.58);
    ctx.fillStyle = "#9aa8c7";
    ctx.font = "12px system-ui";
    ctx.fillText("from Vs1 = " + state.vs1 + " KIAS", w * 0.58, h * 0.68);
  }

  function drawScen() {
    const canvas = $("scenCanvas");
    if (!canvas) return;
    const { ctx, w, h } = sizeCanvas(canvas);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0a101c";
    ctx.fillRect(0, 0, w, h);

    const vs = M.stallSpeed(state.vs1S, state.nS);
    const maxV = 150;
    const pad = 40;
    const barY = h * 0.45;
    const barH = 28;
    const scale = (w - 2 * pad) / maxV;

    // background bar
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    ctx.fillRect(pad, barY, w - 2 * pad, barH);

    // stall zone
    ctx.fillStyle = "rgba(255,107,122,0.35)";
    ctx.fillRect(pad, barY, Math.min(vs, maxV) * scale, barH);

    // margin zone
    if (state.ias > vs) {
      ctx.fillStyle = "rgba(62,207,142,0.35)";
      ctx.fillRect(pad + vs * scale, barY, (Math.min(state.ias, maxV) - vs) * scale, barH);
    }

    // markers
    function mark(v, color, label, yOff) {
      const x = pad + Math.min(maxV, v) * scale;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, barY - 8);
      ctx.lineTo(x, barY + barH + 8);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = "11px system-ui";
      ctx.fillText(label, x - 10, barY + barH + 22 + yOff);
    }
    mark(vs, "#ff6b7a", "Vs " + vs.toFixed(0), 0);
    mark(state.ias, "#7ecbff", "IAS " + state.ias, 14);
    mark(state.vs1S, "#9aa8c7", "Vs1", 28);

    ctx.fillStyle = "#e8eefc";
    ctx.font = "14px system-ui";
    ctx.fillText("n = " + state.nS.toFixed(2) + " G", pad, 36);
    const margin = state.ias - vs;
    ctx.fillStyle = margin >= 0 ? "#3ecf8e" : "#ff6b7a";
    ctx.fillText(
      margin >= 0 ? "Margin +" + margin.toFixed(0) + " kt" : "BELOW stall speed " + margin.toFixed(0) + " kt",
      pad,
      58
    );
  }

  function update() {
    $("aoaGVal").textContent = state.aoaG.toFixed(1) + "°";
    $("pitchVal").textContent = state.pitch.toFixed(1) + "°";
    $("aoaGOut").textContent = state.aoaG.toFixed(1) + "°";
    $("pitchOut").textContent = state.pitch.toFixed(1) + "°";

    $("aoaCVal").textContent = state.aoaC.toFixed(1) + "°";
    const cl = M.clAtAlpha(state.aoaC, state.flaps);
    const crit = M.criticalAOA(state.flaps);
    const stalled = M.isStalled(state.aoaC, state.flaps);
    $("clOut").textContent = cl.toFixed(2);
    $("critOut").textContent = crit + "°";
    $("stallState").textContent = stalled ? "STALLED (critical AOA reached)" : "Flying (below critical AOA)";
    $("stallState").className = "v " + (stalled ? "hot" : "good");

    $("bankVal").textContent = state.bank + "°";
    $("vs1Val").textContent = state.vs1 + " KIAS";
    const n = M.loadFactorLevelTurn(state.bank);
    const vs = M.stallSpeed(state.vs1, n);
    $("nOut").textContent = n.toFixed(2) + " G";
    $("vsOut").textContent = vs.toFixed(1) + " KIAS";
    $("pctOut").textContent = "+" + (((vs / state.vs1 - 1) * 100).toFixed(0)) + "%";

    $("iasVal").textContent = state.ias;
    $("nSVal").textContent = state.nS.toFixed(2);
    $("vs1SVal").textContent = state.vs1S;
    const vsN = M.stallSpeed(state.vs1S, state.nS);
    const margin = state.ias - vsN;
    $("vsNow").textContent = vsN.toFixed(1) + " KIAS";
    $("marginOut").textContent = (margin >= 0 ? "+" : "") + margin.toFixed(0) + " kt";
    $("marginOut").className = "v " + (margin >= 10 ? "good" : margin >= 0 ? "hot" : "hot");
    let assess = "OK margin";
    if (margin < 0) assess = "STALL (IAS below Vs for this n)";
    else if (margin < 10) assess = "Thin margin — easy to stall with a little more G or AOA";
    $("assessOut").textContent = assess;
    $("assessOut").className = "v " + (margin < 0 ? "hot" : margin < 10 ? "hot" : "good");
    $("scenarioNote").innerHTML =
      "<strong>Remember:</strong> critical AOA is the same; at n = " +
      state.nS.toFixed(2) +
      " you hit it at about " +
      vsN.toFixed(0) +
      " KIAS instead of " +
      state.vs1S +
      ".";

    drawGeo();
    drawCL();
    drawBank();
    drawScen();
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
  bindStory();
  bindQuiz();
  renderStory();
  renderQuiz();
  window.addEventListener("resize", update);
  update();
})();
