import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, ChevronRight, HelpCircle } from "lucide-react";
import { learnArticles, type LearnArticle } from "@/lib/learnContent";
import LearnArticleDialog from "./LearnArticleDialog";

const LearnHub = () => {
  const [active, setActive] = useState<LearnArticle | null>(null);
  const [open, setOpen] = useState(false);

  const openArticle = (article: LearnArticle) => {
    setActive(article);
    setOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-cool rounded-2xl p-5 text-primary-foreground">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-5 h-5" />
          <span className="text-sm font-medium opacity-80">Learn Hub</span>
        </div>
        <h2 className="text-xl font-display font-bold">Level up your travel game </h2>
        <p className="text-sm opacity-80 mt-1">
          Short reads, each with a quick quiz to lock it in.
        </p>
      </div>

      <div className="space-y-2">
        {learnArticles.map((article, i) => (
          <motion.button
            key={article.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => openArticle(article)}
            className="w-full bg-card rounded-xl p-3.5 flex items-center gap-3 border border-border text-left hover:shadow-card transition-shadow"
          >
            <div
              className={`w-11 h-11 rounded-xl ${article.color} flex items-center justify-center text-xl shrink-0`}
            >
              {article.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{article.title}</p>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                {article.time} read
                <span className="opacity-50">·</span>
                <HelpCircle className="w-3 h-3" />
                {article.quiz.length}-Q quiz
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </motion.button>
        ))}
      </div>

      <LearnArticleDialog article={active} open={open} onOpenChange={setOpen} />
    </div>
  );
};

export default LearnHub;
