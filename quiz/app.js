(() => {
  const qs = window.QUIZ_QUESTIONS || [];
  const $ = (id) => document.getElementById(id);

  const setup = $("setup");
  const quiz = $("quiz");
  const results = $("results");
  const topicFilter = $("topicFilter");
  const modeSel = $("mode");
  const shuffleSel = $("shuffle");
  const startBtn = $("startBtn");
  const nextBtn = $("nextBtn");
  const quitBtn = $("quitBtn");
  const retryBtn = $("retryBtn");
  const choicesEl = $("choices");
  const feedback = $("feedback");
  const progressText = $("progressText");
  const progressFill = $("progressFill");
  const scoreLive = $("scoreLive");
  const topicTag = $("topicTag");
  const questionText = $("questionText");
  const resultSummary = $("resultSummary");
  const missedList = $("missedList");

  let deck = [];
  let idx = 0;
  let correctCount = 0;
  let answered = false;
  let missed = [];
  let mode = "study";

  // populate topics
  const topics = [...new Set(qs.map((q) => q.topic))].sort();
  for (const t of topics) {
    const opt = document.createElement("option");
    opt.value = t;
    opt.textContent = t;
    topicFilter.appendChild(opt);
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function show(el) {
    setup.classList.add("hidden");
    quiz.classList.add("hidden");
    results.classList.add("hidden");
    el.classList.remove("hidden");
  }

  function start() {
    mode = modeSel.value;
    const topic = topicFilter.value;
    let pool = topic === "all" ? qs.slice() : qs.filter((q) => q.topic === topic);
    if (!pool.length) {
      alert("No questions for that topic.");
      return;
    }
    deck = shuffleSel.value === "yes" ? shuffle(pool) : pool;
    idx = 0;
    correctCount = 0;
    missed = [];
    answered = false;
    show(quiz);
    renderQuestion();
  }

  function renderQuestion() {
    answered = false;
    nextBtn.disabled = true;
    feedback.classList.add("hidden");
    feedback.innerHTML = "";
    choicesEl.innerHTML = "";

    const q = deck[idx];
    progressText.textContent = `${idx + 1} / ${deck.length}`;
    progressFill.style.width = `${((idx) / deck.length) * 100}%`;
    scoreLive.textContent = mode === "exam" ? `Score: ${correctCount}` : "";
    topicTag.textContent = `${q.topic}${q.session ? ` · Session ${q.session}` : ""}`;
    questionText.textContent = q.question;

    q.choices.forEach((text, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice";
      btn.textContent = text;
      btn.addEventListener("click", () => selectChoice(i, btn));
      choicesEl.appendChild(btn);
    });
  }

  function selectChoice(i, btn) {
    if (answered) return;
    answered = true;
    const q = deck[idx];
    const buttons = [...choicesEl.querySelectorAll(".choice")];
    buttons.forEach((b) => (b.disabled = true));

    const ok = i === q.answer;
    if (ok) {
      correctCount += 1;
      btn.classList.add("correct");
    } else {
      btn.classList.add("wrong");
      buttons[q.answer]?.classList.add("correct");
      missed.push({ q, chosen: i });
    }

    if (mode === "study") {
      feedback.classList.remove("hidden");
      feedback.innerHTML = `
        <strong>${ok ? "Correct" : "Not quite"}.</strong>
        ${q.explain || ""}
        <div class="sources">Sources: ${(q.sources || []).join(" · ")}</div>
      `;
    }

    scoreLive.textContent = mode === "exam" ? `Score: ${correctCount}` : "";
    nextBtn.disabled = false;
    nextBtn.textContent = idx + 1 >= deck.length ? "See results" : "Next";
    progressFill.style.width = `${((idx + 1) / deck.length) * 100}%`;
  }

  function next() {
    if (!answered) return;
    if (idx + 1 >= deck.length) {
      finish();
      return;
    }
    idx += 1;
    renderQuestion();
  }

  function finish() {
    show(results);
    const pct = Math.round((correctCount / deck.length) * 100);
    resultSummary.textContent = `You scored ${correctCount} / ${deck.length} (${pct}%).`;
    missedList.innerHTML = "";
    if (!missed.length) {
      missedList.innerHTML = `<p class="muted">No misses — nice work. Review the FAA PHAK chapters linked in STUDY_INDEX.md to deepen retention.</p>`;
      return;
    }
    const h = document.createElement("h3");
    h.textContent = "Review misses";
    missedList.appendChild(h);
    for (const { q, chosen } of missed) {
      const div = document.createElement("div");
      div.className = "missed";
      div.innerHTML = `
        <h3>${q.topic}</h3>
        <p>${q.question}</p>
        <p class="muted"><strong>Your answer:</strong> ${q.choices[chosen]}</p>
        <p><strong>Correct:</strong> ${q.choices[q.answer]}</p>
        <p class="muted">${q.explain || ""}</p>
        <p class="muted">Sources: ${(q.sources || []).join(" · ")}</p>
      `;
      missedList.appendChild(div);
    }
  }

  startBtn.addEventListener("click", start);
  nextBtn.addEventListener("click", next);
  quitBtn.addEventListener("click", () => show(setup));
  retryBtn.addEventListener("click", () => show(setup));
})();
