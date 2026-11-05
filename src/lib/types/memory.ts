/** A memory (photo moment). Lives in lib so shared helpers can use it without importing React hooks. */
export type Memory = {
  id: string;
  user_id: string;
  child_id: string;
  title: string;
  story: string | null;
  happened_at: string;
  category: string;
  who_was_there: string[];
  tags: string[];
  photo_url: string | null;
  photo_urls: string[];
  reaction: string | null;
  created_at: string;
  // Present when this memory appears on a child's timeline via a SIBLING link
  // (i.e. it primarily belongs to another child). Undefined for direct memories.
  is_linked?: boolean;
  relation_label?: string | null;
  // The child this memory primarily belongs to (= child_id of the source memory).
  primary_child_id?: string;
};
