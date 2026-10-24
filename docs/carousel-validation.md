# Check Carousel Fit with its public sample set

Local acceptance date: 2026-10-24. Chrome 156.0.8078.47 on macOS. The release is an early 0.x tool; these checks do not establish outside adoption or publishing-platform behavior.

1. Open `carousel.html` and choose **Try a sample set**. Keep 4:5, white, 2% border.
2. Download the PNG ZIP. It contains three numbered PNGs, each 1080×1350. Check that markers 1–4 appear inside every image, including the wide landscape source. The original samples have three different aspect ratios.
3. Move the first slide later and export again. The new first PNG must be byte-identical to the earlier second PNG; the filenames stay numbered in current order.
4. Switch to Chinese. The imported photos, their order and frame must stay unchanged. Select square, black and an 8% border; inspect the exported pixels, not only the preview.
5. Add a valid transparent PNG, a JPEG with orientation metadata and a WebP. Try a corrupt PNG, an unsupported file and a file above 15 MB. Existing valid inputs must remain.
6. Add 21 small photos to an empty batch. Only 20 are accepted. Export and count the 20 numbered files.
7. Double-click `carousel-offline.html`, try the sample set and export with the browser network disconnected. The image workflow needs no HTTP requests.
8. Check both original composer pages (`index.html`, `zh.html`) and the new navigation. `npm test` also checks both language entry-point contracts after a missing Chinese navigation entry was caught during development.

The desktop and 390 px mobile views were visually inspected. No physical iPhone/Android device or Safari acceptance is claimed. Photos are resampled and composited into the chosen frame; source files are not overwritten.
