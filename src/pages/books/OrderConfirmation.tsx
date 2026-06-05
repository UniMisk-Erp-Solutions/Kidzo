import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Download, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TopBar } from "@/components/childbook/TopBar";
import { BottomNav } from "@/components/childbook/BottomNav";
import { useUserBook } from "@/hooks/useUserBooks";
import { useChildren } from "@/hooks/useChildren";
import { useBookTemplates, type BookTemplateColors } from "@/hooks/useBookTemplates";
import { useMemories } from "@/hooks/useMemories";
import { useAuth } from "@/contexts/AuthContext";
import { exportBookPdf } from "@/lib/exportBookPdf";
import {
  formatCurrency,
  formatOrderNumber,
  calculatePrice,
  type BookSize,
  type PaperQuality,
  type BindingType,
} from "@/lib/bookPricing";

const OrderConfirmation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: book, isLoading } = useUserBook(id);
  const { data: children } = useChildren();
  const { data: templates } = useBookTemplates();
  const { data: allMemories = [] } = useMemories(book?.child_id);
  const [downloading, setDownloading] = useState(false);

  const child = children?.find((c) => c.id === book?.child_id);
  const template = templates?.find((t) => t.id === book?.template_id);

  const colors: BookTemplateColors | null = useMemo(() => {
    if (!template) return null;
    const override = (book?.color_override ?? {}) as Partial<BookTemplateColors>;
    return { ...(template.color_scheme as BookTemplateColors), ...override };
  }, [template, book?.color_override]);

  const orderedMemories = useMemo(() => {
    const ids = (book?.memories_selected ?? []) as string[];
    const map: Record<string, typeof allMemories[number]> = {};
    allMemories.forEach((m) => (map[m.id] = m));
    return ids.map((mid) => map[mid]).filter(Boolean);
  }, [book?.memories_selected, allMemories]);

  const price = useMemo(() => {
    if (!book) return null;
    return calculatePrice({
      size: book.book_size as BookSize,
      paper: book.paper_quality as PaperQuality,
      binding: book.binding_type as BindingType,
      quantity: book.quantity,
    });
  }, [book]);

  const handleDownload = async () => {
    if (!book || !template || !colors || !child) return;
    setDownloading(true);
    try {
      await exportBookPdf({
        title: book.title,
        subtitle: book.subtitle,
        childName: child.name,
        template,
        colors,
        memories: orderedMemories,
        filename: `${child.name.replace(/\s+/g, "_")}_${template.slug}.pdf`,
      });
      toast.success("PDF downloaded");
    } catch {
      toast.error("Could not generate PDF");
    } finally {
      setDownloading(false);
    }
  };

  if (isLoading || !book || !price) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const orderNo = formatOrderNumber(book.id);
  const eta = "7–14 business days";

  return (
    <div className="min-h-screen bg-background pb-28 md:pb-12">
      <TopBar childName={child?.name ?? ""} />
      <main className="mx-auto max-w-2xl px-4 py-10 md:px-6 md:py-16">
        <div className="rounded-3xl border bg-gradient-celebrate p-6 text-center md:p-10">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-card text-accent shadow-soft">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h1 className="mt-4 text-[26px] font-bold md:text-[32px]">Order placed! 🎉</h1>
          <p className="mt-2 text-[14px] text-secondary-foreground/80">
            Your memory book is queued for printing. We'll email you when it ships.
          </p>
        </div>

        <section className="mt-6 rounded-2xl border bg-card p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-[15px] font-semibold">Order details</h2>
            <span className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold tracking-wider">
              {orderNo}
            </span>
          </div>
          <ul className="mt-3 space-y-2 text-[13px]">
            <li className="flex justify-between">
              <span className="text-muted-foreground">Book</span>
              <span className="font-medium">{book.title || "Untitled book"}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">Template</span>
              <span className="font-medium">{template?.name}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">Size</span>
              <span className="font-medium">{book.book_size}"</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">Paper</span>
              <span className="font-medium capitalize">{book.paper_quality}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">Binding</span>
              <span className="font-medium capitalize">{book.binding_type}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">Quantity</span>
              <span className="font-medium">× {book.quantity}</span>
            </li>
            <li className="my-2 border-t" />
            <li className="flex justify-between">
              <span className="text-muted-foreground">Estimated delivery</span>
              <span className="font-medium">{eta}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-muted-foreground">Confirmation sent to</span>
              <span className="font-medium">{user?.email ?? "your inbox"}</span>
            </li>
            <li className="flex justify-between text-[15px] font-bold">
              <span>Total</span>
              <span>{formatCurrency(price.total)}</span>
            </li>
          </ul>
        </section>

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <Button onClick={() => navigate("/books")}>View my books</Button>
          <Button variant="outline" onClick={handleDownload} disabled={downloading}>
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Download className="h-4 w-4" /> Download PDF</>}
          </Button>
          <Button variant="outline" onClick={() => navigate("/books/templates")} className="sm:col-span-2">
            <Sparkles className="h-4 w-4" /> Create another book
          </Button>
        </div>
      </main>
      <BottomNav />
    </div>
  );
};

export default OrderConfirmation;
