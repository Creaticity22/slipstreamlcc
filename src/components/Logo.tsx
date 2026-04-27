import { cn } from "@/lib/utils";
import logoSrc from "@/assets/slipstream-logo.png";

interface LogoProps {
  /** Visual size in px for the height. */
  size?: number;
  /** Wraps the image in a soft glow halo (great on dark/gradient surfaces). */
  glow?: boolean;
  className?: string;
  /** Override the default alt text. */
  alt?: string;
}

/**
 * Slipstream brand lockup (bus + wordmark + tagline).
 * Use on hero surfaces: app header, splash, onboarding welcome, auth, share pages.
 */
const Logo = ({ size = 36, glow = false, className, alt = "Slipstream — Smart Travel Choices" }: LogoProps) => {
  return (
    <div
      className={cn("relative inline-flex items-center", className)}
      style={{ height: size }}
    >
      {glow && (
        <span
          aria-hidden
          className="absolute inset-0 -z-10 blur-2xl opacity-60 bg-gradient-to-r from-primary/40 via-slipstream-sky/30 to-slipstream-lime/30 rounded-full"
        />
      )}
      <img
        src={logoSrc}
        alt={alt}
        height={size}
        style={{ height: size, width: "auto" }}
        className="object-contain select-none"
        draggable={false}
      />
    </div>
  );
};

export default Logo;
