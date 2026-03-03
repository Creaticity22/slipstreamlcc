import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User, Loader2, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

type Msg = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const quickQuestions = [
  "How do I get to Leeds City College?",
  "What's a 16-25 Railcard?",
  "Best off-peak times?",
  "Safety tips for night travel",
];

const AiChat = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Load chat history when user signs in
  useEffect(() => {
    if (!user || historyLoaded) return;
    const loadHistory = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("role, content")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(50);
      if (data && data.length > 0) {
        setMessages(data.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })));
      }
      setHistoryLoaded(true);
    };
    loadHistory();
  }, [user, historyLoaded]);

  // Reset when user signs out
  useEffect(() => {
    if (!user) {
      setHistoryLoaded(false);
    }
  }, [user]);

  const saveMessage = useCallback(
    async (role: "user" | "assistant", content: string) => {
      if (!user) return;
      await supabase.from("chat_messages").insert({
        user_id: user.id,
        role,
        content,
      });
    },
    [user]
  );

  const clearHistory = async () => {
    if (!user) {
      setMessages([]);
      return;
    }
    await supabase.from("chat_messages").delete().eq("user_id", user.id);
    setMessages([]);
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Msg = { role: "user", content: text.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setIsLoading(true);

    // Save user message
    await saveMessage("user", text.trim());

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || "Failed to connect");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsertAssistant(content);
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }

      // Save complete assistant message
      if (assistantSoFar) {
        await saveMessage("assistant", assistantSoFar);
      }
    } catch (e) {
      console.error("Chat error:", e);
      const fallback = "Sorry, I couldn't connect right now. Try again in a sec! 😊";
      upsertAssistant(fallback);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* FAB */}
      <AnimatePresence>
        {!open && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setOpen(true)}
            className="fixed bottom-20 right-4 z-50 w-14 h-14 rounded-2xl bg-gradient-primary text-primary-foreground flex items-center justify-center shadow-elevated"
          >
            <MessageCircle className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-20 right-3 left-3 z-50 max-w-lg mx-auto bg-card rounded-2xl shadow-elevated border border-border flex flex-col overflow-hidden"
            style={{ maxHeight: "70vh" }}
          >
            {/* Header */}
            <div className="bg-gradient-primary px-4 py-3 flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary-foreground" />
              <span className="text-sm font-display font-semibold text-primary-foreground flex-1">
                Slipstream Assistant
              </span>
              {messages.length > 0 && (
                <button onClick={clearHistory} className="mr-1">
                  <Trash2 className="w-4 h-4 text-primary-foreground/60 hover:text-primary-foreground/90" />
                </button>
              )}
              <button onClick={() => setOpen(false)}>
                <X className="w-5 h-5 text-primary-foreground/80" />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px]">
              {messages.length === 0 && (
                <div className="space-y-3 pt-2">
                  <p className="text-sm text-muted-foreground text-center">
                    Hey! I'm your travel buddy 🚌🚂<br />Ask me anything about getting around Yorkshire!
                  </p>
                  <div className="flex flex-wrap gap-1.5 justify-center">
                    {quickQuestions.map((q) => (
                      <button
                        key={q}
                        onClick={() => sendMessage(q)}
                        className="text-xs bg-muted text-foreground px-3 py-1.5 rounded-full font-medium hover:bg-primary/10 transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-7 h-7 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5 text-primary-foreground" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-gradient-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    }`}
                  >
                    {msg.content}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}

              {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 text-primary-foreground" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                    <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-border p-3 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                placeholder="Ask about routes, fares, tips…"
                className="flex-1 bg-muted rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => sendMessage(input)}
                disabled={isLoading || !input.trim()}
                className="w-10 h-10 rounded-xl bg-gradient-primary text-primary-foreground flex items-center justify-center disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AiChat;
