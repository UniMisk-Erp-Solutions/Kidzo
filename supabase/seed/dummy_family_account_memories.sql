-- DEV ONLY: gives admin@unimisk.com a child and 60 dummy memories with placeholder photos
-- (10 per category). Run dummy_family_account.sql FIRST. Run by hand in the Supabase SQL editor.
-- Photos are random stock images from picsum.photos (not real children). Idempotent for the child;
-- re-running adds another 60 memories. Remove them with the DELETE at the bottom.

DO $$
DECLARE
  v_email text := 'admin@unimisk.com';
  v_child_name text := 'Aarav';
  v_child_dob date := (current_date - interval '3 years 2 months')::date;
  v_per_category int := 10;

  v_user_id uuid;
  v_child_id uuid;
  v_dob date;
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
  v_batch text := to_char(clock_timestamp(), 'MIDDHH24MISS');
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User % not found — run dummy_family_account.sql first.', v_email;
  END IF;

  SELECT id, dob INTO v_child_id, v_dob FROM public.child_profiles WHERE user_id = v_user_id ORDER BY created_at LIMIT 1;
  IF v_child_id IS NULL THEN
    INSERT INTO public.child_profiles (user_id, name, dob)
    VALUES (v_user_id, v_child_name, v_child_dob)
    RETURNING id, dob INTO v_child_id, v_dob;
  END IF;

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
      INSERT INTO public.memories
        (user_id, child_id, title, story, happened_at, category, who_was_there, tags, photo_url, photo_urls)
      VALUES (
        v_user_id,
        v_child_id,
        v_titles[1 + (i - 1) % array_length(v_titles, 1)],
        v_stories[1 + floor(random() * array_length(v_stories, 1))::int],
        v_dob::timestamptz + random() * (now() - v_dob::timestamptz),
        v_cat,
        ARRAY[v_who[1 + floor(random() * array_length(v_who, 1))::int], v_who[1 + floor(random() * array_length(v_who, 1))::int]],
        ARRAY['dummy-seed-admin', lower(v_cat)],
        'https://picsum.photos/seed/kza-' || v_batch || lower(v_cat) || i || '/900/900',
        ARRAY['https://picsum.photos/seed/kza-' || v_batch || lower(v_cat) || i || '/900/900']
      );
    END LOOP;
  END LOOP;

  ALTER TABLE public.memories ENABLE TRIGGER trg_memory_notify;
  RAISE NOTICE 'Added % memories for child % (%).', v_per_category * array_length(v_cats, 1), v_child_id, v_email;
END $$;

-- To REMOVE them later:
--   DELETE FROM public.memories WHERE 'dummy-seed-admin' = ANY(tags);
