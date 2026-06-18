import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

const VISITS_KEY = "slipstream_visit_count";
const DISMISSED_KEY = "slipstream_install_dismissed";
const THRESHOLD = 3;

export default function InstallPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return;
    const visits = Number(localStorage.getItem(VISITS_KEY) ?? "0") + 1;
    localStorage.setItem(VISITS_KEY, String(visits));
    if (visits >= THRESHOLD) {
      // Don't show in standalone (already installed)
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        // @ts-expect-error iOS Safari
        window.navigator.standalone === true;
      if (!standalone) setShow(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 max-w-lg mx-auto bg-card border border-border rounded-2xl shadow-card p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
        <Download className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">Install Slipstream</p>
        <p className="text-xs text-muted-foreground">
          Add to your home screen for quick access. Use your browser's "Add to Home Screen".
        </p>
      </div>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="p-2 text-muted-foreground"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
