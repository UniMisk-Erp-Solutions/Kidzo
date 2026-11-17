#!/usr/bin/env bash
# Casual Hindi voice, English text: mix voiceover onto the silent render (offsets in ms, see i18n.py hien).
set -e
cd "$(dirname "$0")"
V=assets/audio/vo_hinglish
ffmpeg -y -loglevel error -i out/video_silent_hien.mp4 \
  -i $V/l1.wav -i $V/l2.wav -i $V/l3.wav -i $V/l4.wav -i $V/l5.wav -i $V/l6.wav \
  -filter_complex "[1]adelay=0|0[a1];[2]adelay=2650|2650[a2];[3]adelay=4800|4800[a3];[4]adelay=7100|7100[a4];[5]adelay=11500|11500[a5];[6]adelay=14600|14600[a6];\
[a1][a2][a3][a4][a5][a6]amix=inputs=6:normalize=0,loudnorm=I=-16:TP=-1.5:LRA=7,apad=whole_dur=19[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -ar 44100 -t 19 -movflags +faststart out/Kidzopedia-Hindi-VO-English-Text-Reel.mp4
