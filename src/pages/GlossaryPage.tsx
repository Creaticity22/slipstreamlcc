import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Search, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

interface Term {
  id: string;
  term: string;
  definition: string;
  category: string | null;
}

const GlossaryPage = () => {
  const navigate = useNavigate();
  const [terms, setTerms] = useState<Term[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    supabase
      .from("glossary_terms")
      .select("*")
      .order("term")
      .then(({ data }) => setTerms((data as Term[]) ?? []));
  }, []);

  const filtered = terms.filter(
    (t) =>
      !q ||
      t.term.toLowerCase().includes(q.toLowerCase()) ||
      t.definition.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" /> Glossary
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Travel terms in plain English.</p>
        </motion.div>

        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search terms…"
            className="pl-9"
          />
        </div>

        <div className="space-y-2">
          {filtered.map((t) => (
            <div key={t.id} className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-baseline justify-between gap-3 mb-1">
                <p className="font-semibold text-foreground">{t.term}</p>
                {t.category && (
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.category}</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{t.definition}</p>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-12">No terms match "{q}".</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlossaryPage;
