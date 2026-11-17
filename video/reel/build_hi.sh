#!/usr/bin/env bash
# Hindi: mix the voiceover onto the silent Hindi render. Offsets (ms) match T/CAPS for "hi" in i18n.py.
set -e
cd "$(dirname "$0")"
V=assets/audio/vo_hi
ffmpeg -y -loglevel error -i out/video_silent_hi.mp4 \
  -i $V/l1.wav -i $V/l2.wav -i $V/l3.wav -i $V/l4.wav -i $V/l5.wav -i $V/l6.wav \
  -filter_complex "[1]adelay=0|0[a1];[2]adelay=2800|2800[a2];[3]adelay=5300|5300[a3];[4]adelay=7300|7300[a4];[5]adelay=11800|11800[a5];[6]adelay=14900|14900[a6];\
[a1][a2][a3][a4][a5][a6]amix=inputs=6:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=7,apad=whole_dur=19[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -ar 44100 -t 19 -movflags +faststart out/Kidzopedia-Hindi-Coming-Soon-Reel.mp4
