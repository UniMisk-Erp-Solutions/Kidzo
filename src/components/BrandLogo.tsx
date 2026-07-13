import logo from "@/assets/kidzopedia-logo.png";
import { cn } from "@/lib/utils";

/**
 * The Kidzopedia mark. Single source of truth for the logo across the app —
 * header, auth screens, footer, onboarding. Swap the asset and every mark follows.
 */
export const BrandLogo = ({
  className,
  imgClassName,
  boxed = true,
}: {
  /** Sizing for the outer box, e.g. "h-9 w-9". */
  className?: string;
  imgClassName?: string;
  /** Draw the soft rounded tile behind the mark (matches the old icon chip). */
  boxed?: boolean;
}) =>
  boxed ? (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/20",
        className,
      )}
    >
      <img
        src={logo}
        alt="Kidzopedia"
        className={cn("h-[82%] w-[82%] object-contain", imgClassName)}
        loading="eager"
        decoding="async"
      />
    </span>
  ) : (
    <img
      src={logo}
      alt="Kidzopedia"
      className={cn("shrink-0 object-contain", className, imgClassName)}
      loading="eager"
      decoding="async"
    />
  );

export default BrandLogo;
