import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Sparkles, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { LearnArticle } from "@/lib/learnContent";

interface Props {
  article: LearnArticle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LearnArticleDialog = ({ article, open, onOpenChange }: Props) => {
  const [view, setView] = useState<"read" | "quiz" | "result">("read");
  const [answers, setAnswers] = useState<number[]>([]);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);

  const reset = () => {
    setView("read");
    setAnswers([]);
    setCurrent(0);
    setSelected(null);
    setRevealed(false);
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  if (!article) return null;

  const q = article.quiz[current];
  const score = answers.filter((a, i) => a === article.quiz[i].correctIndex).length;

  const submitAnswer = () => {
    if (selected === null) return;
    setRevealed(true);
  };

  const nextQuestion = () => {
    const updated = [...answers, selected as number];
    setAnswers(updated);
    setSelected(null);
    setRevealed(false);
    if (current + 1 >= article.quiz.length) {
      setView("result");
    } else {
      setCurrent(current + 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[85vh] p-0 overflow-hidden">
        <div className={cn("p-5 flex items-center gap-3", article.color)}>
          <div className="w-12 h-12 rounded-xl bg-card flex items-center justify-center text-2xl shrink-0">
            {article.emoji}
          </div>
          <DialogHeader className="text-left flex-1 min-w-0 space-y-0.5">
            <DialogTitle className="text-base font-display font-bold leading-tight">
              {article.title}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {article.time} read · {article.quiz.length}-question quiz
            </DialogDescription>
          </DialogHeader>
        </div>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-5">
            <AnimatePresence mode="wait">
              {view === "read" && (
                <motion.div
                  key="read"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-4"
                >
                  <p className="text-sm text-foreground leading-relaxed">{article.intro}</p>
                  {article.sections.map((s) => (
                    <div key={s.heading} className="space-y-1">
                      <h3 className="text-sm font-semibold text-foreground">{s.heading}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
                    </div>
                  ))}
                  <div className="rounded-xl bg-muted p-3 flex gap-2">
                    <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-xs text-foreground font-medium leading-relaxed">
                      {article.takeaway}
                    </p>
                  </div>
                  <Button className="w-full" onClick={() => setView("quiz")}>
                    Take the quiz
                  </Button>
                </motion.div>
              )}

              {view === "quiz" && (
                <motion.div
                  key={`q-${current}`}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold">
                      Question {current + 1} of {article.quiz.length}
                    </span>
                    <div className="flex gap-1">
                      {article.quiz.map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-6 h-1 rounded-full",
                            i <= current ? "bg-primary" : "bg-muted",
                          )}
                        />
                      ))}
                    </div>
                  </div>
                  <h3 className="text-base font-semibold text-foreground">{q.question}</h3>
                  <div className="space-y-2">
                    {q.options.map((opt, i) => {
                      const isSelected = selected === i;
                      const isCorrect = i === q.correctIndex;
                      const showState = revealed && (isSelected || isCorrect);
                      return (
                        <button
                          key={opt}
                          disabled={revealed}
                          onClick={() => setSelected(i)}
                          className={cn(
                            "w-full text-left p-3 rounded-xl border text-sm transition-colors flex items-center justify-between gap-2",
                            !revealed && isSelected && "border-primary bg-primary/5",
                            !revealed && !isSelected && "border-border hover:bg-muted",
                            showState && isCorrect && "border-slipstream-lime bg-slipstream-lime/15",
                            showState && !isCorrect && isSelected && "border-destructive bg-destructive/10",
                            revealed && !isSelected && !isCorrect && "opacity-60",
                          )}
                        >
                          <span>{opt}</span>
                          {showState && isCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-slipstream-lime shrink-0" />
                          )}
                          {showState && !isCorrect && isSelected && (
                            <XCircle className="w-4 h-4 text-destructive shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {revealed && (
                    <motion.div
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl bg-muted p-3"
                    >
                      <p className="text-xs text-foreground leading-relaxed">{q.explanation}</p>
                    </motion.div>
                  )}
                  {!revealed ? (
                    <Button className="w-full" disabled={selected === null} onClick={submitAnswer}>
                      Check answer
                    </Button>
                  ) : (
                    <Button className="w-full" onClick={nextQuestion}>
                      {current + 1 >= article.quiz.length ? "See result" : "Next question"}
                    </Button>
                  )}
                </motion.div>
              )}

              {view === "result" && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-4 text-center py-4"
                >
                  <div className="text-5xl">
                    {score === article.quiz.length ? "🎉" : score >= article.quiz.length / 2 ? "👏" : "💪"}
                  </div>
                  <div>
                    <h3 className="text-lg font-display font-bold text-foreground">
                      {score} / {article.quiz.length} correct
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {score === article.quiz.length
                        ? "Perfect — you nailed it."
                        : score >= article.quiz.length / 2
                        ? "Nice work. Give it another go to ace it."
                        : "Worth another read — you've got this."}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={reset}>
                      <RotateCcw className="w-4 h-4" />
                      Retry
                    </Button>
                    <Button className="flex-1" onClick={() => handleClose(false)}>
                      Done
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default LearnArticleDialog;
