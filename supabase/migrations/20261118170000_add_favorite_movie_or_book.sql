-- Keep existing quotes for retention while allowing the replacement Home topic.
ALTER TABLE public.child_little_things
  DROP CONSTRAINT child_little_things_topic_check,
  ADD CONSTRAINT child_little_things_topic_check
    CHECK (topic IN ('song', 'snack', 'interest', 'quote', 'movie_book'));
