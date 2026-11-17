# Per-language copy and timing for the reel. Select with REEL_LANG=en|hi (default en).
# Timing "T" follows the voiceover; CAPS mirror the narration.

def _en_ticker(m):
    if m >= 12:
        return f"{m // 12}y {m % 12}m".upper()
    return "NEWBORN" if m < 1 else ("1 MONTH" if m == 1 else f"{m} MONTHS")


def _hi_ticker(m):
    if m >= 12:
        y, mm = m // 12, m % 12
        return f"{y} वर्ष" if mm == 0 else f"{y} वर्ष {mm} माह"
    return "नवजात" if m < 1 else ("1 महीना" if m == 1 else f"{m} महीने")


STR = {
    "en": dict(
        out="video_silent.mp4", ENDY=(560, 800, 960),
        T=dict(s1=(0.0, 2.3), s2=(2.3, 4.5), s3=(4.5, 6.8), s4=(6.8, 11.6), s5=(11.6, 15.0), s6=(15.0, 19.0)),
        CAPS=[
            (0.05, 2.0, "The little things go by so quickly."),
            (2.35, 4.4, "Their first smile. Their first steps."),
            (4.55, 6.6, "Every moment deserves to be remembered."),
            (6.85, 9.9, "With Kidzopedia, save photos, dates,"),
            (9.9, 11.6, "and memories in one beautiful timeline."),
            (11.7, 13.4, "Then turn those memories"),
            (13.4, 14.95, "into a keepsake book you'll treasure."),
            (15.25, 17.0, "Kidzopedia. Their story, forever."),
        ],
        HL=dict(grow=(["THEY GROW", "UP SO FAST."], 118), moment=(["EVERY LITTLE", "MOMENT."], 112),
                j1=(["YOUR CHILD'S", "JOURNEY."], 96), j2=(["ALL IN", "ONE PLACE."], 96),
                frm=(["FROM MEMORIES"], 84), to=(["TO A KEEPSAKE."], 84), end1=(["THEIR STORY,", "FOREVER."], 104)),
        KICK="EVERY FIRST", LAB_SMILE="FIRST SMILE", LAB_STEPS="FIRST STEPS", PILL="COMING SOON",
        CARDS=dict(first_smile=("First smile", "AUG 2, 2024"), first_steps=("First steps", "JUL 20, 2025"),
                   birthday=("First birthday", "JUN 14, 2025"), words=("First words", "SEP 5, 2025")),
        M3=["AUG 2024", "JUN 2025", "JUL 2025"], ticker=_en_ticker,
    ),
    "hi": dict(
        out="video_silent_hi.mp4", ENDY=(500, 725, 960),
        T=dict(s1=(0.0, 2.8), s2=(2.8, 5.3), s3=(5.3, 7.4), s4=(7.4, 12.0), s5=(12.0, 14.9), s6=(14.9, 19.0)),
        CAPS=[
            (0.05, 2.7, "छोटी-छोटी बातें, कितनी जल्दी बीत जाती हैं।"),
            (2.85, 5.1, "उनकी पहली मुस्कान। उनके पहले कदम।"),
            (5.35, 6.9, "हर पल सहेजने लायक़ है।"),
            (7.35, 9.5, "किडज़ोपीडिया में तस्वीरें, तारीख़ें और यादें,"),
            (9.5, 11.7, "एक खूबसूरत टाइमलाइन में।"),
            (11.85, 13.3, "फिर इन यादों को बनाइए"),
            (13.3, 14.7, "एक यादगार किताब।"),
            (14.95, 16.95, "किडज़ोपीडिया। उनकी कहानी, हमेशा के लिए।"),
            (16.95, 18.3, "जल्द आ रहा है।"),
        ],
        HL=dict(grow=(["बच्चे कितनी जल्दी", "बड़े हो जाते हैं।"], 92), moment=(["हर छोटा", "सा पल।"], 112),
                j1=(["आपके बच्चे", "का सफ़र।"], 100), j2=(["सब कुछ,", "एक जगह।"], 100),
                frm=(["यादों से"], 96), to=(["किताब तक।"], 96), end1=(["उनकी कहानी,", "हमेशा के लिए।"], 100)),
        KICK="हर पहली बार", LAB_SMILE="पहली मुस्कान", LAB_STEPS="पहले कदम", PILL="जल्द आ रहा है",
        CARDS=dict(first_smile=("पहली मुस्कान", "2 अगस्त 2024"), first_steps=("पहले कदम", "20 जुलाई 2025"),
                   birthday=("पहला जन्मदिन", "14 जून 2025"), words=("पहले शब्द", "5 सितंबर 2025")),
        M3=["अगस्त 2024", "जून 2025", "जुलाई 2025"], ticker=_hi_ticker,
    ),
}

# Casual Hindi (Hinglish) voiceover with ALL on-screen text and subtitles in English.
STR["hien"] = {
    **STR["en"],
    "out": "video_silent_hien.mp4",
    "T": dict(s1=(0.0, 2.65), s2=(2.65, 4.8), s3=(4.8, 7.1), s4=(7.1, 11.5), s5=(11.5, 14.6), s6=(14.6, 19.0)),
    "CAPS": [
        (0.05, 2.4, "The little things go by so quickly."),
        (2.7, 4.5, "Their first smile. Their first steps."),
        (4.85, 6.85, "Every moment deserves to be remembered."),
        (7.15, 9.2, "With Kidzopedia, save photos, dates"),
        (9.2, 11.1, "and memories in one timeline."),
        (11.55, 12.9, "Then turn those memories"),
        (12.9, 14.2, "into a keepsake book."),
        (14.65, 16.6, "Kidzopedia. Their story, forever."),
    ],
}

# Gen-Z register: Hinglish voice, English on-screen text and subtitles.
STR["genz"] = {
    **STR["en"],
    "out": "video_silent_genz.mp4",
    "T": dict(s1=(0.0, 2.6), s2=(2.6, 5.5), s3=(5.5, 7.9), s4=(7.9, 12.1), s5=(12.1, 15.1), s6=(15.1, 19.0)),
    "CAPS": [
        (0.05, 2.4, "Time really moves way too fast."),
        (2.65, 4.0, "That first smile, those first steps."),
        (4.0, 5.3, "Core memories."),
        (5.55, 7.7, "Every single moment is worth saving."),
        (7.95, 9.6, "On Kidzopedia: photos, dates, memories,"),
        (9.6, 11.9, "all in one timeline. Simple."),
        (12.15, 13.7, "Then turn them into a keepsake book."),
        (13.7, 15.0, "Total keeper."),
        (15.55, 18.0, "Kidzopedia. Their story, forever."),
    ],
    "HL": dict(grow=(["THEY'RE GROWING", "UP WAY TOO FAST."], 96), moment=(["ALL THE CORE", "MEMORIES."], 108),
               j1=(["THEIR WHOLE", "STORY."], 100), j2=(["ONE TIMELINE.", "NO CHAOS."], 96),
               frm=(["FROM CAMERA ROLL"], 76), to=(["TO KEEPSAKE BOOK."], 76), end1=(["THEIR STORY,", "FOREVER."], 104)),
    "KICK": "FIRSTS HIT DIFFERENT",
}

# Script v2 (owner-written Hinglish script): camera roll -> lost -> Kidzopedia timeline -> keepsake book -> coming soon.
STR["script2"] = {
    **STR["en"],
    "out": "video_silent_script2.mp4",
    "T": dict(s1=(0.0, 3.6), s2=(3.6, 7.2), s4=(7.2, 11.8), s5=(11.8, 15.2), s6=(15.2, 19.0)),
    "CAPS": [
        (0.05, 1.75, "Your camera roll is full of baby photos…"),
        (1.75, 3.5, "but unki stories kahaan hain?"),
        (3.65, 5.3, "First smile, first steps, cute moments…"),
        (5.3, 7.1, "sab gallery mein kho jaate hain!"),
        (7.25, 8.4, "Meet Kidzopedia!"),
        (8.4, 10.0, "Jahan har photo, milestone aur memory"),
        (10.0, 11.7, "ki banti hai apni timeline!"),
        (11.8, 13.4, "Aur ek click mein, turn those memories"),
        (13.4, 15.1, "into your very own keepsake book!"),
        (15.25, 17.0, "Because every moment deserves to stay."),
        (17.0, 18.5, "Kidzopedia, coming soon!"),
    ],
    "HL": dict(grow=(["CAMERA ROLL FULL", "OF BABY PHOTOS..."], 92), grow2=(["BUT WHERE ARE", "THEIR STORIES?"], 100),
               j1=(["EVERY PHOTO.", "EVERY MILESTONE."], 92), j2=(["ITS OWN", "TIMELINE."], 110),
               frm=(["IN ONE CLICK,"], 80), to=(["YOUR KEEPSAKE BOOK."], 76),
               end1=(["EVERY LITTLE MOMENT", "DESERVES TO STAY."], 66)),
    "KICK": "LOST IN YOUR GALLERY...", "ENDY": (520, 750, 960),
}
