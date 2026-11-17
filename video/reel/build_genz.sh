#!/usr/bin/env bash
# Gen-Z Hindi voice, English text: mix voiceover onto the silent render (offsets in ms, see i18n.py genz).
set -e
cd "$(dirname "$0")"
V=assets/audio/vo_genz
ffmpeg -y -loglevel error -i out/video_silent_genz.mp4 \
  -i $V/l1.wav -i $V/l2.wav -i $V/l3.wav -i $V/l4.wav -i $V/l5.wav -i $V/l6.wav \
  -filter_complex "[1]adelay=0|0[a1];[2]adelay=2600|2600[a2];[3]adelay=5500|5500[a3];[4]adelay=7900|7900[a4];[5]adelay=12100|12100[a5];[6]adelay=15500|15500[a6];\
[a1][a2][a3][a4][a5][a6]amix=inputs=6:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=7,apad=whole_dur=19[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -ar 44100 -t 19 -movflags +faststart out/Kidzopedia-Hindi-GenZ-Reel.mp4
