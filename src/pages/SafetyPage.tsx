import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Trash2, Phone, Mail, MapPin, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Contact {
  id: string;
  name: string;
  relationship: string | null;
  phone_or_email: string;
}

const TRUSTED_PLACES = [
  { name: "Leeds Rail Station", note: "Staffed 24/7 — meeting points by Platform 1" },
  { name: "Bradford Interchange", note: "Travel info desk inside main concourse" },
  { name: "Halifax Bus Station", note: "Staffed waiting area until late evening" },
  { name: "Huddersfield Station", note: "Help point near ticket office" },
];

const SafetyPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [name, setName] = useState("");
  const [rel, setRel] = useState("");
  const [contact, setContact] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("safety_contacts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setContacts((data as Contact[]) ?? []);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    if (!user || !name || !contact) return;
    const { error } = await supabase.from("safety_contacts").insert({
      user_id: user.id,
      name,
      relationship: rel || null,
      phone_or_email: contact,
    });
    if (error) {
      toast({ title: "Couldn't add contact", description: error.message, variant: "destructive" });
      return;
    }
    setName("");
    setRel("");
    setContact("");
    setAdding(false);
    toast({ title: "Contact added" });
    load();
  };

  const remove = async (id: string) => {
    await supabase.from("safety_contacts").delete().eq("id", id);
    toast({ title: "Contact removed" });
    load();
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" /> Safety Hub
          </h1>
          <p className="text-sm text-muted-foreground mt-1">People and places to keep you safe on the move.</p>
        </motion.div>

        {/* Help Now CTA */}
        <button
          onClick={() => navigate("/help")}
          className="w-full bg-destructive text-destructive-foreground rounded-2xl p-4 mb-6 font-semibold text-left flex items-center justify-between"
        >
          <span>Need help right now?</span>
          <span className="text-sm opacity-90">Open Help Now →</span>
        </button>

        {/* Contacts */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-display font-semibold">Trusted contacts</h2>
            {!adding && (
              <Button size="sm" variant="outline" onClick={() => setAdding(true)}>
                <Plus className="w-4 h-4 mr-1" /> Add
              </Button>
            )}
          </div>

          {adding && (
            <div className="bg-card rounded-xl p-4 border border-border space-y-3 mb-3">
              <div>
                <Label className="mb-1.5 block text-xs">Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Mum" />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs">Relationship (optional)</Label>
                <Input value={rel} onChange={(e) => setRel(e.target.value)} placeholder="Parent / Friend / Buddy" />
              </div>
              <div>
                <Label className="mb-1.5 block text-xs">Phone or email</Label>
                <Input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="07700 900 000" />
              </div>
              <div className="flex gap-2">
                <Button onClick={add} className="flex-1">Save</Button>
                <Button variant="outline" onClick={() => setAdding(false)}>Cancel</Button>
              </div>
            </div>
          )}

          {contacts.length === 0 && !adding && (
            <p className="text-sm text-muted-foreground bg-card rounded-xl p-4 border border-border">
              No contacts yet. Add someone you trust — they'll be the people we suggest first when you share a trip or need help.
            </p>
          )}

          <div className="space-y-2">
            {contacts.map((c) => (
              <div key={c.id} className="bg-card rounded-xl p-3.5 border border-border flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                  {c.phone_or_email.includes("@") ? <Mail className="w-5 h-5 text-primary" /> : <Phone className="w-5 h-5 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {c.relationship ? `${c.relationship} · ` : ""}{c.phone_or_email}
                  </p>
                </div>
                <button onClick={() => remove(c.id)} className="text-muted-foreground p-2">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Trusted places */}
        <section>
          <h2 className="text-lg font-display font-semibold mb-3">Safe waiting places</h2>
          <p className="text-xs text-muted-foreground mb-3">Staffed stations and well-lit interchanges where you can wait if you need to.</p>
          <div className="space-y-2">
            {TRUSTED_PLACES.map((p) => (
              <div key={p.name} className="bg-card rounded-xl p-3.5 border border-border flex gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.note}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default SafetyPage;
