// Private Pilot Knowledge practice set — aligned to MIT 16.687 + FAA PHAK / AFH topics.
// Not official FAA test questions. For study only.

window.QUIZ_QUESTIONS = [
  {
    id: "aero-1",
    topic: "Aerodynamics",
    session: 2,
    sources: ["MIT Lec 2", "PHAK Ch. 5"],
    question: "What are the four primary aerodynamic forces acting on an airplane in flight?",
    choices: [
      "Lift, weight, thrust, and drag",
      "Lift, gravity, power, and friction",
      "Pitch, roll, yaw, and thrust",
      "Pressure, temperature, density, and humidity"
    ],
    answer: 0,
    explain: "Steady flight balances lift vs weight and thrust vs drag. PHAK aerodynamics chapters and MIT Lec 2 cover this foundation."
  },
  {
    id: "aero-2",
    topic: "Aerodynamics",
    session: 2,
    sources: ["MIT Lec 2", "PHAK Ch. 5"],
    question: "Angle of attack is best defined as the angle between the:",
    choices: [
      "chord line of the wing and the relative wind",
      "longitudinal axis and the horizon",
      "wing tip and the wing root",
      "propeller plane and the relative wind"
    ],
    answer: 0,
    explain: "AoA is chord line vs relative wind — critical for stall awareness regardless of attitude relative to the horizon."
  },
  {
    id: "aero-3",
    topic: "Aerodynamics",
    session: 2,
    sources: ["MIT Lec 2", "AFH / PHAK"],
    question: "An airplane stalls when:",
    choices: [
      "the critical angle of attack is exceeded",
      "airspeed drops below a published number regardless of attitude",
      "the engine stops producing power",
      "altitude is too high for the wing"
    ],
    answer: 0,
    explain: "Stalls are AoA events. They can occur at any airspeed/attitude if critical AoA is exceeded."
  },
  {
    id: "sys-1",
    topic: "Aircraft Systems",
    session: 4,
    sources: ["MIT Lec 4", "PHAK Ch. 7"],
    question: "In a typical light-airplane electrical system, the battery’s primary role in flight after start is to:",
    choices: [
      "provide backup power if the alternator/generator fails",
      "power the magnetos continuously",
      "cool the engine oil",
      "drive the propeller directly"
    ],
    answer: 0,
    explain: "Magnetos are independent of the battery. The alternator supplies electrical loads; the battery is reserve/backup after start."
  },
  {
    id: "sys-2",
    topic: "Aircraft Systems",
    session: 4,
    sources: ["MIT Lec 4", "PHAK Ch. 7"],
    question: "Carburetor icing is most likely when the outside air is:",
    choices: [
      "moist and temperatures are roughly 20°F to 70°F with visible moisture or high humidity",
      "always below freezing only",
      "hot and dry desert conditions only",
      "above 100°F"
    ],
    answer: 0,
    explain: "Carb ice can form in surprisingly warm conditions when air is moist because of cooling in the venturi/throttle area."
  },
  {
    id: "airspace-1",
    topic: "Charts & Airspace",
    session: 5,
    sources: ["MIT Lec 5", "PHAK Ch. 15"],
    question: "Class B airspace generally requires which of the following for VFR entry?",
    choices: [
      "ATC clearance and two-way radio communication (plus applicable equipment/endorsements)",
      "Mode C only; no clearance needed",
      "No radio if remaining below 1,200 ft AGL",
      "Only a flight plan on file"
    ],
    answer: 0,
    explain: "Class B entry for VFR requires an ATC clearance (and usually a Mode C transponder/ADS-B Out as applicable)."
  },
  {
    id: "airspace-2",
    topic: "Charts & Airspace",
    session: 5,
    sources: ["MIT Lec 5", "PHAK Ch. 15"],
    question: "On a VFR sectional chart, blue airport symbols generally indicate:",
    choices: [
      "airports with a control tower",
      "private airports only",
      "seaplane bases only",
      "military airports only"
    ],
    answer: 0,
    explain: "Blue = towered; magenta = non-towered (general rule for sectional symbology)."
  },
  {
    id: "nav-1",
    topic: "Navigation",
    session: 7,
    sources: ["MIT Lec 7", "PHAK Ch. 16"],
    question: "Magnetic variation is the angular difference between:",
    choices: [
      "true north and magnetic north",
      "magnetic heading and compass heading",
      "course and heading only due to wind",
      "indicated and true airspeed"
    ],
    answer: 0,
    explain: "Variation: true vs magnetic north (isogonic lines). Deviation is compass error due to the aircraft."
  },
  {
    id: "nav-2",
    topic: "Navigation",
    session: 7,
    sources: ["MIT Lec 7", "PHAK Ch. 16"],
    question: "In the wind triangle, wind correction angle is applied so that:",
    choices: [
      "the airplane’s track over the ground matches the desired course",
      "true airspeed equals groundspeed",
      "magnetic heading equals true course without variation",
      "altitude remains constant"
    ],
    answer: 0,
    explain: "Heading is adjusted for wind so ground track follows the planned course."
  },
  {
    id: "wx-1",
    topic: "Meteorology",
    session: 9,
    sources: ["MIT Lec 9", "PHAK Ch. 12"],
    question: "Standard sea-level atmospheric pressure in aviation is commonly referenced as:",
    choices: [
      "29.92 inHg (1013.2 mb)",
      "30.00 inHg only",
      "25.00 inHg",
      "14.7 inHg"
    ],
    answer: 0,
    explain: "ISA sea-level pressure is 29.92 inHg / 1013.2 hPa. Altimeter settings use local station pressure reduced to sea level."
  },
  {
    id: "wx-2",
    topic: "Meteorology",
    session: 9,
    sources: ["MIT Lec 9", "PHAK Ch. 12"],
    question: "Unstable air is generally associated with:",
    choices: [
      "cumuliform clouds, showery precipitation, and good visibility between showers",
      "stratiform clouds, continuous precipitation, and poor visibility",
      "no vertical motion and smooth air only",
      "always clear skies"
    ],
    answer: 0,
    explain: "Unstable air → convective activity (cumulus/cumulonimbus, showers, turbulence). Stable air → layered clouds and more continuous precip."
  },
  {
    id: "wx-3",
    topic: "Weather Data",
    session: 13,
    sources: ["MIT Lec 13", "PHAK Ch. 13"],
    question: "A METAR is primarily:",
    choices: [
      "a routine aviation weather observation for a specific station and time",
      "a long-range 7-day climate outlook",
      "a pilot report of turbulence only",
      "an IFR clearance"
    ],
    answer: 0,
    explain: "METARs are surface observations. TAFs are forecasts for the airport terminal area."
  },
  {
    id: "comm-1",
    topic: "Communications",
    session: 10,
    sources: ["MIT Lec 10", "PHAK Ch. 14"],
    question: "At a non-towered airport in the U.S., the recommended radio frequency for traffic advisories in the pattern is typically the:",
    choices: [
      "Common Traffic Advisory Frequency (CTAF), often the UNICOM or MULTICOM frequency charted",
      "Clearance Delivery only",
      "Emergency 121.5 for all routine calls",
      "ATIS only"
    ],
    answer: 0,
    explain: "Non-towered operations use CTAF (charted). 121.5 is for emergencies/guard, not routine pattern work."
  },
  {
    id: "perf-1",
    topic: "Performance",
    session: 12,
    sources: ["MIT Lec 12", "PHAK Ch. 11"],
    question: "All else equal, high density altitude typically causes:",
    choices: [
      "longer takeoff roll and reduced climb performance",
      "shorter takeoff roll and steeper climb",
      "no change in performance",
      "increased engine power in normally aspirated engines"
    ],
    answer: 0,
    explain: "High DA (hot/high/humid) reduces air density → less lift, less thrust/power for normally aspirated engines, poorer climb."
  },
  {
    id: "perf-2",
    topic: "Performance",
    session: 12,
    sources: ["MIT Lec 12", "PHAK Ch. 11"],
    question: "Density altitude increases when:",
    choices: [
      "temperature and/or altitude increase (and humidity can contribute)",
      "temperature decreases and pressure increases only",
      "the altimeter is set to 29.92 always",
      "the aircraft is heavier"
    ],
    answer: 0,
    explain: "Density altitude is pressure altitude corrected for nonstandard temperature (humidity also affects density)."
  },
  {
    id: "wb-1",
    topic: "Weight & Balance",
    session: 18,
    sources: ["MIT Lec 18", "PHAK Ch. 10"],
    question: "If an airplane is loaded so the CG is aft of the aft limit, the airplane will generally be:",
    choices: [
      "less stable in pitch and potentially difficult or impossible to recover from a stall/spin",
      "more stable and easier to flare",
      "unaffected as long as gross weight is legal",
      "required only to reduce fuel burn"
    ],
    answer: 0,
    explain: "Aft CG reduces longitudinal stability and can make stall/spin recovery hazardous. Weight and CG both matter."
  },
  {
    id: "wb-2",
    topic: "Weight & Balance",
    session: 18,
    sources: ["MIT Lec 18", "PHAK Ch. 10"],
    question: "Moment is calculated as:",
    choices: [
      "weight × arm",
      "weight ÷ arm",
      "arm ÷ weight",
      "weight + arm"
    ],
    answer: 0,
    explain: "Basic W&B: moment = weight × arm; CG = total moment / total weight."
  },
  {
    id: "human-1",
    topic: "Human Factors",
    session: 14,
    sources: ["MIT Lec 14", "PHAK Ch. 17"],
    question: "Hypoxia is best described as:",
    choices: [
      "a state of oxygen deficiency in the body sufficient to impair function",
      "excess nitrogen in the joints only",
      "inner-ear infection from climbs",
      "carbon monoxide poisoning only from heaters"
    ],
    answer: 0,
    explain: "Hypoxia is oxygen deficiency. CO poisoning is a related but distinct toxic cause of similar symptoms."
  },
  {
    id: "human-2",
    topic: "Human Factors",
    session: 14,
    sources: ["MIT Lec 14", "PHAK Ch. 17"],
    question: "The IMSAFE checklist is used to evaluate:",
    choices: [
      "pilot fitness to fly (Illness, Medication, Stress, Alcohol, Fatigue, Emotion/Eating)",
      "aircraft airworthiness only",
      "weather minimums only",
      "radio phraseology"
    ],
    answer: 0,
    explain: "IMSAFE is a personal preflight self-assessment mnemonic taught widely in ground school."
  },
  {
    id: "regs-1",
    topic: "Regulations / Minimums",
    session: 21,
    sources: ["MIT Lec 21", "14 CFR / PHAK"],
    question: "Basic VFR weather minimums in Class E airspace below 10,000 ft MSL generally include flight visibility of at least:",
    choices: [
      "3 statute miles (with cloud clearance 500 below / 1,000 above / 2,000 horizontal)",
      "1 statute mile and clear of clouds only",
      "5 statute miles always",
      "0 — VFR is not allowed in Class E"
    ],
    answer: 0,
    explain: "Classic Class E (<10,000 MSL) VFR: 3 SM, 500/1000/2000 cloud clearances. Know exceptions (Class G, night, etc.)."
  },
  {
    id: "night-1",
    topic: "Night Flying",
    session: 20,
    sources: ["MIT Lec 20", "AFH Night Ops"],
    question: "For night flight, a common visual illusion is that an upsloping runway can make the pilot feel:",
    choices: [
      "too high on approach, leading to a low approach or landing short tendency if not recognized",
      "too low, always causing a go-around",
      "no different than day",
      "that airspeed is higher than actual always"
    ],
    answer: 0,
    explain: "Upsloping runway illusion: pilot may feel high and fly a lower approach. Night illusions are a major AFH/PHAK topic."
  },
  {
    id: "multi-1",
    topic: "Multi-Engine & Jets",
    session: 19,
    sources: ["MIT Lec 19"],
    question: "In a light twin after engine failure, the operating engine tends to produce:",
    choices: [
      "yaw and roll toward the dead engine (requiring proper rudder/bank technique)",
      "automatic equal thrust on both sides",
      "only a reduction in climb with no yaw",
      "immediate spin entry always"
    ],
    answer: 0,
    explain: "Asymmetric thrust yaws/rolls toward the failed engine; Vmc and blue-line procedures are multi-engine fundamentals."
  },
  {
    id: "uas-1",
    topic: "Small UAS",
    session: 17,
    sources: ["MIT Lec 17", "Part 107 concepts"],
    question: "Under typical Part 107 small UAS rules (general knowledge), remote pilots must generally keep the aircraft:",
    choices: [
      "within visual line of sight (unless a waiver/exception applies)",
      "above 10,000 ft MSL always",
      "only over people without restriction",
      "IFR-only in Class A"
    ],
    answer: 0,
    explain: "VLOS is a core Part 107 principle. Course Lec 17 covers small UAS operations at a survey level."
  },
  {
    id: "plan-1",
    topic: "Flight Planning",
    session: 15,
    sources: ["MIT Lec 15", "PHAK Ch. 16"],
    question: "True course is measured on a chart relative to:",
    choices: [
      "true north",
      "magnetic north only",
      "the aircraft nose",
      "magnetic compass deviation card"
    ],
    answer: 0,
    explain: "Plot true course on the chart (true north), then apply variation (and later deviation) to get compass headings."
  },
  {
    id: "own-1",
    topic: "Ownership & Maintenance",
    session: 11,
    sources: ["MIT Lec 11", "PHAK / FARs"],
    question: "An annual inspection for a typical U.S. civil aircraft under Part 91 must be completed every:",
    choices: [
      "12 calendar months",
      "100 hours only for all aircraft always",
      "24 calendar months only",
      "Whenever the oil is changed"
    ],
    answer: 0,
    explain: "Annual is every 12 calendar months. 100-hour is additional for aircraft carrying persons for hire / flight instruction for hire in certain cases."
  },
  {
    id: "fly-1",
    topic: "Learning to Fly",
    session: 3,
    sources: ["MIT Lec 3", "AFH"],
    question: "A private pilot certificate (airplane) authorizes the holder to act as PIC of aircraft for which rated, subject to limitations, and generally:",
    choices: [
      "prohibits carrying passengers or property for compensation or hire (with narrow exceptions)",
      "allows unrestricted commercial airline operations",
      "requires an ATP certificate first",
      "is valid only inside Class B airspace"
    ],
    answer: 0,
    explain: "Private privileges are non-commercial (with specific exceptions like limited expense sharing). Commercial ops need higher certificates."
  },
  {
    id: "ifr-1",
    topic: "IFR Intro",
    session: 14,
    sources: ["MIT Special IFR", "PHAK / IFH"],
    question: "IFR primarily allows flight:",
    choices: [
      "in instrument meteorological conditions using instruments and ATC clearances/procedures",
      "only at night",
      "without any weather minimums ever",
      "only in Class G airspace"
    ],
    answer: 0,
    explain: "IFR is a set of rules/procedures enabling flight by reference to instruments when visual references are inadequate."
  },
  {
    id: "env-1",
    topic: "Flight Environment",
    session: 6,
    sources: ["MIT Lec 6", "PHAK"],
    question: "Wake turbulence is most severe behind aircraft that are:",
    choices: [
      "heavy, clean, and slow",
      "light, dirty, and fast",
      "taxiing only",
      "gliders only"
    ],
    answer: 0,
    explain: "Max wake strength: heavy + clean + slow. Avoid flying through the flight path of large aircraft, especially on takeoff/landing."
  },
  {
    id: "heli-1",
    topic: "Helicopter Aerodynamics",
    session: 8,
    sources: ["MIT Lec 8"],
    question: "Retreating blade stall is a high-speed helicopter phenomenon related to:",
    choices: [
      "the retreating blade needing a higher angle of attack to match lift, approaching stall as airspeed rises",
      "only engine failure autorotation RPM",
      "tail rotor drive shaft resonance only",
      "ground effect exclusively"
    ],
    answer: 0,
    explain: "Dissymmetry of lift: retreating blade sees lower relative airflow and may stall at high forward speeds."
  },
  {
    id: "sea-1",
    topic: "Seaplanes",
    session: 16,
    sources: ["MIT Lec 16"],
    question: "A glassy water landing is challenging primarily because:",
    choices: [
      "the surface provides almost no depth/height visual reference, making flare judgment difficult",
      "water is always shallower than charted",
      "engines cannot produce power over water",
      "radios do not work over water"
    ],
    answer: 0,
    explain: "Glassy water removes visual cues for height; techniques emphasize instruments/power settings and patience."
  }
];
