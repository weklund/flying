# FAA handbook sources

Downloaded from official FAA websites (verified HTTP 200, valid `%PDF` headers).

| File | Document | URL | Approx size |
|------|----------|-----|-------------|
| `FAA-H-8083-25C_Pilots_Handbook_of_Aeronautical_Knowledge.pdf` | FAA-H-8083-25C | https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/faa-h-8083-25c.pdf | 74 MB |
| `FAA-H-8083-3C_Airplane_Flying_Handbook.pdf` | FAA-H-8083-3C | https://www.faa.gov/sites/faa.gov/files/regulations_policies/handbooks_manuals/aviation/airplane_handbook/00_afh_full.pdf | 261 MB |

Landing pages:

- https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/phak
- https://www.faa.gov/regulations_policies/handbooks_manuals/aviation/airplane_handbook

Re-fetch:

```bash
python3 scripts/download_faa_handbooks.py
```

These are U.S. government publications. Treat as public domain in the U.S.; always prefer the current edition on faa.gov if you need the latest regulatory alignment.
