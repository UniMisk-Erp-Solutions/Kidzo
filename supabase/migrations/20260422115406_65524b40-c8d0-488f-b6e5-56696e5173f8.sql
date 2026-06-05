-- ============== BOOK TEMPLATES ==============
CREATE TABLE public.book_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  cover_image_url TEXT,
  page_layouts JSONB NOT NULL DEFAULT '[]'::jsonb,
  color_scheme JSONB NOT NULL DEFAULT '{}'::jsonb,
  suggested_age_range TEXT,
  pages_needed INTEGER NOT NULL DEFAULT 24,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.book_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view templates"
ON public.book_templates FOR SELECT TO authenticated USING (true);

CREATE INDEX idx_book_templates_category ON public.book_templates(category);

-- ============== USER BOOKS ==============
CREATE TABLE public.user_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL,
  parent_id UUID NOT NULL,
  template_id UUID NOT NULL REFERENCES public.book_templates(id) ON DELETE RESTRICT,
  title TEXT NOT NULL DEFAULT '',
  subtitle TEXT,
  memories_selected JSONB NOT NULL DEFAULT '[]'::jsonb,
  custom_pages JSONB NOT NULL DEFAULT '[]'::jsonb,
  layout_order JSONB NOT NULL DEFAULT '[]'::jsonb,
  color_override JSONB NOT NULL DEFAULT '{}'::jsonb,
  book_size TEXT NOT NULL DEFAULT '8x10',
  paper_quality TEXT NOT NULL DEFAULT 'matte',
  binding_type TEXT NOT NULL DEFAULT 'soft',
  quantity INTEGER NOT NULL DEFAULT 1,
  price_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  preview_url TEXT,
  order_date TIMESTAMPTZ,
  tracking_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own books"
ON public.user_books FOR SELECT TO authenticated
USING (auth.uid() = parent_id);

CREATE POLICY "Users insert their own books"
ON public.user_books FOR INSERT TO authenticated
WITH CHECK (auth.uid() = parent_id AND public.has_child_edit_access(child_id, auth.uid()));

CREATE POLICY "Users update their own books"
ON public.user_books FOR UPDATE TO authenticated
USING (auth.uid() = parent_id);

CREATE POLICY "Users delete their own books"
ON public.user_books FOR DELETE TO authenticated
USING (auth.uid() = parent_id);

CREATE TRIGGER trg_user_books_updated_at
BEFORE UPDATE ON public.user_books
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_user_books_parent ON public.user_books(parent_id);
CREATE INDEX idx_user_books_child ON public.user_books(child_id);

-- ============== BOOK ORDERS ==============
CREATE TABLE public.book_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_book_id UUID NOT NULL REFERENCES public.user_books(id) ON DELETE CASCADE,
  printful_order_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
  cost_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
  tracking_url TEXT,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.book_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view orders for their own books"
ON public.book_orders FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.user_books ub
  WHERE ub.id = book_orders.user_book_id AND ub.parent_id = auth.uid()
));

CREATE POLICY "Users insert orders for their own books"
ON public.book_orders FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.user_books ub
  WHERE ub.id = book_orders.user_book_id AND ub.parent_id = auth.uid()
));

CREATE INDEX idx_book_orders_user_book ON public.book_orders(user_book_id);