import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Crown, Leaf, RefreshCw, Trophy } from "lucide-react";
import BrandHeader from "@/components/BrandHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface LeaderRow {
  user_id: string;
  display_name: string;
  total_co2_saved_kg: number;
  trip_count: number;
}

const LeaderboardPage = () => {
  const { user } = useAuth();
  const [rows, setRows] = useState<LeaderRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase as any).rpc("get_co2_leaderboard");
    if (!error && Array.isArray(data)) {
      const normalised = (data as any[]).map((r) => ({
        user_id: r.user_id,
        display_name: r.display_name,
        total_co2_saved_kg: Number(r.total_co2_saved_kg) || 0,
        trip_count: Number(r.trip_count) || 0,
      }));
      setRows(normalised);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3, 20);
  const myIndex = user ? rows.findIndex((r) => r.user_id === user.id) : -1;
  const me = myIndex >= 0 ? rows[myIndex] : null;
  const myOutsideTop20 = me && myIndex >= 20;

  const podiumStyle = (rank: number) => {
    if (rank === 0)
      return "bg-gradient-to-br from-yellow-400 to-amber-500 scale-105";
    if (rank === 1) return "bg-gradient-to-br from-slate-300 to-slate-400";
    return "bg-gradient-to-br from-amber-600 to-amber-700";
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="max-w-lg mx-auto px-4 pt-5">
        <BrandHeader
          title="CO₂ Leaderboard"
          subtitle="Who's saving the most this week?"
          action={
            <button
              onClick={load}
              aria-label="Refresh leaderboard"
              className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center shadow-card"
            >
              <RefreshCw className={`w-5 h-5 text-foreground ${loading ? "animate-spin" : ""}`} />
            </button>
          }
        />

        {loading && (
          <div className="space-y-3 mt-4">
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-32 rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        )}

        {!loading && rows.length === 0 && (
          <div className="bg-card border border-border rounded-2xl p-6 text-center mt-4">
            <Trophy className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">No travellers yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Be the first to log a trip and claim #1.
            </p>
          </div>
        )}

        {!loading && top3.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-4 items-end">
            {[1, 0, 2].map((order) => {
              const row = top3[order];
              if (!row) return <div key={order} />;
              const isMe = user && row.user_id === user.id;
              return (
                <motion.div
                  key={row.user_id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: order * 0.08 }}
                  className={`${podiumStyle(order)} text-white rounded-2xl shadow-lg p-4 text-center ${
                    isMe ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
                  }`}
                >
                  {order === 0 && <Crown className="w-5 h-5 mx-auto mb-1" />}
                  <div className="text-3xl font-display font-bold leading-none">
                    #{order + 1}
                  </div>
                  <div className="text-xs font-semibold mt-2 truncate">{row.display_name}</div>
                  <div className="flex items-center justify-center gap-1 mt-1 text-[11px] font-medium opacity-95">
                    <Leaf className="w-3 h-3" />
                    {row.total_co2_saved_kg.toFixed(1)} kg
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {!loading && rest.length > 0 && (
          <div className="space-y-2 mt-5">
            {rest.map((row, i) => {
              const rank = i + 4;
              const isMe = user && row.user_id === user.id;
              return (
                <motion.div
                  key={row.user_id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`bg-card rounded-xl px-4 py-3 flex items-center gap-3 border ${
                    isMe ? "ring-2 ring-primary border-primary" : "border-border"
                  }`}
                >
                  <div className="w-8 text-sm font-semibold text-muted-foreground tabular-nums">
                    #{rank}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {row.display_name}
                      {isMe && <span className="ml-2 text-[10px] text-primary">You</span>}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {row.trip_count} {row.trip_count === 1 ? "trip" : "trips"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-semibold text-foreground">
                    <Leaf className="w-3.5 h-3.5 text-green-600" />
                    {row.total_co2_saved_kg.toFixed(1)}
                    <span className="text-xs text-muted-foreground ml-0.5">kg</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {me && myOutsideTop20 && (
        <div className="fixed bottom-16 left-0 right-0 z-40 px-4 pb-2 pointer-events-none">
          <div className="max-w-lg mx-auto bg-primary text-primary-foreground rounded-2xl px-4 py-3 shadow-lg flex items-center justify-between pointer-events-auto">
            <span className="text-sm font-semibold">You're #{myIndex + 1}</span>
            <span className="text-sm font-semibold flex items-center gap-1">
              <Leaf className="w-4 h-4" /> {me.total_co2_saved_kg.toFixed(1)} kg saved
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderboardPage;
