# SENTINEL – Maharashtra Police CCTV Investigation System

Sentinel is an educational working prototype for investigating missing vehicles and people from CCTV sightings. Investigators search plates or clothing descriptions, review candidate sightings, record decisions and inspect confirmed routes on a map. Automatic matches are leads for human review, never proof. The project was prepared as a Smart Dhule Ideathon 2026 prototype; its current sample data represents Pune City.

## Demo logins

| Role | Username | Password |
|---|---|---|
| Investigator | `investigator` | `investigator123` |
| Admin | `admin` | `admin123` |

## Run locally

1. Install Node.js and npm.
2. Run `npm install`.
3. Copy `.env.example` to `.env`; add your `GEMINI_API_KEY` to enable Gemini analysis and image generation.
4. Run `npm run dev`.
5. Open [http://localhost:3000](http://localhost:3000).

## Short demo script

1. Sign in as Investigator and search `MH 12 AB 1234`, then search `red jacket`.
2. Open a sighting. Confirm a match or reject it with a reason.
3. Open the case route map and review the computed legs.
4. Simulate a sighting and inspect watchlist alerts.
5. Review your audit entries. Sign in as Admin to see the full audit and Evidence Manager.

## How images work

The ZIP includes locally bundled, openly licensed illustrative photos, so sample sightings display images on first run without an internet connection. Every bundled photo is labelled as illustrative sample imagery, not a real camera capture or verified case evidence. Credits and license terms are listed in `public/assets/evidence/ASSET_SOURCES.md`. An Admin can replace a sample with a JPEG, PNG or WebP upload (up to 5 MB), or generate a new image when a Gemini key is configured. Simulated live sightings have no bundled image until one is added. Uploaded or generated evidence images are stored on the server, served only to authenticated sessions, and verified with a SHA-256 hash. Camera feeds and detections remain simulated.

## Prototype status

| Item | Status |
|---|---|
| Login, roles, sessions, lockout, audit log, SHA-256 integrity, search, review, map, route and speed maths | Real and working in this prototype |
| Gemini image analysis and image generation | Real; requires `GEMINI_API_KEY` |
| Camera feeds, plate recognition (ANPR) and person detection | Simulated; next phase uses OpenCV, YOLO and ANPR on real RTSP streams |
| Cameras, sightings and cases | Pune sample data; design scales to Maharashtra districts |

### Planned production stack

Python + FastAPI, OpenCV + YOLO, ANPR/OCR, PostgreSQL + PostGIS, React + Leaflet, RTSP over TCP (H.264/H.265), Docker.

