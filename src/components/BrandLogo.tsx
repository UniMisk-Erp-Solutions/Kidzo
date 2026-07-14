import logo from "@/assets/kidzopedia-logo.png";
import { cn } from "@/lib/utils";

/**
 * The Kidzopedia mark. Single source of truth for the logo across the app —
 * header, auth screens, footer, onboarding. Swap the asset and every mark follows.
 */
export const BrandLogo = ({ className, imgClassName }: { className?: string; imgClassName?: string }) => (
  // No tile, no tint — the PNG is transparent and sits directly on the page.
  <img
    src={logo}
    alt="Kidzopedia"
    className={cn("shrink-0 object-contain", className, imgClassName)}
    loading="eager"
    decoding="async"
  />
);

export default BrandLogo;
