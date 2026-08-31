import * as React from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight, BrainCircuit } from "lucide-react";

export interface Offer {
  id: string | number;
  imageSrc: string;
  imageAlt: string;
  tag: string;
  tagColor?: string;
  title: string;
  description: string;
  brandLogoSrc: string;
  brandName: string;
  promoCode?: string;
  href: string;
}

interface OfferCardProps {
  offer: Offer;
}

const OfferCard = React.forwardRef<HTMLAnchorElement, OfferCardProps>(({ offer }, ref) => (
  <motion.a
    ref={ref}
    href={offer.href}
    className="relative flex-shrink-0 w-[300px] h-[380px] rounded-2xl overflow-hidden group snap-start border border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
    whileHover={{ y: -8, borderColor: "rgba(99,102,241,0.4)" }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
    style={{ perspective: "1000px" }}
  >
    {/* Background Image */}
    <div className="absolute inset-0 w-full h-1/2 overflow-hidden">
      <img
        src={offer.imageSrc}
        alt={offer.imageAlt}
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-subtle)] to-transparent" />
    </div>

    {/* Card Content */}
    <div className="absolute bottom-0 left-0 right-0 h-[55%] p-5 flex flex-col justify-between z-10 bg-gradient-to-t from-[var(--bg-subtle)] via-[var(--bg-subtle)] to-[var(--bg-subtle)]/90">
      <div className="space-y-2">
        {/* Tag */}
        <div className="flex items-center text-[11px] font-bold tracking-widest uppercase" style={{ color: offer.tagColor || "var(--accent)" }}>
          <BrainCircuit className="w-3.5 h-3.5 mr-1.5" />
          <span>{offer.tag}</span>
        </div>
        {/* Title & Description */}
        <h3 className="text-xl font-black text-[var(--text-main)] leading-tight tracking-tight">{offer.title}</h3>
        <p className="text-[13px] text-[var(--text-muted)] font-medium leading-relaxed line-clamp-2">{offer.description}</p>
      </div>
      
      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-[var(--border-subtle)]">
        <div className="flex items-center gap-3">
          {offer.brandLogoSrc ? (
            <img src={offer.brandLogoSrc} alt={`${offer.brandName} logo`} className="w-8 h-8 rounded-full bg-[var(--bg-base)] border border-white/10 p-0.5" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center font-bold text-indigo-400 text-[10px]">
              {offer.brandName.substring(0, 3).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-[13px] font-bold text-[var(--text-main)]">{offer.brandName}</p>
            {offer.promoCode && (
              <p className="text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-wider">{offer.promoCode}</p>
            )}
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-[var(--bg-overlay)] border border-white/10 flex items-center justify-center text-white/50 transform transition-all duration-300 group-hover:rotate-[-45deg] group-hover:bg-[var(--accent)] group-hover:text-white group-hover:border-transparent shadow-[0_0_15px_rgba(99,102,241,0)] group-hover:shadow-[0_0_15px_rgba(99,102,241,0.4)]">
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  </motion.a>
));
OfferCard.displayName = "OfferCard";

export interface OfferCarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  offers: Offer[];
}

const OfferCarousel = React.forwardRef<HTMLDivElement, OfferCarouselProps>(
  ({ offers, className = "", ...props }, ref) => {
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    const scroll = (direction: "left" | "right") => {
      if (scrollContainerRef.current) {
        const { current } = scrollContainerRef;
        const scrollAmount = current.clientWidth * 0.8;
        current.scrollBy({
          left: direction === "left" ? -scrollAmount : scrollAmount,
          behavior: "smooth",
        });
      }
    };

    return (
      <div ref={ref} className={`relative w-full group ${className}`} {...props}>
        {/* Left Scroll Button */}
        <button
          onClick={() => scroll("left")}
          className="absolute top-1/2 -translate-y-1/2 -left-4 z-20 w-10 h-10 rounded-full bg-[var(--bg-elevated)] backdrop-blur-md border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-main)] opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 disabled:opacity-0 shadow-xl"
          aria-label="Scroll Left"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          className="flex space-x-5 overflow-x-auto pb-4 scrollbar-none snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {offers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>
        
        {/* Right Scroll Button */}
        <button
          onClick={() => scroll("right")}
          className="absolute top-1/2 -translate-y-1/2 -right-4 z-20 w-10 h-10 rounded-full bg-[var(--bg-elevated)] backdrop-blur-md border border-[var(--border-subtle)] flex items-center justify-center text-[var(--text-main)] opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 disabled:opacity-0 shadow-xl"
          aria-label="Scroll Right"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  }
);
OfferCarousel.displayName = "OfferCarousel";

export { OfferCarousel, OfferCard };
