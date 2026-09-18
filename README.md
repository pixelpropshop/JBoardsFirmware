# JBoards firmware distribution

Public on purpose: boards and browsers fetch from here unauthenticated while the
firmware sources stay private. Nothing here is edited by hand — it is written by
`tools/release.py` in the firmware repo, and the manifest is the pointer that
makes a version live.

## Layout

```
esp32/
  manifest.json     "what is current" — one entry per board
  versions.json     version history + changelogs
  files/<tag>/      browser mirror of that release's assets (D-205)
pb2/
  manifest.json     same shape, PocketBeagle 2 firmware (no files/: see below)
  versions.json
receiver/           same shape, IntelliReceiver image (D-203), once published
  files/<tag>/      browser mirror, as for esp32/
```

One directory per **platform**, not per board: a single manifest carries every
board of that platform, keyed by board id. The two controller firmwares are
versioned in lockstep and share one release per version, tagged `v<version>`
(`v0.0.4` carries both the ESP32 and the PB2 asset); older history entries still
point at the earlier platform-prefixed tags (`esp32-v0.0.3`). The receiver is
versioned independently and uses `receiver-v<version>`. Nothing consults the
repo-global `/releases/latest`: the manifest is the only discovery.

**Binaries are GitHub Release assets first.** Each manifest entry's `url` is
the release asset: the canonical copy, the one devices download and people link
to.

**Since D-205 the same bytes are ALSO committed here, as a browser mirror.** A
web page served by a board cannot read a release asset — GitHub sends no
`Access-Control-Allow-Origin` header for it or for its
`release-assets.githubusercontent.com` redirect — while files in this repo come
from `raw.githubusercontent.com`, which sends `Access-Control-Allow-Origin: *`.
So each ESP32 and receiver entry may carry a `rawUrl`:

```
https://raw.githubusercontent.com/pixelpropshop/JBoardsFirmware/main/<platform>/files/<tag>/<asset-name>
```

where `<tag>` and `<asset-name>` are exactly the release tag and asset file name
in `url` — an immutable path per release. The browser updaters prefer `rawUrl`
and fall back to `url`; `sha256` and `size` describe both, and the validator
checks the committed file hashes like the entry.

**PB2 packages are not mirrored.** No browser downloads one: the PocketBeagle's
own updater fetches `url` device-side, where CORS does not apply, and the fleet
page drives that device-side update rather than downloading the package. A
`pb2/files/` would only grow this repo with no reader, so the validator refuses
`rawUrl` in `pb2/`.

The cost of the mirror is deliberate: every mirrored release adds its image
(about 9 MB per ESP32 board image, under 1 MB per receiver image) to this repo's
history for good. Publishers skip mirroring any file over 50 MB.
Files here are marked `binary` in `.gitattributes` and must never go through
Git LFS (raw.githubusercontent.com would serve the pointer, not the bytes).
Publishers need only a shallow clone (`git clone --depth 1`).

## Who reads what

| Consumer | Fetches |
|---|---|
| ESP32 web UI (`firmwareService.ts`) | `esp32/manifest.json`, `esp32/versions.json`, then the image via `rawUrl` |
| Fleet page, both boards (`fleetUpdateService.ts`) | `esp32/manifest.json`, then the image via `rawUrl` |
| Receiver panel, both boards (`receiverReleaseService.ts`) | `receiver/manifest.json`, `receiver/versions.json`, then the image via `rawUrl` |
| PB2 device updater (`UpdateManager.cpp`) | `pb2/manifest.json`, then the package via `url` (a device, not a browser: no CORS, so no mirror) |

Both look up their own entry by normalized board name: the board's reported
product name, upper-cased, spaces to hyphens — `Waveshare ESP32-P4 Nano` →
`WAVESHARE-ESP32-P4-NANO`. A manifest key that does not match what a board
reports publishes cleanly and then fails on the device, so that mapping is
checked as part of releasing.

## Publishing

From the firmware repo:

```bash
python tools/release.py --env p4-nano-test --changelog-file notes.md \
    --repo-dir ../JBoardsFirmware --dry-run          # inspect first, always
python tools/release.py --env p4-nano-test --changelog-file notes.md \
    --repo-dir ../JBoardsFirmware --commit --push
```

It builds, packages a combined firmware+filesystem image, re-parses the
package header to confirm the embedded version and board tag, uploads the
asset, and writes the manifest **last** — so a bad release is undone by
reverting one small commit, with no rebuild and no asset surgery.

Then confirm what the world actually sees:

```bash
python tools/validate_manifest.py --live esp32 --check-urls
```

With `--check-urls` the validator also downloads each `rawUrl` and checks its
size and sha256. Run against a local manifest before pushing, a `rawUrl` 404 is
reported as a note once the committed copy in the clone has been verified.

**`--check-urls` is not optional.** A manifest can be schema-valid, pass the
dry run, and still point at an asset that is not there — that is exactly how
v0.0.1 first shipped (the asset was published under its local filename while
the manifest named another). Nothing else in the pipeline detects it, and the
symptom on the device is a 404 mid-update. Also note the validator needs
`jsonschema` installed or it skips structural validation and still prints OK.

## Schema

Schema version 2. Normative definitions live in the firmware repo at
`docs/schemas/firmware-manifest.schema.json` and
`docs/schemas/firmware-versions.schema.json`; design and rationale in
`docs/architecture/FIRMWARE_DISTRIBUTION.md` (ruling D-26).

## History

Before 2026-07-28 this repo used a different layout: one top-level directory
per board (`JBOARD-16/`, `WAVESHARE-ESP32-P4-NANO/`) holding a flat schema-1
manifest plus committed `versions/<v>/firmware.bin` images. Those directories
were removed when the schema-2 layout was first published. Nothing was
stranded: no boards were in the field, and the S3 `JBOARD-*` family had already
been removed from the firmware entirely. Earlier tags still contain the old
tree if it is ever needed.
