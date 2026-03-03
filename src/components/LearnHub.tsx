import { motion } from "framer-motion";
import { BookOpen, ChevronRight } from "lucide-react";

const articles = [
{ title: "Reading timetables like a pro", emoji: "📋", color: "bg-slipstream-teal/15", time: "2 min" },
{ title: "How to save with a 16-25 Railcard", emoji: "💳", color: "bg-slipstream-purple/15", time: "3 min" },
{ title: "Your first bus interchange", emoji: "🚌", color: "bg-slipstream-coral/15", time: "2 min" },
{ title: "Staying safe on evening journeys", emoji: "🔦", color: "bg-slipstream-gold/15", time: "3 min" },
{ title: "Why public transport helps the planet", emoji: "🌍", color: "bg-slipstream-lime/15", time: "2 min" },
{ title: "Bus etiquette: the unwritten rules", emoji: "🤝", color: "bg-slipstream-sky/15", time: "2 min" }];


const LearnHub = () => {
  return (
    <div className="space-y-4">
      <div className="bg-gradient-cool rounded-2xl p-5 text-primary-foreground">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-5 h-5" />
          <span className="text-sm font-medium opacity-80">Learn Hub</span>
        </div>
        <h2 className="text-xl font-display font-bold">Level up your travel game </h2>
        <p className="text-sm opacity-80 mt-1">Short, swipeable guides to help you travel smarter.</p>
      </div>

      <div className="space-y-2">
        {articles.map((article, i) =>
        <motion.button
          key={article.title}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.06 }}
          className="w-full bg-card rounded-xl p-3.5 flex items-center gap-3 border border-border text-left hover:shadow-card transition-shadow">
          
            <div className={`w-11 h-11 rounded-xl ${article.color} flex items-center justify-center text-xl shrink-0`}>
              {article.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{article.title}</p>
              <p className="text-[11px] text-muted-foreground">{article.time} read</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </motion.button>
        )}
      </div>
    </div>);

};

export default LearnHub;