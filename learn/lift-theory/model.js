/**
 * Educational lift / aerodynamics model for the Lift Theory Lab.
 * Not a CFD solver — consistent toy models for learning.
 */
(function (global) {
  "use strict";

  const RHO0 = 1.225; // kg/m³ sea-level standard
  const DEG = Math.PI / 180;

  /** Bernoulli: p + ½ρV² = H (along streamline, incompressible, inviscid). */
  function bernoulliPressure(rho, V, H) {
    return H - 0.5 * rho * V * V;
  }

  /** Stagnation / freestream total pressure H = p∞ + ½ρV∞² */
  function totalPressure(pInf, rho, Vinf) {
    return pInf + 0.5 * rho * Vinf * Vinf;
  }

  function pressureCoefficient(V, Vinf) {
    if (Vinf <= 0) return 0;
    const r = V / Vinf;
    return 1 - r * r;
  }

  /**
   * Venturi: area ratio → velocity ratio (continuity, incompressible).
   * A * V = const → V_throat = V_in * (A_in / A_throat)
   */
  function venturi(state) {
    const { Vin, areaRatio, rho, pInf } = state;
    // areaRatio = A_in / A_throat ≥ 1
    const ar = Math.max(1.01, areaRatio);
    const Vt = Vin * ar;
    const H = totalPressure(pInf, rho, Vin);
    const pIn = pInf;
    const pThroat = bernoulliPressure(rho, Vt, H);
    const pOut = pInf; // recover (ideal)
    return {
      Vin,
      Vt,
      Vout: Vin,
      pIn,
      pThroat,
      pOut,
      dP: pIn - pThroat,
      CpThroat: pressureCoefficient(Vt, Vin),
      H,
    };
  }

  /**
   * Thin-airfoil-ish CL: CL = 2π (α − α_L0) with α in radians.
   * Camber shifts zero-lift angle: α_L0 ≈ −camberParam (rad toy).
   */
  function sectionCL(alphaDeg, camber, stalled) {
    const a0 = -camber * 0.15; // rad, camber 0–1 → a_L0
    const a = alphaDeg * DEG;
    if (stalled || alphaDeg > 15) {
      // crude post-stall drop
      const aStall = 15 * DEG;
      const clMax = 2 * Math.PI * (aStall - a0);
      return Math.max(0.2, clMax * (1 - (alphaDeg - 15) / 25));
    }
    return 2 * Math.PI * (a - a0);
  }

  /** Kutta–Joukowski: Γ = ½ c V∞ CL  (from L' = ρ V Γ and L' = ½ ρ V² c CL) */
  function circulation(Vinf, chord, CL) {
    return 0.5 * chord * Vinf * CL;
  }

  function liftPerSpan(rho, Vinf, Gamma) {
    return rho * Vinf * Gamma;
  }

  function liftForce(rho, Vinf, S, CL) {
    return 0.5 * rho * Vinf * Vinf * S * CL;
  }

  /**
   * Schematic surface speed / Cp distribution along chord (0–1).
   * Educational shapes, not panel-method output.
   */
  function surfaceDistribution(alphaDeg, camber, n) {
    n = n || 40;
    const upper = [];
    const lower = [];
    const a = Math.max(-5, Math.min(18, alphaDeg));
    const c = Math.max(0, Math.min(1, camber));
    for (let i = 0; i < n; i++) {
      const x = i / (n - 1);
      // peak suction near LE at high AOA
      const peak = 0.15 + 0.1 * (a / 15);
      const upperBoost =
        (1.15 + 0.55 * c + 0.04 * a) *
        Math.exp(-Math.pow((x - peak) / 0.28, 2)) *
        (1 + 0.35 * Math.sin(Math.PI * x));
      const lowerBoost =
        (0.85 - 0.08 * a + 0.1 * c) *
        (0.7 + 0.3 * Math.sin(Math.PI * x * 0.9));
      // ensure upper faster on average at +AOA
      let Vu = 0.75 + upperBoost * (0.55 + 0.02 * a);
      let Vl = 0.75 + lowerBoost * 0.35;
      if (a > 0) Vu += 0.02 * a * (1 - x);
      if (a < 0) Vl += 0.02 * (-a) * (1 - x);
      // Kutta-ish: equalize near TE
      const blend = Math.pow(x, 3);
      const Vte = 0.5 * (Vu + Vl);
      Vu = Vu * (1 - blend) + Vte * blend;
      Vl = Vl * (1 - blend) + Vte * blend;
      upper.push({ x, V: Vu, Cp: 1 - Vu * Vu });
      lower.push({ x, V: Vl, Cp: 1 - Vl * Vl });
    }
    return { upper, lower };
  }

  /**
   * Mean |ΔCp| proxy for lift from distribution (normalized).
   */
  function clFromDistribution(dist) {
    let sum = 0;
    const n = dist.upper.length;
    for (let i = 0; i < n; i++) {
      sum += dist.lower[i].Cp - dist.upper[i].Cp;
    }
    return sum / n * 1.1; // scale toward thin-airfoil order
  }

  /** Downwash angle (deg) toy from CL and AR */
  function downwashDeg(CL, AR) {
    const ar = Math.max(2, AR);
    // ε ≈ CL / (π AR) rad for elliptic-ish
    return (CL / (Math.PI * ar)) / DEG;
  }

  function inducedDragFactor(CL, AR, e) {
    e = e || 0.8;
    return (CL * CL) / (Math.PI * e * Math.max(2, AR));
  }

  const PRESETS = {
    cruise: { alphaDeg: 4, camber: 0.35, Vinf: 50, chord: 1.5, span: 10, rho: RHO0, AR: 7 },
    climb: { alphaDeg: 10, camber: 0.4, Vinf: 40, chord: 1.5, span: 10, rho: RHO0, AR: 7 },
    approach: { alphaDeg: 12, camber: 0.7, Vinf: 30, chord: 1.6, span: 10, rho: RHO0, AR: 7 },
    sym: { alphaDeg: 6, camber: 0, Vinf: 50, chord: 1.5, span: 10, rho: RHO0, AR: 7 },
    zero: { alphaDeg: 0, camber: 0, Vinf: 50, chord: 1.5, span: 10, rho: RHO0, AR: 7 },
  };

  const STORY = [
    {
      title: "1 · Bernoulli (local pressure)",
      text: "Along a streamline, higher speed means lower static pressure. A venturi makes this obvious: the throat is fast and low-pressure. On a wing, faster upper-surface flow produces suction (low Cp).",
      mode: "bernoulli",
    },
    {
      title: "2 · Newton (momentum)",
      text: "The wing changes the air’s momentum—especially downward (downwash). By Newton’s third law, the air pushes the wing up. This is the same lift as the pressure integral, viewed from a control volume.",
      mode: "newton",
    },
    {
      title: "3 · Circulation & Kutta",
      text: "In 2-D inviscid theory, lift per span is ρ V∞ Γ. Viscosity + a sharp trailing edge enforces the Kutta condition, selecting the unique circulation so flow leaves the TE smoothly. Without Kutta, Γ is not determined.",
      mode: "circulation",
    },
    {
      title: "4 · Finite wing",
      text: "3-D wings trail vortices. Downwash reduces effective angle of attack and creates induced drag ≈ CL²/(π e AR). Density altitude matters because L = ½ ρ V² S CL—lower ρ needs higher V or CL for the same lift.",
      mode: "airfoil",
    },
    {
      title: "5 · Synthesis",
      text: "Bernoulli, Newton, and circulation are complementary descriptions of one flow. Myths: equal transit time; ‘only the bottom pushes’; ‘pick Bernoulli or Newton.’ PHAK: both Bernoulli and Newton operate whenever lift is generated.",
      mode: "synthesis",
    },
  ];

  const QUIZ = [
    {
      q: "Bernoulli’s principle (PHAK wording) says that as fluid velocity increases:",
      choices: [
        "Static pressure within the fluid decreases",
        "Temperature must decrease",
        "Mass flow must decrease",
        "Dynamic pressure decreases",
      ],
      answer: 0,
      explain: "PHAK: as velocity of a moving fluid increases, pressure within the fluid decreases.",
    },
    {
      q: "Kutta–Joukowski lift per unit span is:",
      choices: ["½ ρ V² S CL", "ρ V∞ Γ", "ρ g h", "2π α only"],
      answer: 1,
      explain: "L' = ρ∞ V∞ Γ. The CL form is equivalent once Γ is related to CL.",
    },
    {
      q: "The Kutta condition at a sharp trailing edge:",
      choices: [
        "Forces equal transit time on upper and lower surfaces",
        "Selects circulation so flow leaves the TE smoothly (real viscous effect idealized)",
        "Sets freestream density",
        "Eliminates induced drag",
      ],
      answer: 1,
      explain: "Kutta fixes Γ for inviscid models so the rear stagnation is at the TE.",
    },
    {
      q: "Equal transit time (“air parcels meet at the TE”) is:",
      choices: [
        "Required by continuity",
        "A common myth; upper flow is typically faster and does not take equal time",
        "The definition of camber",
        "True only for symmetrical airfoils",
      ],
      answer: 1,
      explain: "Parcels that split at the LE generally do not rejoin after equal times.",
    },
    {
      q: "PHAK states that when an airfoil produces lift:",
      choices: [
        "Only Bernoulli applies",
        "Only Newton applies",
        "Both Bernoulli’s principle and Newton’s laws are in operation",
        "Circulation is forbidden",
      ],
      answer: 2,
      explain: "PHAK Ch. 4 explicitly pairs both descriptions.",
    },
    {
      q: "A symmetrical airfoil at zero AOA (inviscid, no flap):",
      choices: [
        "Always produces positive lift",
        "Produces zero lift (CL ≈ 0); lift appears with AOA",
        "Violates Bernoulli",
        "Cannot fly",
      ],
      answer: 1,
      explain: "Symmetrical sections need AOA (or camber devices) for lift—so “longer path” alone is incomplete.",
    },
  ];

  global.LiftModel = {
    RHO0,
    DEG,
    bernoulliPressure,
    totalPressure,
    pressureCoefficient,
    venturi,
    sectionCL,
    circulation,
    liftPerSpan,
    liftForce,
    surfaceDistribution,
    clFromDistribution,
    downwashDeg,
    inducedDragFactor,
    PRESETS,
    STORY,
    QUIZ,
  };
})(typeof window !== "undefined" ? window : globalThis);
