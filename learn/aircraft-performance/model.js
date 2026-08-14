/**
 * Educational atmosphere + performance model.
 * NOT for flight planning. Use AFM/POH for real operations.
 *
 * Formulas are documented approximations suitable for learning magnitude
 * and interactions (PHAK Ch. 4 / 11 themes).
 */
(function (global) {
  "use strict";

  const STD_SL_PRESSURE_INHG = 29.92;
  const STD_SL_TEMP_C = 15;
  const LAPSE_C_PER_FT = 0.0019812; // ~2 °C / 1000 ft
  const FT_PER_INHG = 1000;

  /** Pressure altitude (ft) from field elevation and altimeter setting (inHg). */
  function pressureAltitude(elevationFt, altimeterInHg) {
    return elevationFt + (STD_SL_PRESSURE_INHG - altimeterInHg) * FT_PER_INHG;
  }

  /** ISA temperature (°C) at a given pressure altitude (ft). */
  function isaTempC(pressureAltFt) {
    return STD_SL_TEMP_C - LAPSE_C_PER_FT * pressureAltFt;
  }

  /**
   * Dry density altitude (ft) — pressure altitude corrected for nonstandard temp.
   * Common rule-of-thumb form used in training (≈ 120 ft per °C off ISA).
   * At ISA conditions, DA ≈ PA.
   */
  function densityAltitudeDry(pressureAltFt, oatC) {
    const isa = isaTempC(pressureAltFt);
    const deltaT = oatC - isa;
    return pressureAltFt + 120 * deltaT;
  }

  /**
   * Approximate humidity contribution to density altitude (ft).
   * Uses simplified vapor-pressure approach (educational):
   *   e ≈ 6.112 * exp(17.67 * Td / (Td + 243.5))  [hPa, Td in °C]
   *   fractional density reduction ≈ 0.378 * e / p
   *   DA add ≈ fractional * scale
   *
   * Clamped so dew point cannot exceed OAT (treat as saturated).
   * Magnitude: typically hundreds of feet when hot + moist — matches PHAK scale.
   */
  function humidityDeltaDaFt(pressureAltFt, oatC, dewPointC) {
    let td = dewPointC;
    if (td > oatC) td = oatC;
    // Station pressure approx from PA (very rough educational model)
    // Standard atmosphere: p ≈ 29.92 * (1 - 6.87535e-6 * H)^5.2561 inHg
    const h = Math.max(0, pressureAltFt);
    const pInHg =
      STD_SL_PRESSURE_INHG *
      Math.pow(1 - 6.87535e-6 * h, 5.2561);
    const pHpa = pInHg * 33.8639;
    const e = 6.112 * Math.exp((17.67 * td) / (td + 243.5)); // hPa
    // Virtual temperature / density effect: moist air less dense
    const frac = Math.min(0.05, Math.max(0, (0.378 * e) / pHpa));
    // Convert density fraction to approximate altitude feet
    // ~1% density change ≈ 300 ft near SL (order-of-magnitude)
    return frac * 30000;
  }

  /**
   * Dew-point rule of thumb (ERAU / AOPA): ~20 × Td(°C) feet when Td ≳ 5 °C.
   * Displayed for comparison, not as primary model.
   */
  function humidityRotFt(dewPointC) {
    if (dewPointC < 5) return Math.max(0, 10 * dewPointC);
    return 20 * dewPointC;
  }

  function densityAltitude(pressureAltFt, oatC, dewPointC, includeHumidity) {
    const dry = densityAltitudeDry(pressureAltFt, oatC);
    const hum = includeHumidity
      ? humidityDeltaDaFt(pressureAltFt, oatC, dewPointC)
      : 0;
    return { dry, humidityAdd: hum, total: dry + hum };
  }

  /** Ambient pressure (inHg) corresponding to a pressure altitude (by definition of PA). */
  function pressureInHgFromPa(pressureAltFt) {
    const h = Math.max(-1000, pressureAltFt);
    return (
      STD_SL_PRESSURE_INHG * Math.pow(1 - 6.87535e-6 * h, 5.2561)
    );
  }

  /** Saturation vapor pressure (hPa) — Magnus-Tetens approximation. */
  function vaporPressureHpa(tempC) {
    return 6.112 * Math.exp((17.67 * tempC) / (tempC + 243.5));
  }

  const R_DRY = 287.05; // J/(kg·K)
  const R_VAPOR = 461.5; // J/(kg·K)
  const EPSILON = R_DRY / R_VAPOR; // ≈ 0.622
  /** Standard sea-level dry air density (kg/m³) at 15 °C, 29.92 inHg. */
  const RHO0_SL_DRY =
    (STD_SL_PRESSURE_INHG * 3386.39) / (R_DRY * (STD_SL_TEMP_C + 273.15));

  /**
   * Ideal-gas density of moist air at field conditions.
   * Ambient pressure from pressure altitude (definition of PA).
   * Partial pressure of water vapor from dew point (capped at OAT).
   *
   *   ρ = (p − e)/(R_d T) + e/(R_v T)
   *
   * Returns ρ/ρ₀ vs standard sea-level dry ISA, plus vapor mole fraction e/p
   * (realistically only a few percent even when "very humid").
   */
  function airDensityState(elevationFt, altimeterInHg, oatC, dewPointC) {
    const pa = pressureAltitude(elevationFt, altimeterInHg);
    const pInHg = pressureInHgFromPa(pa);
    const pPa = pInHg * 3386.39;
    const pHpa = pInHg * 33.8639;
    const T = oatC + 273.15;
    let td = dewPointC;
    if (td > oatC) td = oatC;
    let eHpa = vaporPressureHpa(td);
    // Cannot exceed ambient pressure
    eHpa = Math.min(eHpa, pHpa * 0.98);
    const ePa = eHpa * 100;
    // Ideal gas mixture density
    const rho =
      (pPa - ePa) / (R_DRY * T) + ePa / (R_VAPOR * T);
    const ratio = rho / RHO0_SL_DRY;
    const vaporMoleFraction = eHpa / pHpa; // e/p — typically 0–~0.04 surface
    const esHpa = vaporPressureHpa(oatC);
    const rh = esHpa > 0 ? Math.min(1, eHpa / esHpa) : 0;
    return {
      pa,
      pInHg,
      pHpa,
      eHpa,
      rho,
      rho0: RHO0_SL_DRY,
      ratio,
      vaporMoleFraction,
      relativeHumidity: rh,
      tempK: T,
    };
  }

  /**
   * Relative mass in a fixed volume vs standard sea-level dry ISA (ρ/ρ₀).
   * Preferred truth for the molecule box; dots are only a schematic of this.
   */
  function relativeAirMass(elevationFt, altimeterInHg, oatC, dewPointC) {
    return airDensityState(elevationFt, altimeterInHg, oatC, dewPointC).ratio;
  }

  /**
   * Toy performance model for learning interactions — NOT AFM numbers.
   * Baseline: "standard light trainer" at SL standard day ≈ 1000 ft ground roll,
   * 700 fpm climb. Scales with DA, weight, wind, surface, slope, flaps.
   */
  function toyPerformance(opts) {
    const {
      densityAltFt = 0,
      weightRatio = 1, // 1.0 = reference mid weight
      headwindKt = 0, // negative = tailwind
      surface = "paved", // paved | grass | soft
      slope = "level", // level | uphill | downhill
      flaps = "takeoff", // up | takeoff
      humidityHigh = false,
      applyHumidityMargin = false,
    } = opts;

    // Density factor: +15% roll per 1000 ft DA (illustrative)
    const daFactor = 1 + (densityAltFt / 1000) * 0.15;
    // Weight: roll ~ W^2-ish educational: use W^1.8 approx on distance
    const weightTakeoff = Math.pow(weightRatio, 1.8);
    const weightClimb = Math.pow(weightRatio, 1.5);

    let surfaceMul = 1;
    if (surface === "grass") surfaceMul = 1.15;
    if (surface === "soft") surfaceMul = 1.35;

    let slopeMul = 1;
    if (slope === "uphill") slopeMul = 1.12;
    if (slope === "downhill") slopeMul = 0.92;

    let flapMul = flaps === "up" ? 1.08 : 1.0;

    // Wind: headwind helps; each 10% of takeoff speed ~ big effect — simplified:
    // ±9% distance per 10 kt head/tail (toy)
    const windMul = 1 - headwindKt * 0.009;
    const windMulClamped = Math.max(0.55, Math.min(1.55, windMul));

    let groundRoll =
      1000 * daFactor * weightTakeoff * surfaceMul * slopeMul * flapMul * windMulClamped;

    if (applyHumidityMargin && humidityHigh) {
      groundRoll *= 1.1; // FAASTeam-style +10% educational overlay
    }

    // Climb rate baseline 700 fpm, drops with DA and weight, slight headwind help on angle not rate
    let climbFpm =
      700 * (1 - (densityAltFt / 1000) * 0.08) / weightClimb;
    climbFpm = Math.max(50, climbFpm);

    // Climb angle proxy (degrees-ish for wedge visual): lower with DA, weight, tailwind
    let climbAngle =
      8 * (1 - (densityAltFt / 1000) * 0.07) / weightClimb + headwindKt * 0.04;
    climbAngle = Math.max(1.2, Math.min(12, climbAngle));

    // Landing roll toy (less emphasis)
    let landingRoll =
      900 * daFactor * Math.pow(weightRatio, 1.5) * surfaceMul * (1 + headwindKt * -0.008);
    landingRoll = Math.max(400, landingRoll);

    // System meters 0–100 (standard day mid weight = ~100 at SL)
    const densityScore = Math.max(25, 100 * Math.exp(-densityAltFt / 12000));
    const engine = densityScore;
    const prop = densityScore * 0.98;
    const lift = densityScore / Math.pow(weightRatio, 0.6);

    return {
      groundRollFt: Math.round(groundRoll),
      landingRollFt: Math.round(landingRoll),
      climbFpm: Math.round(climbFpm),
      climbAngleDeg: Math.round(climbAngle * 10) / 10,
      engine: Math.round(engine),
      prop: Math.round(prop),
      lift: Math.round(Math.min(100, lift)),
      humidityMarginApplied: !!(applyHumidityMargin && humidityHigh),
    };
  }

  /** Runway go/no-go toy vs available length and 50 ft obstacle budget. */
  function runwayVerdict(groundRollFt, availableFt, obstacleClearanceFt) {
    // Toy: need ground roll + 0.5 * climb-to-50 distance; use roll * 1.35 as over 50 ft proxy
    const needed = groundRollFt * 1.35 + (obstacleClearanceFt > 0 ? 200 : 0);
    const ratio = needed / availableFt;
    if (ratio < 0.75) return { level: "ok", label: "OK", ratio, needed: Math.round(needed) };
    if (ratio < 0.95) return { level: "marginal", label: "MARGINAL", ratio, needed: Math.round(needed) };
    return { level: "no", label: "NO-GO (toy)", ratio, needed: Math.round(needed) };
  }

  const PRESETS = {
    standard: {
      name: "Standard day (SL)",
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
    },
    hotSl: {
      name: "Hot sea level",
      elevation: 0,
      altimeter: 29.92,
      oatC: 35,
      dewPointC: 10,
      includeHumidity: false,
      weightRatio: 1,
      headwindKt: 0,
      surface: "paved",
      slope: "level",
      flaps: "takeoff",
    },
    hotHumid: {
      name: "Hot + humid (SL)",
      elevation: 0,
      altimeter: 29.92,
      oatC: 32,
      dewPointC: 26,
      includeHumidity: true,
      weightRatio: 1,
      headwindKt: 0,
      surface: "paved",
      slope: "level",
      flaps: "takeoff",
    },
    highHot: {
      name: "High + hot",
      elevation: 5500,
      altimeter: 30.05,
      oatC: 30,
      dewPointC: 5,
      includeHumidity: false,
      weightRatio: 1,
      headwindKt: 0,
      surface: "paved",
      slope: "level",
      flaps: "takeoff",
    },
    highHotHumid: {
      name: "High + hot + humid",
      elevation: 5500,
      altimeter: 29.85,
      oatC: 28,
      dewPointC: 18,
      includeHumidity: true,
      weightRatio: 1,
      headwindKt: 0,
      surface: "paved",
      slope: "level",
      flaps: "takeoff",
    },
    phakCh4: {
      name: "PHAK Ch.4 humidity example",
      // Station pressure 22.22 inHg ≈ 8000 ft PA when elev set so PA≈8000 with 29.92
      elevation: 8000,
      altimeter: 29.92,
      oatC: (80 - 32) * (5 / 9), // 80 °F
      dewPointC: (75 - 32) * (5 / 9), // 75 °F
      includeHumidity: true,
      weightRatio: 1,
      headwindKt: 0,
      surface: "paved",
      slope: "level",
      flaps: "takeoff",
    },
    heavyTailSoft: {
      name: "Heavy + tailwind + soft",
      elevation: 2000,
      altimeter: 29.8,
      oatC: 28,
      dewPointC: 20,
      includeHumidity: true,
      weightRatio: 1.12,
      headwindKt: -8,
      surface: "soft",
      slope: "uphill",
      flaps: "takeoff",
    },
  };

  const STORY_STEPS = [
    {
      id: "std",
      title: "Standard day",
      text: "At sea level, 15 °C, 29.92 inHg: pressure altitude equals density altitude. This is the reference the airplane’s instruments and many charts assume.",
      preset: "standard",
    },
    {
      id: "hot",
      title: "Add heat",
      text: "Hotter air expands — less mass in each volume. Density altitude rises by thousands of feet. Engine, prop, and wing all lose capability.",
      preset: "hotSl",
    },
    {
      id: "highhot",
      title: "Add elevation",
      text: "High + hot stacks two big density hits. Takeoff rolls grow and climb rates fall. This is the classic density-altitude trap.",
      preset: "highHot",
    },
    {
      id: "humid",
      title: "Add humidity",
      text: "Water vapor is lighter than dry air (H₂O ≈ 18 g/mol vs dry air ≈ 29). Moist air is less dense → higher DA. Effect is usually hundreds of feet — smaller than heat/elevation, but real. PHAK: humidity contributes; charts often omit it.",
      preset: "highHotHumid",
    },
    {
      id: "heavy",
      title: "Add weight",
      text: "At the same density altitude, more weight multiplies takeoff distance and hurts climb. Weight is often a bigger day-of lever than humidity alone.",
      apply: (s) => ({ ...PRESETS.highHotHumid, weightRatio: 1.12 }),
    },
    {
      id: "tail",
      title: "Add tailwind",
      text: "A tailwind lengthens the ground roll and flattens climb angle over the ground. Headwind is free performance; tailwind is expensive.",
      apply: (s) => ({
        ...PRESETS.highHotHumid,
        weightRatio: 1.12,
        headwindKt: -10,
      }),
    },
    {
      id: "soft",
      title: "Soft / rough surface",
      text: "Grass or soft fields add rolling resistance. PHAK treats surface and slope as first-class takeoff factors — independent of density altitude.",
      apply: () => ({ ...PRESETS.heavyTailSoft }),
    },
    {
      id: "margin",
      title: "Humid-day margin",
      text: "FAASTeam pamphlet FAA-P-8740-2: if humidity is high, consider adding ~10% to computed takeoff distance and expect reduced climb. Safety heuristic — not a substitute for the AFM.",
      apply: () => ({
        ...PRESETS.heavyTailSoft,
        applyHumidityMargin: true,
      }),
    },
  ];

  const QUIZ = [
    {
      q: "Density altitude is best described as:",
      choices: [
        "True altitude above MSL from the GPS",
        "Pressure altitude corrected for nonstandard temperature (humidity also affects density)",
        "Indicated altitude with the local altimeter setting",
        "Height above the airport when the altimeter reads zero",
      ],
      answer: 1,
      explain:
        "PHAK: DA is pressure altitude corrected for nonstandard temperature. Humidity also reduces density but is often secondary in cockpit calculations.",
    },
    {
      q: "Why does high humidity reduce air density?",
      choices: [
        "Water vapor molecules are heavier than nitrogen and oxygen",
        "Humidity increases atmospheric pressure",
        "Water vapor is lighter than dry air, so moist air has less mass per volume",
        "Humidity only affects instruments, not the air itself",
      ],
      answer: 2,
      explain:
        "H₂O ≈ 18 g/mol vs dry air ≈ 29 g/mol. Moist air is lighter → higher density altitude → worse performance.",
    },
    {
      q: "Which pair usually moves density altitude by the largest amount?",
      choices: [
        "Humidity alone on a cool day",
        "High elevation combined with high temperature",
        "Switching from paved to grass runway",
        "A 5-knot headwind",
      ],
      answer: 1,
      explain:
        "Hot + high commonly shifts DA by thousands of feet. Humidity is typically hundreds of feet. Runway and wind affect performance but are not DA itself.",
    },
    {
      q: "Most light-airplane takeoff charts account for humidity by:",
      choices: [
        "A dedicated humidity axis on every chart",
        "Usually omitting humidity; pilots use PA + temp (and may add margin when humid)",
        "Ignoring temperature entirely",
        "Using dew point instead of OAT",
      ],
      answer: 1,
      explain:
        "PHAK notes humidity contributes but is usually not essential for the standard DA calc. FAASTeam suggests extra takeoff margin when humidity is high.",
    },
    {
      q: "At the same density altitude, which change often hurts takeoff the most?",
      choices: [
        "A small increase in dew point only",
        "A substantial weight increase",
        "Switching flaps from up to the normal takeoff setting",
        "A light headwind",
      ],
      answer: 1,
      explain:
        "Weight strongly drives takeoff distance and climb. Compare weight vs humidity in Mission mode to feel the difference.",
    },
  ];

  global.PerfModel = {
    pressureAltitude,
    isaTempC,
    densityAltitudeDry,
    humidityDeltaDaFt,
    humidityRotFt,
    densityAltitude,
    relativeAirMass,
    airDensityState,
    pressureInHgFromPa,
    vaporPressureHpa,
    RHO0_SL_DRY,
    toyPerformance,
    runwayVerdict,
    PRESETS,
    STORY_STEPS,
    QUIZ,
    STD_SL_PRESSURE_INHG,
    STD_SL_TEMP_C,
  };
})(typeof window !== "undefined" ? window : globalThis);
