import { MessageCircle } from "lucide-react";
import { useQuote } from "./QuotePopup";

/** Fixed bottom-right WhatsApp button — opens the quote popup so the name is captured. */
export function FloatingWhatsApp() {
  const { open } = useQuote();
  return (
    <button
      onClick={() => open()}
      aria-label="Chat on WhatsApp"
      className="sdt-wa fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-2xl shadow-green-900/40 transition hover:scale-105 sm:bottom-6 sm:right-6"
    >
      <MessageCircle className="h-7 w-7" />
      <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 animate-pulse rounded-full border-2 border-[#060d1f] bg-red-500" />
    </button>
  );
}
