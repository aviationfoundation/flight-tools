#!/usr/bin/env python3
import argparse
import csv
import gzip
import io
import json
import math
import os
import sys
import time
import urllib.request
from datetime import datetime, timezone

USER_AGENT = "flight-tools-pipeline/1.0 (+https://github.com/aviationfoundation/flight-tools)"
METARS_URL = "https://aviationweather.gov/data/cache/metars.cache.csv.gz"
STATIONS_URL = "https://aviationweather.gov/data/cache/stations.cache.json.gz"
AIRPORTS_URL = "https://davidmegginson.github.io/ourairports-data/airports.csv"
RUNWAYS_URL = "https://davidmegginson.github.io/ourairports-data/runways.csv"
DEFAULT_ENDPOINT = "https://tools.aviation.foundation/api/internal/data"

ORDER = ["VFR", "MVFR", "IFR", "LIFR"]
CEILING_COVERS = {"BKN", "OVC", "OVX", "VV"}
HERE = os.path.dirname(os.path.abspath(__file__))
BOARD_FILE = os.path.join(HERE, "..", "src", "data", "board-stations.json")
STATE_DIR = os.environ.get("FLIGHT_TOOLS_STATE", os.path.expanduser("~/.cache/flight-tools"))
NAMES_FILE = os.path.join(STATE_DIR, "station-names.json")
MAX_BATCH_BYTES = 4_000_000
MAX_BATCH_OBJECTS = 40


def fetch(url):
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=90) as response:
        data = response.read()
    if url.endswith(".gz"):
        data = gzip.decompress(data)
    return data.decode("utf-8")


def parse_number(text):
    try:
        return float(text)
    except (TypeError, ValueError):
        return None


def parse_visibility(text):
    text = (text or "").strip()
    if not text:
        return None, False
    plus = text.endswith("+")
    value = parse_number(text.rstrip("+"))
    return value, plus


def flight_category(vis, ceiling, has_clouds):
    if vis is None and ceiling is None and not has_clouds:
        return None
    by_vis = "VFR" if vis is None else "LIFR" if vis < 1 else "IFR" if vis < 3 else "MVFR" if vis <= 5 else "VFR"
    by_ceiling = "VFR" if ceiling is None else "LIFR" if ceiling < 500 else "IFR" if ceiling < 1000 else "MVFR" if ceiling <= 3000 else "VFR"
    return by_vis if ORDER.index(by_vis) > ORDER.index(by_ceiling) else by_ceiling


def format_miles(value):
    if value is None:
        return None
    if abs(value - round(value)) < 0.01:
        return str(int(round(value)))
    whole = int(value)
    fractions = [(0.125, "1/8"), (0.25, "1/4"), (0.375, "3/8"), (0.5, "1/2"), (0.625, "5/8"), (0.75, "3/4"), (0.875, "7/8")]
    frac = min(fractions, key=lambda f: abs(f[0] - (value - whole)))[1]
    return f"{whole} {frac}" if whole else frac


def build_categories():
    rows = list(csv.reader(io.StringIO(fetch(METARS_URL))))
    header = rows[0]
    col = {name: header.index(name) for name in header}
    cover_cols = [i for i, name in enumerate(header) if name == "sky_cover"]
    base_cols = [i for i, name in enumerate(header) if name == "cloud_base_ft_agl"]

    stations = []
    for row in rows[1:]:
        if len(row) < len(header):
            continue
        icao = row[col["station_id"]].strip()
        lat = parse_number(row[col["latitude"]])
        lon = parse_number(row[col["longitude"]])
        if not icao or lat is None or lon is None:
            continue
        vis, plus = parse_visibility(row[col["visibility_statute_mi"]])
        ceilings = []
        has_clouds = False
        for ci, bi in zip(cover_cols, base_cols):
            cover = row[ci].strip()
            if not cover:
                continue
            has_clouds = True
            base = parse_number(row[bi])
            if cover in CEILING_COVERS and base is not None:
                ceilings.append(int(base))
        vert = parse_number(row[col["vert_vis_ft"]])
        if vert is not None:
            ceilings.append(int(vert))
        ceiling = min(ceilings) if ceilings else None
        category = flight_category(vis, ceiling, has_clouds)
        if category is None:
            continue
        stations.append([icao, round(lat, 3), round(lon, 3), category, vis, 1 if plus else 0, ceiling, row[col["observation_time"]]])

    stations.sort(key=lambda s: s[0])
    return {
        "generated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "fields": ["icao", "lat", "lon", "category", "visibilitySm", "visibilityPlus", "ceilingFt", "observed"],
        "stations": stations,
    }


def station_place(entry):
    site = (entry.get("site") or "").strip()
    region = (entry.get("state") or "").strip() or (entry.get("country") or "").strip()
    return f"{site}, {region}" if region else site


def build_station_index():
    raw = json.loads(fetch(STATIONS_URL))
    index = []
    for entry in raw:
        icao = (entry.get("icaoId") or "").strip()
        if not icao or "METAR" not in (entry.get("siteType") or []):
            continue
        elev = entry.get("elev")
        index.append([
            icao,
            (entry.get("iataId") or "").strip() or None,
            (entry.get("site") or "").strip(),
            (entry.get("state") or "").strip() or None,
            (entry.get("country") or "").strip() or None,
            entry.get("lat"),
            entry.get("lon"),
            round(elev * 3.280839895) if isinstance(elev, (int, float)) else None,
        ])
    index.sort(key=lambda s: s[0])
    return index


def load_names():
    try:
        if time.time() - os.path.getmtime(NAMES_FILE) < 8 * 86400:
            with open(NAMES_FILE) as handle:
                return json.load(handle)
    except OSError:
        pass
    index = build_station_index()
    names = {s[0]: f"{s[2]}, {s[3] or s[4] or ''}".rstrip(", ") for s in index}
    save_names(names)
    return names


def save_names(names):
    os.makedirs(STATE_DIR, exist_ok=True)
    tmp = NAMES_FILE + ".tmp"
    with open(tmp, "w") as handle:
        json.dump(names, handle)
    os.replace(tmp, NAMES_FILE)


def build_board(categories, names):
    with open(BOARD_FILE) as handle:
        wanted = json.load(handle)
    by_icao = {s[0]: s for s in categories["stations"]}
    columns = {cat: [] for cat in ORDER}
    for icao in wanted:
        s = by_icao.get(icao)
        if not s:
            continue
        _, _, _, category, vis, plus, ceiling, _ = s
        parts = []
        if vis is not None:
            parts.append(f"{format_miles(vis)}{'+' if plus else ''} sm")
        parts.append(f"ceiling {ceiling:,} ft" if ceiling is not None else "no ceiling")
        place = names.get(icao, icao).replace(", US", "").replace(", CA", "")
        columns[category].append({"icao": icao, "place": place, "why": ", ".join(parts)})
    return {
        "generated": categories["generated"],
        "count": sum(len(v) for v in columns.values()),
        "columns": [{"category": cat, "items": columns[cat]} for cat in ORDER],
    }


def bearing(lat1, lon1, lat2, lon2):
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dl = math.radians(lon2 - lon1)
    x = math.sin(dl) * math.cos(p2)
    y = math.cos(p1) * math.sin(p2) - math.sin(p1) * math.cos(p2) * math.cos(dl)
    return (math.degrees(math.atan2(x, y)) + 360) % 360


def ident_heading(ident):
    digits = "".join(ch for ch in ident if ch.isdigit())[:2]
    return int(digits) * 10 % 360 if digits else None


def build_runways(station_icaos):
    airports = csv.DictReader(io.StringIO(fetch(AIRPORTS_URL)))
    airport_for = {}
    for a in airports:
        if a["type"] in ("closed", "heliport", "balloonport"):
            continue
        for code in (a["icao_code"], a["gps_code"], a["ident"]):
            code = (code or "").strip()
            if code in station_icaos and code not in airport_for:
                airport_for[code] = a["id"]
    icao_for_airport = {}
    for icao, airport_id in airport_for.items():
        icao_for_airport.setdefault(airport_id, icao)

    by_icao = {}
    for r in csv.DictReader(io.StringIO(fetch(RUNWAYS_URL))):
        icao = icao_for_airport.get(r["airport_ref"])
        if not icao or r["closed"] == "1":
            continue
        le, he = r["le_ident"].strip(), r["he_ident"].strip()
        if not le or le.startswith("H"):
            continue
        heading = parse_number(r["le_heading_degT"])
        approx = 0
        if heading is None:
            coords = [parse_number(r[k]) for k in ("le_latitude_deg", "le_longitude_deg", "he_latitude_deg", "he_longitude_deg")]
            if None not in coords:
                heading = bearing(*coords)
            else:
                heading = ident_heading(le)
                approx = 1
        if heading is None:
            continue
        length = parse_number(r["length_ft"])
        by_icao.setdefault(icao, []).append([le, he or None, round(heading, 1), int(length) if length else None, (r["surface"] or "").strip() or None, approx])

    shards = {}
    for icao, runways in by_icao.items():
        runways.sort(key=lambda rw: -(rw[3] or 0))
        shards.setdefault(icao[:2], {})[icao] = runways
    return shards


def objects_for_reference():
    index = build_station_index()
    save_names({s[0]: f"{s[2]}, {s[3] or s[4] or ''}".rstrip(", ") for s in index})
    shards = build_runways({s[0] for s in index})
    objects = [("stations.json", {"generated": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                                  "fields": ["icao", "iata", "name", "region", "country", "lat", "lon", "elevationFt"],
                                  "stations": index})]
    for prefix, data in sorted(shards.items()):
        objects.append((f"runways/{prefix}.json", data))
    return objects


def objects_for_categories():
    categories = build_categories()
    board = build_board(categories, load_names())
    return [("categories.json", categories), ("board.json", board)]


def push(objects, endpoint, token):
    batch, size, sent = [], 0, 0

    def flush():
        nonlocal batch, size, sent
        if not batch:
            return
        body = json.dumps({"objects": batch}).encode("utf-8")
        request = urllib.request.Request(endpoint, data=body, method="POST", headers={
            "User-Agent": USER_AGENT,
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
        })
        with urllib.request.urlopen(request, timeout=60) as response:
            if response.status not in (200, 204):
                raise RuntimeError(f"push failed with HTTP {response.status}")
        sent += len(batch)
        batch, size = [], 0

    for key, value in objects:
        text = json.dumps(value, separators=(",", ":"))
        if batch and (size + len(text) > MAX_BATCH_BYTES or len(batch) >= MAX_BATCH_OBJECTS):
            flush()
        batch.append({"key": key, "body": text})
        size += len(text)
    flush()
    return sent


def main():
    parser = argparse.ArgumentParser(description="Build and publish data files for tools.aviation.foundation.")
    parser.add_argument("job", choices=["categories", "reference"])
    parser.add_argument("--out", help="write the files to this directory")
    parser.add_argument("--push", action="store_true", help="upload the files to the site")
    args = parser.parse_args()

    started = time.time()
    objects = objects_for_categories() if args.job == "categories" else objects_for_reference()

    if args.out:
        for key, value in objects:
            path = os.path.join(args.out, key)
            os.makedirs(os.path.dirname(path), exist_ok=True)
            with open(path, "w") as handle:
                json.dump(value, handle, separators=(",", ":"))

    if args.push:
        token = os.environ.get("FLIGHT_TOOLS_PUSH_TOKEN")
        if not token:
            sys.exit("FLIGHT_TOOLS_PUSH_TOKEN is not set")
        sent = push(objects, os.environ.get("FLIGHT_TOOLS_ENDPOINT", DEFAULT_ENDPOINT), token)
        print(f"{args.job}: pushed {sent} files in {time.time() - started:.1f}s")
    else:
        print(f"{args.job}: built {len(objects)} files in {time.time() - started:.1f}s")


if __name__ == "__main__":
    main()
