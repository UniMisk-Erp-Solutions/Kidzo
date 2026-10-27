-- DEV ONLY — adds 50 dummy memories (each with a random placeholder photo) to EVERY category
-- (Milestone, Celebration, Everyday, Cozy, Adventure, Family) for one child = 300 memories.
--
-- Run it by hand in Supabase Studio -> SQL Editor. It is NOT a migration and never runs automatically.
-- 1) Set the child's name below. 2) Run. 3) To remove the dummy data later, run the DELETE at the bottom.
--
-- Photos come from picsum.photos (random stock photos, a different one per memory).

DO $$
DECLARE
  v_child_name text := 'Harmin';          -- <-- change to the child's name (matches names starting with this)
  v_per_category int := 50;

  v_child record;
  v_cats text[] := ARRAY['Milestone','Celebration','Everyday','Cozy','Adventure','Family'];
  v_cat text;
  v_titles text[];
  v_stories text[] := ARRAY[
    'One of those days we never want to forget.',
    'Everyone was laughing so much — pure joy.',
    'A tiny moment that meant the world to us.',
    'Caught on camera just in time!',
    'We will look back on this one and smile for years.',
    'So proud of this little one.',
    'Simple, sweet and perfectly us.'
  ];
  v_who text[] := ARRAY['Mom','Dad','Grandma','Grandpa','Aunt','Uncle','Cousin'];
  i int;
  v_when timestamptz;
BEGIN
  SELECT id, user_id, dob INTO v_child
  FROM public.child_profiles
  WHERE name ILIKE v_child_name || '%'
  ORDER BY created_at
  LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No child found whose name starts with "%". Edit v_child_name at the top.', v_child_name;
  END IF;

  -- Avoid sending 300 "new memory" notifications to family members while seeding.
  ALTER TABLE public.memories DISABLE TRIGGER trg_memory_notify;

  FOREACH v_cat IN ARRAY v_cats LOOP
    v_titles := CASE v_cat
      WHEN 'Milestone'   THEN ARRAY['First smile','First steps','First word','Rolled over!','First tooth','Crawling champion','Standing on their own','Waved bye-bye','Clapped for the first time','Sleeping through the night']
      WHEN 'Celebration' THEN ARRAY['Birthday cake smash','Diwali lights','Holi colours','Naming ceremony','Family wedding','New Year countdown','Raksha Bandhan','Garba night','Festival of lights','Surprise party']
      WHEN 'Everyday'    THEN ARRAY['Breakfast mess','Morning giggles','Bath-time splash','Playing with blocks','Storytime','Park afternoon','Helping in the kitchen','Drawing session','Nap time','Funny faces']
      WHEN 'Cozy'        THEN ARRAY['Cuddles on the sofa','Rainy day blanket fort','Warm milk before bed','Lullaby night','Sleepy morning','Reading with Grandma','Sunday slow morning','Snuggled up','Cosy winter evening','Tea-time with Mom']
      WHEN 'Adventure'   THEN ARRAY['Trip to the beach','Zoo day','Picnic by the lake','First train ride','Hill station weekend','Garden explorer','Splashing in puddles','Road trip','Visit to the farm','Sunset walk']
      ELSE                    ARRAY['Sunday lunch together','Grandparents visit','Cousins reunion','Family photo day','Evening walk together','Game night','Temple visit with family','Video call with Nana','Weekend get-together','All of us in one frame']
    END;

    FOR i IN 1..v_per_category LOOP
      -- random moment between the child's birthday and now
      v_when := v_child.dob::timestamptz + random() * (now() - v_child.dob::timestamptz);

      INSERT INTO public.memories
        (user_id, child_id, title, story, happened_at, category, who_was_there, tags, photo_url, photo_urls)
      VALUES (
        v_child.user_id,
        v_child.id,
        v_titles[1 + (i - 1) % array_length(v_titles, 1)] || CASE WHEN i > array_length(v_titles, 1) THEN ' #' || i ELSE '' END,
        v_stories[1 + floor(random() * array_length(v_stories, 1))::int],
        v_when,
        v_cat,
        ARRAY[v_who[1 + floor(random() * array_length(v_who, 1))::int], v_who[1 + floor(random() * array_length(v_who, 1))::int]],
        ARRAY['dummy-seed', lower(v_cat)],
        'https://picsum.photos/seed/kz-' || lower(v_cat) || '-' || i || '/900/900',
        ARRAY['https://picsum.photos/seed/kz-' || lower(v_cat) || '-' || i || '/900/900']
      );
    END LOOP;
  END LOOP;

  ALTER TABLE public.memories ENABLE TRIGGER trg_memory_notify;
  RAISE NOTICE 'Added % memories for child "%".', v_per_category * array_length(v_cats, 1), v_child_name;
END $$;

-- ---------------------------------------------------------------------------
-- To REMOVE all dummy memories later, run:
--   DELETE FROM public.memories WHERE 'dummy-seed' = ANY(tags);
-- ---------------------------------------------------------------------------
