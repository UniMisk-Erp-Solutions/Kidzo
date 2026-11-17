// In-memory stand-in for src/integrations/supabase/client.ts, used ONLY by the video harness.
// All data is fictional ("Mia"). No network calls, no real user data.

const USER_ID = "demo-user";
const CHILD_ID = "child-mia";

const user = {
  id: USER_ID,
  email: "demo@kidzopedia.example",
  user_metadata: { feature_tour_seen: true },
  app_metadata: {},
  aud: "authenticated",
  created_at: "2024-06-01T00:00:00.000Z",
};
const session = { access_token: "demo", refresh_token: "demo", expires_in: 3600, token_type: "bearer", user };

const P = (n: number) => `/demo/p${n}.jpg`;
const mem = (id: string, title: string, story: string, happened_at: string, category: string, photo: number, tags: string[] = []) => ({
  id,
  user_id: USER_ID,
  child_id: CHILD_ID,
  title,
  story,
  happened_at,
  category,
  who_was_there: [],
  tags,
  photo_url: P(photo),
  photo_urls: [P(photo)],
  reaction: null,
  created_at: happened_at,
});

const memories = [
  mem("m1", "First smile", "A sleepy morning grin that melted the whole house.", "2024-08-02T08:00:00Z", "milestone", 1, ["first"]),
  mem("m2", "Rolling over", "She flipped over all by herself and looked so proud.", "2024-10-12T10:00:00Z", "milestone", 1),
  mem("m3", "First birthday", "Cake, balloons and a very sticky face.", "2025-06-14T12:00:00Z", "celebration", 2, ["birthday"]),
  mem("m4", "First steps", "Three wobbly steps from the sofa to Papa.", "2025-07-20T17:00:00Z", "milestone", 3, ["first"]),
  mem("m5", "First words", "\"Mama\" - clear as anything.", "2025-09-05T09:00:00Z", "milestone", 2),
  mem("m6", "Building blocks", "Towers everywhere, and each one got knocked down.", "2026-03-18T16:00:00Z", "everyday", 4),
  mem("m7", "Story time with Nani", "Her favourite book, read for the tenth time.", "2026-08-09T19:00:00Z", "family", 5, ["family"]),
  mem("m8", "Sunny afternoon", "Playing in the golden light by the window.", "2026-10-30T15:00:00Z", "everyday", 6),
];

const achievements = [
  { id: "a1", user_id: USER_ID, child_id: CHILD_ID, type: "sports", subject: "First swimming splash", achievement_date: "2026-05-10", grade: null, notes: "Brave in the pool.", photo_url: null, created_at: "2026-05-10T00:00:00Z", updated_at: "2026-05-10T00:00:00Z" },
  { id: "a2", user_id: USER_ID, child_id: CHILD_ID, type: "cultural", subject: "Nursery rhyme show", achievement_date: "2026-09-21", grade: null, notes: "Sang along on stage.", photo_url: null, created_at: "2026-09-21T00:00:00Z", updated_at: "2026-09-21T00:00:00Z" },
];

const colors = (primary: string, accent: string, gold: string, coral: string) => ({ primary, accent, gold, coral, mint: "#BFE3D0", ink: "#4A3B5C", paper: "#FFFDF8" });
const layouts = [
  { type: "hero", title: "Cover", photos: 1 },
  { type: "timeline", title: "The first year", photos: 4 },
  { type: "story", title: "Little stories", photos: 2 },
  { type: "grid", title: "Everyday moments", photos: 6 },
];
const tpl = (i: number, name: string, slug: string, category: string, c: ReturnType<typeof colors>) => ({
  id: `tpl-${i}`, name, slug, category, description: `${name} - a warm, story-led keepsake layout.`, cover_image_url: null,
  page_layouts: layouts, color_scheme: c, suggested_age_range: "0-5 years", pages_needed: 24, is_premium: false, sort_order: i, created_at: "2025-01-01T00:00:00Z",
});
const templates = [
  tpl(1, "Little Dreamer", "little-dreamer", "baby", colors("#FBF3FF", "#E3D4FF", "#F4C95D", "#FF8FA3")),
  tpl(2, "Sunny Days", "sunny-days", "everyday", colors("#FFF8E8", "#FFE29A", "#F4A261", "#FF8FA3")),
  tpl(3, "Soft Meadow", "soft-meadow", "baby", colors("#F1FAF3", "#CDEBD6", "#E9C46A", "#F4978E")),
  tpl(4, "Rainbow Bloom", "rainbow-bloom", "celebration", colors("#FFF3F0", "#FFD1C7", "#F4C95D", "#EF6F6C")),
];

const books = [
  {
    id: "book1", child_id: CHILD_ID, parent_id: USER_ID, template_id: "tpl-1", title: "Mia's First Years", subtitle: "A keepsake of every little moment",
    memories_selected: memories.map((m) => m.id), custom_pages: [], layout_order: [], color_override: {}, book_size: "8x8", paper_quality: "premium",
    binding_type: "hardcover", quantity: 1, price_total: 1499, status: "preview", preview_url: null, order_date: null, tracking_number: null,
    created_at: "2026-11-01T00:00:00Z", updated_at: "2026-11-10T00:00:00Z",
  },
  {
    id: "book2", child_id: CHILD_ID, parent_id: USER_ID, template_id: "tpl-2", title: "Sunny Days with Mia", subtitle: null,
    memories_selected: ["m6", "m7", "m8"], custom_pages: [], layout_order: [], color_override: {}, book_size: "8x8", paper_quality: "standard",
    binding_type: "softcover", quantity: 1, price_total: 999, status: "draft", preview_url: null, order_date: null, tracking_number: null,
    created_at: "2026-10-20T00:00:00Z", updated_at: "2026-10-22T00:00:00Z",
  },
];

const tables: Record<string, any[]> = {
  child_profiles: [{ id: CHILD_ID, user_id: USER_ID, name: "Mia", dob: "2024-06-14", pronouns: "she/her", avatar_url: null, created_at: "2024-06-14T00:00:00Z", updated_at: "2024-06-14T00:00:00Z" }],
  memories,
  memory_child_links: [],
  achievements,
  documents: [],
  child_shares: [],
  profiles: [{ id: USER_ID, display_name: "Demo Parent", is_suspended: false, created_at: "2024-06-01T00:00:00Z" }],
  user_roles: [],
  plans: [{ id: "plan-family", slug: "family", name: "Family", is_active: true }],
  user_subscriptions: [{ user_id: USER_ID, plan_id: "plan-family", status: "active", plans: { slug: "family", name: "Family" } }],
  plan_features: [
    { plan_id: "plan-family", key: "photo_book_orders", value_bool: true, value_int: null, value_text: null },
    { plan_id: "plan-family", key: "pdf_export", value_bool: true, value_int: null, value_text: null },
    { plan_id: "plan-family", key: "share_links", value_bool: true, value_int: null, value_text: null },
    { plan_id: "plan-family", key: "family_invites", value_bool: true, value_int: null, value_text: null },
  ],
  book_templates: templates,
  user_books: books,
  book_orders: [],
  app_settings: [],
  coupons: [],
  invoices: [],
};

type Filter = (row: any) => boolean;

class Query implements PromiseLike<any> {
  private filters: Filter[] = [];
  private orderBy: { col: string; asc: boolean } | null = null;
  private max: number | null = null;
  private mode: "many" | "single" | "maybe" = "many";
  private head = false;
  private countMode = false;
  constructor(private table: string) {}

  select(_cols?: string, opts?: { count?: string; head?: boolean }) {
    this.head = !!opts?.head;
    this.countMode = !!opts?.count;
    return this;
  }
  insert() { return this; }
  update() { return this; }
  upsert() { return this; }
  delete() { return this; }
  eq(col: string, v: any) { this.filters.push((r) => r[col] === v); return this; }
  neq(col: string, v: any) { this.filters.push((r) => r[col] !== v); return this; }
  in(col: string, vs: any[]) { this.filters.push((r) => vs.includes(r[col])); return this; }
  is(col: string, v: any) { this.filters.push((r) => (r[col] ?? null) === v); return this; }
  gt(col: string, v: any) { this.filters.push((r) => r[col] > v); return this; }
  gte(col: string, v: any) { this.filters.push((r) => r[col] >= v); return this; }
  lt(col: string, v: any) { this.filters.push((r) => r[col] < v); return this; }
  lte(col: string, v: any) { this.filters.push((r) => r[col] <= v); return this; }
  not() { return this; }
  or() { return this; }
  ilike() { return this; }
  contains() { return this; }
  match() { return this; }
  returns() { return this; }
  filter() { return this; }
  textSearch() { return this; }
  abortSignal() { return this; }
  order(col: string, o?: { ascending?: boolean }) { this.orderBy = { col, asc: o?.ascending !== false }; return this; }
  limit(n: number) { this.max = n; return this; }
  range(a: number, b: number) { this.max = b - a + 1; return this; }
  single() { this.mode = "single"; return this; }
  maybeSingle() { this.mode = "maybe"; return this; }

  private run() {
    let rows = (tables[this.table] ?? []).filter((r) => this.filters.every((f) => f(r)));
    if (this.orderBy) {
      const { col, asc } = this.orderBy;
      rows = [...rows].sort((a, b) => (a[col] > b[col] ? 1 : a[col] < b[col] ? -1 : 0) * (asc ? 1 : -1));
    }
    if (this.max !== null) rows = rows.slice(0, this.max);
    const count = this.countMode ? rows.length : null;
    if (this.head) return { data: null, error: null, count };
    if (this.mode === "single") return { data: rows[0] ?? null, error: rows[0] ? null : { message: "not found" }, count };
    if (this.mode === "maybe") return { data: rows[0] ?? null, error: null, count };
    return { data: rows, error: null, count };
  }
  then<R1 = any, R2 = never>(ok?: ((v: any) => R1 | PromiseLike<R1>) | null, err?: ((e: any) => R2 | PromiseLike<R2>) | null) {
    return Promise.resolve(this.run()).then(ok, err);
  }
}

const noopChannel: any = { on: () => noopChannel, subscribe: () => noopChannel, unsubscribe: () => {} };

export const supabase: any = {
  auth: {
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    getSession: async () => ({ data: { session }, error: null }),
    getUser: async () => ({ data: { user }, error: null }),
    updateUser: async () => ({ data: { user }, error: null }),
    signOut: async () => ({ error: null }),
  },
  from: (table: string) => new Query(table),
  rpc: async () => ({ data: null, error: null }),
  storage: {
    from: () => ({
      getPublicUrl: (p: string) => ({ data: { publicUrl: p } }),
      createSignedUrl: async (p: string) => ({ data: { signedUrl: p }, error: null }),
      upload: async () => ({ data: null, error: null }),
      remove: async () => ({ data: null, error: null }),
    }),
  },
  functions: { invoke: async () => ({ data: null, error: null }) },
  channel: () => noopChannel,
  removeChannel: () => {},
};
