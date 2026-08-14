/**
 * Educational AOA / stall / load-factor model.
 * Not for flight planning. CL curves are schematic.
 */
(function (global) {
  "use strict";

  const DEG = Math.PI / 180;

  /** Load factor in coordinated level turn: n = 1/cos(φ). φ in degrees. */
  function loadFactorLevelTurn(bankDeg) {
    const b = Math.min(89, Math.max(0, bankDeg));
    return 1 / Math.cos(b * DEG);
  }

  /** Stall speed under load factor: Vs = Vs1 * sqrt(n) */
  function stallSpeed(vs1, n) {
    return vs1 * Math.sqrt(Math.max(0.1, n));
  }

  /**
   * Schematic CL(α) for clean wing.
   * Critical AOA ~ 16°, CLmax ~ 1.5 (toy numbers).
   */
  function clAtAlpha(alphaDeg, flaps) {
    const aCrit = flaps === "full" ? 14 : 16;
    const clMax = flaps === "full" ? 2.0 : flaps === "partial" ? 1.75 : 1.5;
    const a0 = flaps === "full" ? -4 : flaps === "partial" ? -2 : 0; // zero-lift shift
    const a = alphaDeg;
    if (a < a0) return 0.1 * (a - a0);
    // linear then peak then drop
    const aPeak = aCrit;
    if (a <= aPeak) {
      return ((clMax) / (aPeak - a0)) * (a - a0);
    }
    // post-stall drop
    const drop = (a - aPeak) * 0.12;
    return Math.max(0.2, clMax - drop);
  }

  function isStalled(alphaDeg, flaps) {
    const aCrit = flaps === "full" ? 14 : 16;
    return alphaDeg >= aCrit - 0.05;
  }

  function criticalAOA(flaps) {
    return flaps === "full" ? 14 : flaps === "partial" ? 15 : 16;
  }

  /** Sample CL curve for plotting */
  function clCurve(flaps, from, to, step) {
    const pts = [];
    for (let a = from; a <= to + 1e-9; a += step) {
      pts.push({ alpha: a, cl: clAtAlpha(a, flaps) });
    }
    return pts;
  }

  /**
   * Required AOA toy: for level flight CL_req = n*W / (0.5 rho V^2 S)
   * Returns alpha that would produce that CL on the schematic curve (pre-stall).
   */
  function alphaForCL(clTarget, flaps) {
    // invert rising portion by scan
    for (let a = -5; a < criticalAOA(flaps); a += 0.1) {
      if (clAtAlpha(a, flaps) >= clTarget) return a;
    }
    return criticalAOA(flaps);
  }

  function clRequired(n, weightN, rho, Vms, S) {
    const q = 0.5 * rho * Vms * Vms;
    if (q < 1) return 99;
    return (n * weightN) / (q * S);
  }

  const STORY = [
    {
      title: "1 · What is AOA?",
      text: "Angle of attack is chord line versus relative wind—not pitch to the horizon. The wing only “knows” AOA and dynamic pressure.",
      mode: "geometry",
    },
    {
      title: "2 · Critical AOA",
      text: "Raise AOA and CL rises until the critical angle—then the wing stalls. For a given flap setting, that critical AOA is essentially fixed.",
      mode: "clcurve",
    },
    {
      title: "3 · Any airspeed",
      text: "You can reach critical AOA in a slow 1 G approach or in a fast, high-G pull-up. Airspeed alone does not guarantee margin.",
      mode: "clcurve",
    },
    {
      title: "4 · Bank and Gs",
      text: "In a level turn, n = 1/cos(bank). At 60° bank you pull 2 G. Stall speed rises by √n—about 41% higher at 2 G.",
      mode: "load",
    },
    {
      title: "5 · Scenarios",
      text: "Compare level cruise, steep turn, and accelerated stall. Same critical AOA; very different airspeeds when the stall happens.",
      mode: "scenario",
    },
  ];

  const QUIZ = [
    {
      q: "Angle of attack is defined as the angle between:",
      choices: [
        "The longitudinal axis and the horizon",
        "The chord line of the wing and the relative wind",
        "The mean camber line and the chord line",
        "Pitch attitude and flight path only in climbs",
      ],
      answer: 1,
      explain: "Standard PHAK / knowledge-test definition: chord line vs relative wind.",
    },
    {
      q: "For a given configuration, an airplane stalls when:",
      choices: [
        "Airspeed drops below a magic number regardless of AOA",
        "The critical angle of attack is exceeded",
        "Altitude is below 1,000 ft AGL",
        "The propeller is at high RPM",
      ],
      answer: 1,
      explain: "Stall is an AOA event; critical AOA is essentially constant for the configuration.",
    },
    {
      q: "In a coordinated level 60° bank turn, load factor is approximately:",
      choices: ["1.0 G", "1.4 G", "2.0 G", "3.0 G"],
      answer: 2,
      explain: "n = 1/cos(60°) = 2.",
    },
    {
      q: "If 1 G stall speed is 50 KIAS, stall speed at 2 G is about:",
      choices: ["50 KIAS", "71 KIAS", "100 KIAS", "25 KIAS"],
      answer: 1,
      explain: "Vs = 50 × √2 ≈ 70.7 KIAS.",
    },
    {
      q: "Critical AOA (same flaps/config):",
      choices: [
        "Increases in a steep turn",
        "Decreases when weight increases",
        "Stays essentially the same; required airspeed changes with load factor",
        "Only applies on final approach",
      ],
      answer: 2,
      explain: "PHAK: critical AOA does not change with bank/weight the way pilots sometimes assume; stall speed does change with n.",
    },
  ];

  global.AoaModel = {
    DEG,
    loadFactorLevelTurn,
    stallSpeed,
    clAtAlpha,
    isStalled,
    criticalAOA,
    clCurve,
    alphaForCL,
    clRequired,
    STORY,
    QUIZ,
  };
})(typeof window !== "undefined" ? window : globalThis);
