#!/usr/bin/env bash
# Script v2: mix the 5 voice lines onto the silent render. Offsets (ms) match T/CAPS for "script2" in i18n.py.
set -e
cd "$(dirname "$0")"
V=assets/audio/vo_script2
ffmpeg -y -loglevel error -i out/video_silent_script2.mp4 \
  -i $V/l1.wav -i $V/l2.wav -i $V/l3.wav -i $V/l4.wav -i $V/l5.wav \
  -filter_complex "[1]adelay=0|0[a1];[2]adelay=3620|3620[a2];[3]adelay=7200|7200[a3];[4]adelay=11760|11760[a4];[5]adelay=15230|15230[a5];\
[a1][a2][a3][a4][a5]amix=inputs=5:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=7,apad=whole_dur=19[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -ar 44100 -t 19 -movflags +faststart out/Kidzopedia-Hindi-Script2-Reel.mp4
