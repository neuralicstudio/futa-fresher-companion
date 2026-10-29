"""Build data/collected/osm-campus/buildings.csv from OpenStreetMap (Overpass API).

The data is (c) OpenStreetMap contributors, licensed under the ODbL 1.0
(https://www.openstreetmap.org/copyright). Credit is in docs/design/CREDITS.md.

Usage (from the repo root):
  python data/tools/osm_buildings.py --fetch DIR      read Overpass (3 gentle requests), save the
                                                      answers in DIR, then build the CSV
  python data/tools/osm_buildings.py --from DIR       build the CSV again from saved answers
Then: python db/import_collected.py --check

What it does, in plain words:
  1. Takes the OSM outline of the university (way 711995935) and every named OSM feature in a box
     around the campus.
  2. Keeps a feature if it is inside the outline, or within 200 m of it and has FUTA in its name.
  3. Skips what cannot be told apart or is not a campus place (GENERIC and COMMERCIAL below), and
     what no rule below can classify (these are listed on screen, so a person can add a rule).
  4. Merges features whose names are the same apart from case, spaces and punctuation (a building
     drawn twice, or as a point and an outline). The row says how many were merged.
  5. Writes one row per building: the name as written in OSM, a type, the position OSM gives,
     and where it came from. Nothing is added by hand and nothing is corrected: possible
     spelling slips are only mentioned in the description.
No phone numbers, e-mails, websites or opening hours are read, even where OSM has them.
Standard library only. Nothing is written to a database.
"""

import argparse
import csv
import json
import math
import pathlib
import re
import sys
import time
import unicodedata
import urllib.parse
import urllib.request
from datetime import date

ROOT = pathlib.Path(__file__).resolve().parents[2]
OUT = ROOT / "data" / "collected" / "osm-campus" / "buildings.csv"
COLUMNS = ["name", "type", "description", "lat", "lng", "source", "collected_by", "date_collected"]
COLLECTED_BY = "Claude Code (AI assistant), from the Overpass API"
OVERPASS = "https://overpass-api.de/api/interpreter"
USER_AGENT = "SabiFUTACampusData/0.1 (student project, one-off campus extract)"
UNIVERSITY_WAY = 711995935  # "Federal University of Technology Akure", amenity=university
BOX = "7.280,5.115,7.318,5.160"  # south, west, north, east: the campus and its edge
NEAR_METRES = 200

# ---------------------------------------------------------------- what to leave out

# Names that appear many times for different places, so a name cannot identify one of them.
GENERIC = re.compile(
    r"^(lecture room|lecture building|lecture house|shops?|staff quarters|security house|"
    r"security building|industrial building|unnamed bu+ilding|transformer|rest ?room|"
    r"public restroom|etf rest room|laboratory|new building|bus stop|senate bus stop|dump site|"
    r"generator house|electrical area|play ?ground|abandoned warehouse|hutches|loafing shed|"
    r"poultry|brooders? house|piggery|solar powered buldings|sems walk way|mtn mini shop|"
    r"2-in-1[ab]|block [a-e]( extension\.?)?|abiola block \d|security check point|security office|"
    r"foundry workshop|continental imagery|talent plus|shoe maker|parking|religious ground|"
    r"relaxation spot|opposite futa campus)$|toilet|car park",
    re.I,
)
# Businesses, vehicles, roads and cash machines: not campus places a fresher looks for here.
COMMERCIAL = re.compile(
    r"bread|bakery|car wash|filling station|garage|\batm\b|atm post|payment|tantalizer|"
    r"heritage bank parking|parking space|akindeko print shop|printing press|bookshop|"
    r"cooperative|secterait|secteriat|asuu|nasu|man o war|nin enr|shuttle bus|bus station|"
    r"road$|mini shop|shopping|studio$|akure tech hub|jibowu and abiola entrance",
    re.I,
)
# Words that mean the OSM name is not the name of a place ("Opposite ...", "... Road").
FUTA_NAME = re.compile(r"futa|federal university of techno|obakekere|\bcrc\b", re.I)


# ----------------------------------------------------------- what kind of place (first match wins)

# (type, test on the name, test on the OSM tags). A rule matches when the name OR the tags match.
RULES: list[tuple[str, re.Pattern[str] | None, dict[str, str]]] = [
    # What OSM says the place is settles it before the name is read ("Zion Gate" is a restaurant,
    # "LT 2 MOSQUE" is a mosque).
    ("food", None, {"amenity": "restaurant"}),
    ("food", None, {"amenity": "fast_food"}),
    ("worship", None, {"amenity": "place_of_worship"}),
    ("other", re.compile(r"porter'?s lodge", re.I), {"amenity": "bank"}),
    ("gate", re.compile(r"\bgate$|south ?gate", re.I), {}),
    (
        "lecture_hall",
        re.compile(r"lecture (theat|hall|room)|\blt \d|\blt$|3[- ]?in[- ]?1|2[- ]?in[- ]?1", re.I),
        {},
    ),
    ("library", re.compile(r"library", re.I), {"amenity": "library"}),
    ("health", re.compile(r"health ?cent|clinic|\bhospital\b", re.I), {"amenity": "hospital"}),
    (
        "worship",
        re.compile(r"mosque|church|chapel|parish|fellowship|\bdlcf\b|mfm", re.I),
        {"amenity": "place_of_worship", "office": "religion", "landuse": "religious"},
    ),
    (
        "hostel",
        re.compile(r"hostel|jibowu annex|abiola hall|akindeko hall|jadesola|adeniyi", re.I),
        {"tourism": "hostel", "building": "dormitory"},
    ),
    (
        "sports",
        re.compile(
            r"gym|indoor (games|sport)|sport|tennis|basketball|handball|pitch|football", re.I
        ),
        {"leisure": "pitch"},
    ),
    ("sports", None, {"leisure": "stadium"}),
    ("sports", None, {"leisure": "sports_centre"}),
    ("sports", None, {"leisure": "fitness_centre"}),
    (
        "food",
        re.compile(
            r"restaurant|eatery|kitchen|fruit spot|sweet savour|mega|toppers|catering", re.I
        ),
        {},
    ),
    ("department", re.compile(r"^department of |department$", re.I), {}),
    (
        "faculty",
        re.compile(
            r"^school of |^school$|^soc |^sems |^set phase|^saat anex|^sls extension|"
            r"postgraduates? \(phase",
            re.I,
        ),
        {},
    ),
    (
        "admin",
        re.compile(
            r"senate|student(s)? affairs|alunmi|alumni|physical plan|postgraduate school|"
            r"^cce office|registry|bursary",
            re.I,
        ),
        {},
    ),
]
# A name that no rule above matches is kept as 'other' only if one of these says it is a campus
# place.
OTHER_OK = re.compile(
    r"building|centre|center|lab|workshop|museum|hall|auditorium|guest house|radio|fire station|"
    r"school|farm|park|hub|crc|cbe|cesra|cret|entrepreneurship|international|academic|"
    r"daycare|day care|printing|bank|physics|animal|feed mill|wild ?life|idd studio|t\.i francis|"
    r"great hall|project|research|mini pitch|recreative|sitting ground|studio|clinic|"
    r"boarding house",
    re.I,
)

# Spelling slips seen in OSM names. Only mentioned in the description, never changed in the name.
SLIPS = {
    "technogy": "Technology",
    "alunmi": "Alumni",
    "secteriat": "Secretariat",
    "buiilding": "Building",
    "musuem": "Museum",
    "planing": "planning",
    "chatholic": "Catholic",
    "shool": "School",
    "postgraudate": "Postgraduate",
    "extention": "Extension",
    "buldings": "Buildings",
    "brea(": "Bread",
}


# ---------------------------------------------------------------- reading OSM


def overpass(query: str) -> dict:
    """One request. As the public server asks, wait and double the wait after a 502 or 504."""
    wait = 20
    for attempt in range(4):
        request = urllib.request.Request(
            OVERPASS,
            data=urllib.parse.urlencode({"data": query}).encode(),
            headers={"User-Agent": USER_AGENT},
        )
        try:
            with urllib.request.urlopen(request, timeout=120) as response:
                return json.load(response)
        except Exception as error:  # noqa: BLE001 - any failure: wait, then try again
            print(
                f"Overpass attempt {attempt + 1} failed ({error}); waiting {wait}s", file=sys.stderr
            )
            time.sleep(wait)
            wait *= 2
    raise SystemExit("Overpass did not answer. Try again later.")


def fetch(directory: pathlib.Path) -> None:
    directory.mkdir(parents=True, exist_ok=True)
    queries = {
        "polygon.json": f"[out:json][timeout:60];way({UNIVERSITY_WAY});out geom tags;",
        "named.json": f'[out:json][timeout:90];(nwr["name"]({BOX}););out center tags;',
    }
    for index, (filename, query) in enumerate(queries.items()):
        if index:
            time.sleep(10)  # be gentle: one request at a time, with a pause
        (directory / filename).write_text(json.dumps(overpass(query)), encoding="utf-8")
        print("saved", filename)


def load(directory: pathlib.Path) -> tuple[list[tuple[float, float]], list[dict], str]:
    polygon_data = json.loads((directory / "polygon.json").read_text(encoding="utf-8"))
    named_data = json.loads((directory / "named.json").read_text(encoding="utf-8"))
    polygon = [(p["lon"], p["lat"]) for p in polygon_data["elements"][0]["geometry"]]
    return polygon, named_data["elements"], named_data["osm3s"]["timestamp_osm_base"]


def inside(polygon: list[tuple[float, float]], x: float, y: float) -> bool:
    found = False
    for (x1, y1), (x2, y2) in zip(polygon, polygon[1:], strict=False):
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            found = not found
    return found


def metres_to_edge(polygon: list[tuple[float, float]], x: float, y: float) -> float:
    kx, ky = 111320 * math.cos(math.radians(y)), 110574
    best = math.inf
    for (x1, y1), (x2, y2) in zip(polygon, polygon[1:], strict=False):
        ax, ay, bx, by = (x1 - x) * kx, (y1 - y) * ky, (x2 - x) * kx, (y2 - y) * ky
        dx, dy = bx - ax, by - ay
        length = dx * dx + dy * dy
        t = 0 if length == 0 else max(0, min(1, -(ax * dx + ay * dy) / length))
        best = min(best, math.hypot(ax + t * dx, ay + t * dy))
    return best


# ---------------------------------------------------------------- choosing and shaping rows


def tidy(text: str) -> str:
    text = unicodedata.normalize("NFC", text)
    text = "".join(ch for ch in text if unicodedata.category(ch) != "Cf")
    return " ".join(text.split())


def same_name_key(name: str) -> str:
    """Names that differ only in case, spaces and punctuation are the same place drawn twice."""
    return re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFKC", name).casefold())


STOP = {"the", "of", "and"}


def tokens(name: str) -> set[str]:
    """Lower-case words, a trailing s dropped (Students and Student match), small words ignored."""
    words = re.findall(r"[a-z0-9]+", unicodedata.normalize("NFKC", name).casefold())
    return {w[:-1] if len(w) > 3 and w.endswith("s") else w for w in words if w not in STOP}


def metres_apart(a: dict, b: dict) -> float:
    kx = 111320 * math.cos(math.radians((a["lat"] + b["lat"]) / 2))
    return math.hypot((a["lon"] - b["lon"]) * kx, (a["lat"] - b["lat"]) * 110574)


# Words that may differ between two names of one place. Anything else ("Life", "Second", "Phase",
# a different acronym) can mean a different building, so those are never merged.
MERGE_METRES = 40
DECORATION = {"prof", "dr", "peter", "male", "female", "futa", "building"}
SAME_SPOT_METRES = 3  # at one spot, "New" or "Old" in front of a name is also only decoration


def same_place(a: dict, b: dict) -> bool:
    """One name has every word of the other, the extra words are only decoration, and they sit
    within MERGE_METRES of each other (or at one spot, for New/Old)."""
    if a["kind"] != b["kind"]:
        return False
    one, two = tokens(a["name"]), tokens(b["name"])
    small, big = (one, two) if len(one) <= len(two) else (two, one)
    if not small or not small <= big:
        return False
    extra = big - small
    metres = metres_apart(a, b)
    return (extra <= DECORATION and metres <= MERGE_METRES) or (
        extra <= DECORATION | {"new", "old"} and metres <= SAME_SPOT_METRES
    )


def merge_near_duplicates(groups: list[list[dict]]) -> list[list[dict]]:
    """Join groups that hold the same place under different names."""
    merged: list[list[dict]] = []
    for group in groups:
        for target in merged:
            if any(same_place(a, b) for a in group for b in target):
                target.extend(group)
                break
        else:
            merged.append(list(group))
    return merged


def kind_of(name: str, tags: dict[str, str]) -> str | None:
    for kind, name_test, tag_test in RULES:
        if (name_test and name_test.search(name)) or any(
            tags.get(k) == v for k, v in tag_test.items()
        ):
            return kind
    return "other" if OTHER_OK.search(name) else None


def tag_summary(tags: dict[str, str]) -> str:
    keys = (
        "building",
        "amenity",
        "leisure",
        "tourism",
        "office",
        "landuse",
        "capacity",
        "operator",
    )
    return "; ".join(f"{k}={tags[k]}" for k in keys if k in tags)


def build(directory: pathlib.Path, today: str) -> None:
    polygon, elements, osm_time = load(directory)
    kept: dict[str, list[dict]] = {}
    skipped: dict[str, list[str]] = {
        "generic or commercial": [],
        "no rule": [],
        "far from campus": [],
    }

    for element in elements:
        tags = element.get("tags", {})
        name = tidy(tags.get("name", ""))
        if not name or tags.get("highway") or tags.get("shop") or "�" in name:
            continue
        centre = element.get("center") or {"lat": element.get("lat"), "lon": element.get("lon")}
        x, y = centre["lon"], centre["lat"]
        on_campus = inside(polygon, x, y)
        if not on_campus and not (
            FUTA_NAME.search(name) and metres_to_edge(polygon, x, y) <= NEAR_METRES
        ):
            skipped["far from campus"].append(name)
            continue
        if GENERIC.search(name) or COMMERCIAL.search(name):
            skipped["generic or commercial"].append(name)
            continue
        kind = kind_of(name, tags)
        if kind is None:
            skipped["no rule"].append(f"{name} [{tag_summary(tags) or 'no tags'}]")
            continue
        kept.setdefault(same_name_key(name), []).append(
            {"element": element, "tags": tags, "name": name, "kind": kind, "lat": y, "lon": x}
        )

    rows = []
    for group in merge_near_duplicates(list(kept.values())):
        # Prefer an outline (way or relation) to a point, then the lowest id: a stable choice.
        group.sort(key=lambda g: (g["element"]["type"] == "node", g["element"]["id"]))
        head = group[0]
        kind = next((g["kind"] for g in group if g["kind"] != "other"), head["kind"])
        element, tags = head["element"], head["tags"]
        notes = [
            f"From OpenStreetMap ({tag_summary(tags) or 'no tags'}). Name and position as mapped "
            "by OSM contributors; not checked by FUTA."
        ]
        if len(group) > 1:
            others = ", ".join(
                f"{g['element']['type']} {g['element']['id']}"
                + (
                    f" '{g['name']}'"
                    if same_name_key(g["name"]) != same_name_key(head["name"])
                    else ""
                )
                for g in group[1:]
            )
            notes.append(
                f"Merged {len(group)} OSM features that look like one place (also {others}). "
                "Position is the first one's."
            )
        slips = [f"'{wrong}'" for wrong in SLIPS if wrong in head["name"].casefold()]
        if slips:
            notes.append(
                f"Possible spelling slip in the OSM name: {', '.join(slips)}. Kept as written."
            )
        url = f"https://www.openstreetmap.org/{element['type']}/{element['id']}"
        rows.append(
            {
                "name": head["name"],
                "type": kind,
                "description": " ".join(notes),
                "lat": f"{head['lat']:.6f}",
                "lng": f"{head['lon']:.6f}",
                "source": f"OpenStreetMap {element['type']} {element['id']}, {url}, ODbL",
                "collected_by": COLLECTED_BY,
                "date_collected": today,
            }
        )

    rows.sort(key=lambda r: (r["type"], r["name"].casefold()))
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=COLUMNS, lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)

    print(f"OSM data as of {osm_time}. Wrote {len(rows)} rows to {OUT.relative_to(ROOT)}")
    by_type: dict[str, int] = {}
    for row in rows:
        by_type[row["type"]] = by_type.get(row["type"], 0) + 1
    print("by type:", dict(sorted(by_type.items())))
    for reason, names in skipped.items():
        print(f"\nSkipped, {reason}: {len(names)}")
        if reason == "no rule":
            for name in sorted(set(names)):
                print("   ", name)


def main() -> None:
    parser = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    source = parser.add_mutually_exclusive_group(required=True)
    source.add_argument("--fetch", metavar="DIR", type=pathlib.Path)
    source.add_argument("--from", dest="saved", metavar="DIR", type=pathlib.Path)
    parser.add_argument("--date", default=date.today().isoformat(), help="date read, YYYY-MM-DD")
    args = parser.parse_args()
    directory = args.fetch or args.saved
    if args.fetch:
        fetch(directory)
    build(directory, args.date)


if __name__ == "__main__":
    main()
