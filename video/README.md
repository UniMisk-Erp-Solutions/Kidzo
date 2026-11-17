# Kidzopedia launch reel (19 s, 1080x1920, English)

Output: `video/reel/out/Kidzopedia-English-Coming-Soon-Reel.mp4` (H.264 30 fps + AAC, 19.000 s).

Nothing in `/src` was changed. Everything lives in `/video`. No browser is used to build the video.

## Layout
| Path | What |
| --- | --- |
| `reel/render.py` | Frame renderer (Pillow, all scenes, captions, timing) piped to ffmpeg |
| `reel/build.sh` | Mixes the six voiceover clips onto the silent render |
| `reel/assets/app/` | Real app screens (React app, 390 px phone viewport, 3x) + template cover crop |
| `reel/assets/story/p1-p6.jpg` | Crops of the app's own illustrations (`src/assets`) used as "photos" |
| `reel/assets/brand/kidzopedia-logo.png` | Copy of `src/assets/kidzopedia-logo.png` |
| `reel/assets/audio/vo/l1-l6.wav` | Local Kokoro voice (`af_heart`, speed 1.1) |
| `reel/assets/fonts/` | Fraunces, Inter, Caveat (the app's own Google fonts) |
| `harness/` | Vite config + in-memory demo backend that runs the real pages (used once to capture screens) |
| `reel/index.html`, `reel/CLAUDE.md` | Untouched HyperFrames scaffold (unused: HyperFrames renders through a hidden headless Chrome) |

## Rebuild
```bash
cd video/reel
../.venv/Scripts/python.exe render.py   # frames -> out/video_silent.mp4 (~2 min)
bash build.sh                            # + voiceover -> final MP4
```
Needs ffmpeg on PATH and a venv with `pillow numpy` (voice: `kokoro-onnx soundfile`). Quick look at one frame: `python render.py still 3.4 8.2`.

## Where the real UI comes from
The app screens are real React pages (`/home`, `/moments`, `/books/new`) rendered by `harness/` with fictional data for a child called "Mia" (`harness/mockSupabase.ts`). The harness swaps only the Supabase client module (Vite alias); components, CSS and layout are the app's own. To refresh screens after a UI change: run `npx vite --config video/harness/vite.config.ts` from the repo root, capture the pages with any tool you prefer into `reel/assets/app/`, then re-render. Never edit `/src` for the video.

Authentic screens used: Home (`home-0`), Moments (`moments-0`, `moments-700`), Moments year stamp and memory cards, Books template picker cover (`cover-crop`, "Little Dreamer"). Also captured but unused: Grow, My books, home scroll positions.

## Voiceover script and timing
| Line | Start | Text |
| --- | --- | --- |
| 1 | 0.00 | The little things go by so quickly. |
| 2 | 2.30 | Their first smile. Their first steps. |
| 3 | 4.50 | Every moment deserves to be remembered. |
| 4 | 6.80 | With Kidzopedia, save photos, dates, and memories in one beautiful timeline. |
| 5 | 11.75 | Then turn those memories into a keepsake book you'll treasure. |
| 6 | 15.20 | Kidzopedia. Their story, forever. Coming soon. |

Spoken length 16.5 s; the reel ends on the "COMING SOON" card at 19.0 s.

## Storyboard
1. 0-2.3 Hook: baby card, fast age progression (newborn, 7 months, 1y 10m), headline "THEY GROW UP SO FAST."
2. 2.3-4.5 "FIRST SMILE" / "FIRST STEPS" polaroids with dates.
3. 4.5-6.8 Cards form a dated timeline; real Moments screen rises in. "EVERY LITTLE MOMENT."
4. 6.8-11.6 Logo, then real Home and Moments screens in a phone. "YOUR CHILD'S JOURNEY. / ALL IN ONE PLACE."
5. 11.6-15.0 Photos fly into an open book, it closes into a cover (the real "Little Dreamer" template cover). "FROM MEMORIES / TO A KEEPSAKE."
6. 15.0-19.0 Book next to the real Home screen, then end card: KIDZOPEDIA, "THEIR STORY, FOREVER.", COMING SOON.

## QA report (measured)
- ffprobe: h264 1080x1920, 30 fps, 570 frames, 19.000 s; AAC 44.1 kHz, 19.0 s.
- blackdetect: no black frames. Audio mean -16.8 dB, peak -1.5 dB.
- Stills from every scene were inspected; captions sit inside the 168-1330 px Reels-safe band.
- Not done: the voice was not listened to by a person, only measured. No pixel-diff against the app (screens are the captures themselves).

## Honest limitations
- No music and no sound effects: licensed music needs a HeyGen sign-in or your own track. Add one with `ffmpeg -i video.mp4 -i music.mp3 ... amix` (keep it about -22 LUFS under the voice).
- No real baby/child photographs exist in the repo. "Photos" are the app's illustrations; the age progression is illustrated (baby, toddler, boy), not photographic. Swap `reel/assets/story/p1-p6.jpg` for licensed or consented photos and re-render.
- The Kokoro voice is an on-device synthetic voice, good for a draft. Replace `l1-l6.wav` with a studio or ElevenLabs take for the final.
- Phone screens move by cross-fade and push, not live scrolling (no browser recording).
- The web app's navigation is a top tab bar; the Flutter app (Downloads/kidzopedia) uses a bottom bar. The video shows the React web UI, as requested.
- The book scene is a concept animation. The cover is the real template picker cover; no ordering screen is shown, and the end card says only COMING SOON (no date, URL or store badge).

## Update log
- Opening line changed to "The little things go by so quickly."; captions sit at y=1385.
- Book scene now shows an open hardcover whose pages are the two photo pages supplied by the owner (`reel/assets/app/book-page-left.png`, `book-page-right.png`). The right page is mounted whole on cream paper instead of cropped. These are personal photos: confirm you have the right to use them in a public ad.
- Motion: sub-pixel affine placement (no pixel jitter), smootherstep easing, longer transitions, 0.4 s cross-dissolves between scenes, gentle floating on cards. Voiceover timing is unchanged, so total length stays 19.0 s.

## Hindi version
`reel/out/Kidzopedia-Hindi-Coming-Soon-Reel.mp4` (19.0 s, same visuals and timing logic).
- Copy and timing live in `reel/i18n.py` (`REEL_LANG=hi`); render with `REEL_LANG=hi ../.venv/Scripts/python.exe render.py` then `bash build_hi.sh`.
- Devanagari is shaped with HarfBuzz and drawn with FreeType (`reel/hbtext.py`), because Pillow here has no shaping engine. Fonts: Noto Serif/Sans Devanagari (static weights cut by `make_static_fonts.py`) and Kalam for the polaroid handwriting.
- Voice: Kokoro `hf_beta` (Hindi), speed 1.18, lines in `assets/audio/vo_hi/`.
- Script: 1 छोटी-छोटी बातें, कितनी जल्दी बीत जाती हैं। 2 उनकी पहली मुस्कान। उनके पहले कदम। 3 हर पल सहेजने लायक़ है। 4 किडज़ोपीडिया में तस्वीरें, तारीख़ें और यादें, एक खूबसूरत टाइमलाइन में। 5 फिर इन यादों को बनाइए एक यादगार किताब। 6 किडज़ोपीडिया। उनकी कहानी, हमेशा के लिए। जल्द आ रहा है।
- The app screens stay in English (they are the real UI); the KIDZOPEDIA wordmark stays Latin.
- Have a native Hindi speaker check wording and pronunciation before publishing; the voice is synthetic.

## Casual Hindi voice, English text
`reel/out/Kidzopedia-Hindi-VO-English-Text-Reel.mp4`: all on-screen text and subtitles in English, everyday spoken Hindi (Hinglish) voice. Render with `REEL_LANG=hien`, mix with `bash build_hien.sh`. Voice lines are in `assets/audio/vo_hinglish/`:
1 छोटे-छोटे पल, कितनी जल्दी निकल जाते हैं। 2 उसकी पहली स्माइल, पहले स्टेप्स। 3 हर मोमेंट याद रखने लायक होता है। 4 किड्ज़ोपीडिया में फ़ोटोज़, डेट्स और मेमोरीज़ एक टाइमलाइन में सेव करो। 5 और फिर इन्हीं मेमोरीज़ की बना लो एक कीपसेक बुक। 6 किड्ज़ोपीडिया। उनकी स्टोरी, हमेशा के लिए। कमिंग सून।
English words are written in Devanagari so the voice reads them naturally. Subtitles are English translations of what is said. The earlier pure-Hindi cut (`Kidzopedia-Hindi-Coming-Soon-Reel.mp4`) is kept for reference.

## Gen-Z Hindi version
`reel/out/Kidzopedia-Hindi-GenZ-Reel.mp4`: Hinglish voice in a Gen-Z register, English text and subtitles. Render with `REEL_LANG=genz`, mix with `bash build_genz.sh`; voice lines in `assets/audio/vo_genz/`:
1 ये टाइम ना, बहुत फ़ास्ट निकल जाता है, यार। 2 वो पहली स्माइल, वो पहले स्टेप्स। कोर मेमोरीज़। 3 हर एक मोमेंट सेव करने लायक है, सच में। 4 किड्ज़ोपीडिया पे फ़ोटोज़, डेट्स, मेमोरीज़, सब एक ही टाइमलाइन में। सिंपल। 5 फिर इन्हीं मेमोरीज़ की बना लो एक कीपसेक बुक। टोटल कीपर। 6 किड्ज़ोपीडिया। उनकी स्टोरी, फ़ॉरएवर। कमिंग सून।
Headlines: "THEY'RE GROWING UP WAY TOO FAST.", "FIRSTS HIT DIFFERENT", "ALL THE CORE MEMORIES.", "THEIR WHOLE STORY.", "ONE TIMELINE. NO CHAOS.", "FROM CAMERA ROLL TO KEEPSAKE BOOK."

## Script v2 (owner-written script)
`reel/out/Kidzopedia-Hindi-Script2-Reel.mp4`: built from the owner's Hinglish script (camera roll, lost in gallery, Meet Kidzopedia, one-click keepsake book, coming soon). Render `REEL_LANG=script2`, mix `bash build_script2.sh`; voice in `assets/audio/vo_script2/`. Subtitles show the script in romanised Hinglish; on-screen headlines are English: "CAMERA ROLL FULL OF BABY PHOTOS... / BUT WHERE ARE THEIR STORIES?", "LOST IN YOUR GALLERY...", "EVERY PHOTO. EVERY MILESTONE. / ITS OWN TIMELINE.", "IN ONE CLICK, YOUR KEEPSAKE BOOK.", "EVERY LITTLE MOMENT DESERVES TO STAY." + COMING SOON.
