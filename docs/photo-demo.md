# Reproduce the real-photo example

The practice set contains three credited CC0 photos: a landscape poppy,
square wildflowers and portrait lavender. The [source records](../public/examples/carousel-photos/CREDITS.md)
include the photographers, original pages, downloaded dimensions and hashes.
These are display-size source derivatives, not camera originals or customer work.

## In the tool

1. [Download the practice ZIP](https://lydiatools.github.io/aspectory/examples/carousel-photo-sources.zip) and unzip it.
2. Open [Carousel Fit](https://lydiatools.github.io/aspectory/carousel.html?lang=en) and add the three JPGs.
3. Use **4:5**, **White**, **2%**. Check the order, then download the PNG ZIP.

The app resamples the complete input into each frame. It exports PNG, not
the smaller JPEG previews used in documentation.

## Repeat the browser check from source

Use Node 22 and the current repository source:

```sh
npm ci
npx playwright install chromium
npm run build
npm run verify:photos
```

On a Linux machine without browser system libraries, use
`npx playwright install --with-deps chromium` for the browser setup.
The command starts its own loopback preview of `dist`, uses a fresh isolated
Chromium context and closes both after the run. It uses the repository's
public CC0 inputs; it does not open a signed-in browser or private image folder.

Read `runs/photo-demo/photo-demo-results.json`. The check imports the three
files, captures English and Chinese controls, and downloads the real numbered
PNG ZIP through the UI. Each PNG is decoded and checked independently against
the full resized source: 1080×1350, opaque white border and mean RGB error at
most 1 across the complete foreground rectangle. It also checks input hashes,
ZIP names/order, photo retention across language switching, page errors and
HTTP requests during image processing. Analytics consent is declined.

The same run creates 520×650 JPEG previews of those PNGs and renders the
1200×630 promotional montage from `carousel-photo-card.html`. Neither is a
photorealistic AI rendering or a screenshot of a published social post.

The existing Pages workflow uploads `carousel-photo-evidence` with a seven-day
retention period. A manual run on a test branch verifies and uploads evidence;
only a successful run on `main` deploys Pages. Record the exact source SHA
and inspect the newly generated artifact before using its screenshots.
Automated geometry checks complement a visual review; they do not measure
platform acceptance, campaign reach or outside adoption.

This source verification command is newer than the fixed v0.2.0 download;
the standalone HTML still works without Node or Playwright.
