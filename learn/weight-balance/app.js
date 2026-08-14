(function () {
  "use strict";
  const M = window.WBModel;
  if (!M) return;
  const $ = (id) => document.getElementById(id);

  const state = {
    frontLb: 340,
    rearLb: 0,
    fuelGal: 30,
    bagLb: 20,
    burnGal: 0,
    storyIdx: 0,
    quizIdx: 0,
    quizAnswered: {},
  };

  function load() {
    return {
      frontLb: state.frontLb,
      rearLb: state.rearLb,
      fuelGal: state.fuelGal,
      bagLb: state.bagLb,
    };
  }

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
    [
      ["front", "frontLb"],
      ["rear", "rearLb"],
      ["fuel", "fuelGal"],
      ["bag", "bagLb"],
      ["burn", "burnGal"],
    ].forEach(([id, key]) => {
      $(id).addEventListener("input", (e) => {
        state[key] = +e.target.value;
        update();
      });
    });
  }

  function buildPresets() {
    const host = $("presets");
    Object.keys(M.PRESETS).forEach((key) => {
      const p = M.PRESETS[key];
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = p.name;
      b.addEventListener("click", () => {
        state.frontLb = p.frontLb;
        state.rearLb = p.rearLb;
        state.fuelGal = p.fuelGal;
        state.bagLb = p.bagLb;
        state.burnGal = 0;
        $("front").value = state.frontLb;
        $("rear").value = state.rearLb;
        $("fuel").value = state.fuelGal;
        $("bag").value = state.bagLb;
        $("burn").value = 0;
        document.querySelectorAll("#presets button").forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        update();
      });
      host.appendChild(b);
    });
  }

  function sizeCanvas(canvas) {
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth || 520;
    const h = canvas.clientHeight || 320;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, w, h };
  }

  function drawEnvelope(to, land) {
    const canvas = $("envCanvas");
    if (!canvas) return;
    const { ctx, w, h } = sizeCanvas(canvas);
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#0a101c";
    ctx.fillRect(0, 0, w, h);

    const env = M.AIRCRAFT.envelope;
    const cgMin = 33;
    const cgMax = 50;
    const wMin = 1500;
    const wMax = 2500;
    const padL = 50;
    const padB = 40;
    const padT = 20;
    const padR = 20;
    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    function xOf(cg) {
      return padL + ((cg - cgMin) / (cgMax - cgMin)) * plotW;
    }
    function yOf(wt) {
      return padT + plotH - ((wt - wMin) / (wMax - wMin)) * plotH;
    }

    // axes
    ctx.strokeStyle = "rgba(255,255,255,0.2)";
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL, padT + plotH);
    ctx.lineTo(padL + plotW, padT + plotH);
    ctx.stroke();
    ctx.fillStyle = "#9aa8c7";
    ctx.font = "11px system-ui";
    ctx.fillText("CG → aft", padL + plotW / 2 - 20, h - 12);
    ctx.fillText("Weight", 8, padT + 12);

    // envelope
    ctx.beginPath();
    env.forEach((p, i) => {
      const x = xOf(p.cg);
      const y = yOf(p.w);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fillStyle = "rgba(62,207,142,0.15)";
    ctx.fill();
    ctx.strokeStyle = "#3ecf8e";
    ctx.lineWidth = 2;
    ctx.stroke();

    // takeoff point
    ctx.beginPath();
    ctx.arc(xOf(to.cg), yOf(to.totalW), 7, 0, Math.PI * 2);
    ctx.fillStyle = to.ok ? "#3ecf8e" : "#ff6b7a";
    ctx.fill();
    ctx.fillStyle = "#e8eefc";
    ctx.font = "11px system-ui";
    ctx.fillText("TO", xOf(to.cg) + 10, yOf(to.totalW));

    // landing / after burn
    ctx.beginPath();
    ctx.arc(xOf(land.cg), yOf(land.totalW), 7, 0, Math.PI * 2);
    ctx.strokeStyle = land.ok ? "#7ecbff" : "#ff9f6b";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillText("Burn", xOf(land.cg) + 10, yOf(land.totalW) + 12);

    ctx.fillStyle = "#9aa8c7";
    ctx.fillText("● takeoff  ○ after burn", padL, padT + plotH + 28);
  }

  function renderTable(result) {
    const host = $("tableHost");
    let html =
      '<table style="width:100%;border-collapse:collapse;color:#9aa8c7">' +
      "<tr style='color:#e8eefc'><th align='left'>Item</th><th align='right'>Wt</th><th align='right'>Arm</th><th align='right'>Moment</th></tr>";
    result.rows.forEach((r) => {
      if (r.weight === 0 && r.id !== "empty") return;
      html +=
        "<tr><td>" +
        r.name +
        "</td><td align='right'>" +
        r.weight.toFixed(0) +
        "</td><td align='right'>" +
        r.arm.toFixed(1) +
        "</td><td align='right'>" +
        r.moment.toFixed(0) +
        "</td></tr>";
    });
    html +=
      "<tr style='color:#e8eefc;font-weight:700'><td>Total</td><td align='right'>" +
      result.totalW.toFixed(0) +
      "</td><td align='right'>" +
      result.cg.toFixed(2) +
      '″</td><td align="right">' +
      result.totalM.toFixed(0) +
      "</td></tr></table>";
    host.innerHTML = html;
  }

  function update() {
    $("frontVal").textContent = state.frontLb;
    $("rearVal").textContent = state.rearLb;
    $("fuelVal").textContent = state.fuelGal + " gal (" + state.fuelGal * 6 + " lb)";
    $("bagVal").textContent = state.bagLb;
    $("burnVal").textContent = state.burnGal;
    $("acLabel").textContent =
      M.AIRCRAFT.name +
      " · empty " +
      M.AIRCRAFT.emptyWeight +
      " lb · max " +
      M.AIRCRAFT.maxTakeoff +
      " lb";

    const to = M.compute(load());
    const land = M.afterBurn(load(), state.burnGal);

    $("wOut").textContent = to.totalW.toFixed(0) + " lb";
    $("wOut").className = "v " + (to.underMax ? "good" : "hot");
    $("cgOut").textContent = to.cg.toFixed(2) + " in";
    $("mOut").textContent = to.totalM.toFixed(0) + " lb·in";
    $("uOut").textContent = to.usefulLoad.toFixed(0) + " lb";

    const v = $("verdict");
    if (to.ok) {
      v.className = "verdict ok";
      v.textContent = "OK (toy)";
      $("verdictDetail").textContent =
        "Within max weight and envelope at takeoff loading.";
    } else {
      v.className = "verdict no";
      v.textContent = "NO-GO (toy)";
      const reasons = [];
      if (!to.underMax) reasons.push("over max weight");
      if (!to.inEnv) reasons.push("CG outside envelope");
      $("verdictDetail").textContent = reasons.join(" · ");
    }

    $("toStatus").textContent = to.ok ? "INSIDE" : "OUTSIDE";
    $("toStatus").className = "v " + (to.ok ? "good" : "hot");
    $("ldStatus").textContent = land.ok ? "INSIDE" : "OUTSIDE";
    $("ldStatus").className = "v " + (land.ok ? "good" : "hot");

    renderTable(to);
    drawEnvelope(to, land);
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

  // verdict styles if missing from copied CSS
  if (!document.getElementById("wbExtraStyle")) {
    const s = document.createElement("style");
    s.id = "wbExtraStyle";
    s.textContent =
      ".verdict{display:inline-flex;margin-top:.75rem;padding:.45rem .75rem;border-radius:999px;font-weight:800;font-size:.85rem}" +
      ".verdict.ok{background:rgba(62,207,142,.15);color:#3ecf8e}" +
      ".verdict.no{background:rgba(255,107,122,.15);color:#ff6b7a}" +
      ".tape-caption{margin-top:.5rem;font-size:.85rem;color:#9aa8c7;line-height:1.45}" +
      "#tableHost table th,#tableHost table td{padding:.25rem .35rem;border-bottom:1px solid rgba(255,255,255,.06)}";
    document.head.appendChild(s);
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
