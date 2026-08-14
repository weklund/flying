/**
 * Toy weight & balance model for learning.
 * NOT any real AFM/POH. Educational envelope only.
 */
(function (global) {
  "use strict";

  /** Toy "trainer" stations (inches aft of datum) */
  const AIRCRAFT = {
    name: "Study-kit trainer (TOY)",
    emptyWeight: 1600,
    emptyMoment: 1600 * 38.5, // CG 38.5"
    maxTakeoff: 2400,
    // Envelope: weight vs CG (inches) — simplified polygon
    // points [cg, weight] clockwise
    envelope: [
      { cg: 35.0, w: 1600 },
      { cg: 35.5, w: 2000 },
      { cg: 36.5, w: 2400 },
      { cg: 46.0, w: 2400 },
      { cg: 47.0, w: 2000 },
      { cg: 47.5, w: 1600 },
    ],
    stations: {
      front: { name: "Front seats", arm: 37 },
      rear: { name: "Rear seats", arm: 73 },
      fuel: { name: "Fuel (main)", arm: 48, lbPerGal: 6 },
      bag: { name: "Baggage", arm: 95 },
    },
  };

  function moment(weight, arm) {
    return weight * arm;
  }

  function cgFromTotals(totalWeight, totalMoment) {
    if (totalWeight <= 0) return 0;
    return totalMoment / totalWeight;
  }

  /**
   * Point-in-polygon for envelope (ray cast).
   * envelope points ordered around the region.
   */
  function insideEnvelope(cg, weight, envelope) {
    const pts = envelope;
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i].cg;
      const yi = pts[i].w;
      const xj = pts[j].cg;
      const yj = pts[j].w;
      const intersect =
        yi > weight !== yj > weight &&
        cg < ((xj - xi) * (weight - yi)) / (yj - yi + 1e-12) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  function compute(load) {
    const A = AIRCRAFT;
    const fuelLb = (load.fuelGal || 0) * A.stations.fuel.lbPerGal;
    const items = [
      { id: "empty", name: "Basic empty", weight: A.emptyWeight, arm: A.emptyMoment / A.emptyWeight },
      { id: "front", name: "Front seats", weight: load.frontLb || 0, arm: A.stations.front.arm },
      { id: "rear", name: "Rear seats", weight: load.rearLb || 0, arm: A.stations.rear.arm },
      { id: "fuel", name: "Fuel", weight: fuelLb, arm: A.stations.fuel.arm },
      { id: "bag", name: "Baggage", weight: load.bagLb || 0, arm: A.stations.bag.arm },
    ];
    let totalW = 0;
    let totalM = 0;
    const rows = items.map((it) => {
      const m = moment(it.weight, it.arm);
      totalW += it.weight;
      totalM += m;
      return { ...it, moment: m };
    });
    const cg = cgFromTotals(totalW, totalM);
    const underMax = totalW <= A.maxTakeoff + 1e-6;
    const inEnv = insideEnvelope(cg, totalW, A.envelope);
    // also check simple min/max cg range for messaging
    const cgFwd = 35;
    const cgAft = 47.5;

    return {
      rows,
      totalW,
      totalM,
      cg,
      underMax,
      inEnv,
      ok: underMax && inEnv,
      usefulLoad: totalW - A.emptyWeight,
      maxTakeoff: A.maxTakeoff,
      emptyWeight: A.emptyWeight,
      cgFwd,
      cgAft,
      fuelLb,
    };
  }

  /** Burn fuel: reduce gal, recompute */
  function afterBurn(load, burnGal) {
    const g = Math.max(0, (load.fuelGal || 0) - burnGal);
    return compute({ ...load, fuelGal: g });
  }

  const PRESETS = {
    dualLocal: {
      name: "Dual local (light)",
      frontLb: 340,
      rearLb: 0,
      fuelGal: 30,
      bagLb: 20,
    },
    fourHeavy: {
      name: "Four souls + bags",
      frontLb: 380,
      rearLb: 340,
      fuelGal: 40,
      bagLb: 80,
    },
    aftBags: {
      name: "Aft-heavy bags",
      frontLb: 170,
      rearLb: 0,
      fuelGal: 25,
      bagLb: 120,
    },
    fullFuelSolo: {
      name: "Solo full fuel",
      frontLb: 190,
      rearLb: 0,
      fuelGal: 50,
      bagLb: 10,
    },
  };

  const STORY = [
    {
      title: "1 · Empty + stations",
      text: "Start from basic empty weight and moment. Every added item has an arm from the datum. Moment = weight × arm.",
    },
    {
      title: "2 · Sum and divide",
      text: "Add all weights and all moments. CG = total moment ÷ total weight. That single number is the balance point in inches aft of the datum.",
    },
    {
      title: "3 · Envelope",
      text: "Plot weight vs CG. You must be under max weight and inside the polygon. Heavy and aft can pass one check and fail the other.",
    },
    {
      title: "4 · Fuel burn",
      text: "As you burn fuel, weight drops and CG often moves. Check takeoff and landing (or worst case) when tanks are far from the CG.",
    },
  ];

  const QUIZ = [
    {
      q: "CG is computed as:",
      choices: [
        "Total weight × total arm",
        "Total moment ÷ total weight",
        "Max gross − empty weight",
        "Fuel gallons × 6 only",
      ],
      answer: 1,
      explain: "CG = Σ(weight×arm) / Σweight.",
    },
    {
      q: "Moment equals:",
      choices: ["Weight ÷ arm", "Weight × arm", "CG × fuel", "Useful load only"],
      answer: 1,
      explain: "Moment = weight × arm.",
    },
    {
      q: "An aft CG beyond limits primarily risks:",
      choices: [
        "Always higher stall speed only",
        "Reduced longitudinal stability and difficult stall recovery",
        "No effect if under max weight",
        "Only longer landing rolls",
      ],
      answer: 1,
      explain: "Aft CG reduces longitudinal stability; recovery can be compromised.",
    },
    {
      q: "Useful load is best described as:",
      choices: [
        "Empty weight only",
        "Max weight minus empty (what you can add)",
        "Baggage compartment limit only",
        "Unusable fuel",
      ],
      answer: 1,
      explain: "Useful load ≈ max allowable − empty weight.",
    },
  ];

  global.WBModel = {
    AIRCRAFT,
    moment,
    cgFromTotals,
    insideEnvelope,
    compute,
    afterBurn,
    PRESETS,
    STORY,
    QUIZ,
  };
})(typeof window !== "undefined" ? window : globalThis);
