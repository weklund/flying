# Aircraft Performance Lab

Interactive learning tool for **density altitude** and the day-of factors that change **takeoff and climb** performance (PHAK Ch. 4 & 11 themes).

**Not for flight planning.** Use the AFM/POH for the airplane you fly.

## Open

```bash
# from repo root
python3 -m http.server 8080
# then open http://localhost:8080/learn/aircraft-performance/
```

Or open `index.html` directly in a browser (`file://` works).

## Modes

1. **Density** — elevation, altimeter, OAT, dew point; molecule box; altitude tape; dry vs humidity-aware DA; presets (including a PHAK Ch. 4 humidity scenario).
2. **Mission** — stack weight, wind, surface, slope, flaps on top of DA; toy runway / climb / engine-prop-wing meters; optional FAASTeam-style +10% humid takeoff margin.
3. **Guide** — stepped story + 5 self-check questions + formula notes.

## Model summary

| Quantity | Approach |
|----------|----------|
| Pressure altitude | `(29.92 − altimeter) × 1000 + elevation` |
| Dry density altitude | `PA + 120 × (OAT − ISA_temp_at_PA)` °C |
| Humidity (DA add) | Simplified vapor-pressure → density reduction → feet of DA (educational) |
| Air-in-a-box mass % | Ideal-gas moist density ρ = (p−e)/(R_d T) + e/(R_v T), ratio ρ/ρ₀ (SL dry 15 °C). Dots are schematic only; H₂O share = vapor mole fraction e/p (few %). |
| Mission distances | Toy scaling — **not** any type-specific POH |

## Sources

- FAA PHAK FAA-H-8083-25C Ch. 4 (humidity on density) & Ch. 11 (performance factors)
- FAA-P-8740-2 Density Altitude (hot/high/humid; +10% takeoff heuristic when humid)
- AC 00-6B framing: humidity often treated as negligible in the formal DA definition

## Files

- `index.html` — UI
- `styles.css` — theme aligned with `quiz/`
- `model.js` — atmosphere + toy performance
- `app.js` — interaction
