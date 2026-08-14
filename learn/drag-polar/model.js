/**
 * Educational drag polar / L/D model.
 * Cd = Cd0 + k*CL^2 style toy; not an AFM polar.
 */
(function (global) {
  "use strict";

  const RHO = 1.225;
  const S = 16; // m² toy wing
  const W = 11000; // N ~ 2470 lb

  /** Parasite drag coeff base; dirty multiplies */
  function cd0(config) {
    if (config === "dirty") return 0.045;
    if (config === "gear") return 0.035;
    return 0.025; // clean
  }

  function kInduced(AR) {
    const e = 0.8;
    return 1 / (Math.PI * e * Math.max(4, AR));
  }

  /** CL for level flight at TAS (m/s): CL = W / (0.5 rho V^2 S) */
  function clLevel(Vms, weightN) {
    const q = 0.5 * RHO * Vms * Vms * S;
    if (q < 1) return 5;
    return weightN / q;
  }

  function cdTotal(CL, config, AR) {
    return cd0(config) + kInduced(AR) * CL * CL;
  }

  function dragForce(Vms, config, AR, weightN) {
    const CL = clLevel(Vms, weightN);
    const CD = cdTotal(CL, config, AR);
    return 0.5 * RHO * Vms * Vms * S * CD;
  }

  function parasiteDrag(Vms, config) {
    return 0.5 * RHO * Vms * Vms * S * cd0(config);
  }

  function inducedDrag(Vms, config, AR, weightN) {
    const total = dragForce(Vms, config, AR, weightN);
    return Math.max(0, total - parasiteDrag(Vms, config));
  }

  function liftDragRatio(Vms, config, AR, weightN) {
    const D = dragForce(Vms, config, AR, weightN);
    if (D < 1) return 0;
    return weightN / D; // level flight L≈W
  }

  /** Scan for max L/D and min drag speed (m/s) */
  function findBest(config, AR, weightN) {
    let bestLD = 0;
    let vBest = 40;
    let minD = 1e12;
    let vMinD = 40;
    for (let v = 25; v <= 90; v += 0.5) {
      const ld = liftDragRatio(v, config, AR, weightN);
      const d = dragForce(v, config, AR, weightN);
      if (ld > bestLD) {
        bestLD = ld;
        vBest = v;
      }
      if (d < minD) {
        minD = d;
        vMinD = v;
      }
    }
    return { bestLD, vBest, minD, vMinD };
  }

  function msToKt(ms) {
    return ms * 1.94384;
  }

  const STORY = [
    {
      title: "1 · Two drags",
      text: "Parasite drag grows with speed. Induced drag is the price of lift—worst when you are slow and the wing is working hard (high CL).",
      mode: "curves",
    },
    {
      title: "2 · The U-curve",
      text: "Add them and you get a valley. Near that speed, total drag is minimum and L/D is maximum—best still-air glide in the simple model.",
      mode: "curves",
    },
    {
      title: "3 · Dirty configuration",
      text: "Gear and flaps raise parasite drag. The whole total-drag curve shifts up and the best speeds change. Use AFM numbers for real flying.",
      mode: "curves",
    },
    {
      title: "4 · Ground effect",
      text: "Near the runway, induced drag drops. That is why you float and why soft-field technique uses the ground-effect region—see the ground effect note.",
      mode: "guide",
    },
  ];

  const QUIZ = [
    {
      q: "As airspeed increases in level flight, induced drag generally:",
      choices: [
        "Increases with V²",
        "Decreases",
        "Stays constant",
        "Becomes equal to weight",
      ],
      answer: 1,
      explain: "Higher speed → lower CL for the same weight → less induced drag.",
    },
    {
      q: "Parasite drag primarily:",
      choices: [
        "Falls as speed increases",
        "Rises with dynamic pressure / roughly V²",
        "Is zero in a climb",
        "Only exists with flaps extended",
      ],
      answer: 1,
      explain: "Parasite drag scales with dynamic pressure.",
    },
    {
      q: "Maximum L/D is associated with:",
      choices: [
        "Minimum total drag (for the simple polar picture)",
        "Maximum induced drag",
        "Vne",
        "Only full flaps",
      ],
      answer: 0,
      explain: "At min total drag, lift/drag is maximized for level-flight idealizations.",
    },
    {
      q: "Ground effect primarily reduces:",
      choices: ["Parasite drag", "Induced drag", "Weight", "Thrust available"],
      answer: 1,
      explain: "Near the surface, induced drag decreases.",
    },
  ];

  global.DragModel = {
    RHO,
    S,
    W,
    cd0,
    kInduced,
    clLevel,
    cdTotal,
    dragForce,
    parasiteDrag,
    inducedDrag,
    liftDragRatio,
    findBest,
    msToKt,
    STORY,
    QUIZ,
  };
})(typeof window !== "undefined" ? window : globalThis);
