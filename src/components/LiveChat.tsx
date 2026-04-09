import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, limit, onSnapshot, Timestamp } from "firebase/firestore";
import api from "@/services/api";
import { useAuth } from "@/hooks/useAuth";
import { Send, Shield, Trash2, Ban, MessageSquare, X } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChatMessage {
  id: string;
  user_id: string;
  display_name: string;
  text: string;
  role: string;
  created_at: string;
  deleted?: boolean;
}

interface Reaction {
  emoji: string;
  count: number;
  draw_id: string;
}

// ─── API calls ────────────────────────────────────────────────────────────────
const chatApi = {
  getMessages: (drawId: string) =>
    api.get(`/chat/${drawId}/messages`).then(r => r.data || []),
  sendMessage: (drawId: string, text: string) =>
    api.post(`/chat/${drawId}/messages`, { text }).then(r => r.data),
  addReaction: (drawId: string, emoji: string) =>
    api.post(`/chat/${drawId}/reactions`, { emoji }).then(r => r.data),
  getReactions: (drawId: string) =>
    api.get(`/chat/${drawId}/reactions`).then(r => r.data || []),
  deleteMessage: (messageId: string) =>
    api.delete(`/chat/messages/${messageId}`).then(r => r.data),
  banUser: (user_id: string) =>
    api.post(`/chat/ban`, { user_id }).then(r => r.data),
};

const ALLOWED_REACTIONS = ['🔥', '🏆', '😱', '🎉', '💎', '🙏', '😤', '🤑'];

// ─── Réaction flottante animée ────────────────────────────────────────────────
const FloatingEmoji = ({ emoji, id, onDone }: { emoji: string; id: number; onDone: () => void }) => {
  const left = 10 + Math.random() * 80;
  useEffect(() => {
    const t = setTimeout(onDone, 2000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 1, y: 0, x: `${left}%`, scale: 0.5 }}
      animate={{ opacity: 0, y: -120, scale: 1.5 }}
      transition={{ duration: 2, ease: "easeOut" }}
      style={{ position: "absolute", bottom: "60px", fontSize: "28px", pointerEvents: "none", zIndex: 50 }}
    >
      {emoji}
    </motion.div>
  );
};

// ─── Composant principal ──────────────────────────────────────────────────────
const LiveChat = ({ drawId, drawStatus }: { drawId: string; drawStatus: string }) => {
  const { user, profile, isAdmin } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [reactions, setReactions] = useState<Record<string, number>>({});
  const [floatingEmojis, setFloatingEmojis] = useState<{ id: number; emoji: string }[]>([]);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const floatingId = useRef(0);
  const isClosed = drawStatus === 'RESOLVED';

  // ── Firestore realtime listener ───────────────────────────────────────────
  useEffect(() => {
    if (!drawId) return;

    const q = query(
      collection(db, "chat_messages"),
      where("draw_id", "==", drawId),
      where("deleted", "==", false),
      orderBy("created_at", "desc"),
      limit(50)
    );

    const unsub = onSnapshot(q, 
      (snapshot) => {
        const msgs = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage))
          .reverse();
        setMessages(msgs);
        if (!isOpen) setUnread(prev => prev + 1);
      },
      (error) => {
        console.error("[Firestore Error]", error);
        if (error.code === 'failed-precondition') {
          toast.error("Index Firestore manquant. Vérifiez la console browser.");
        } else {
          toast.error("Erreur de chargement du chat : " + error.message);
        }
      }
    );

    return () => unsub();
  }, [drawId]);

  // ── Firestore reactions listener ──────────────────────────────────────────
  useEffect(() => {
    if (!drawId) return;

    const q = query(
      collection(db, "chat_reactions"),
      where("draw_id", "==", drawId)
    );

    const unsub = onSnapshot(q, (snapshot) => {
    const map: Record<string, number> = {};
      snapshot.docs.forEach(doc => {
        const d = doc.data();
        map[d.emoji] = d.count || 0;
      });
    setReactions(map);
    });

    return () => unsub();
  }, [drawId]);

  // ── Scroll auto vers le bas ───────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      setUnread(0);
    }
  }, [messages, isOpen]);

  // ── Send message ──────────────────────────────────────────────────────────
  const sendMutation = useMutation({
    mutationFn: () => chatApi.sendMessage(drawId, text),
    onSuccess: () => setText(""),
    onError: (err: any) => toast.error(err.response?.data?.error || err.message),
  });

  const handleSend = () => {
    if (!text.trim() || sendMutation.isPending) return;
    sendMutation.mutate();
  };

  // ── Réaction emoji ────────────────────────────────────────────────────────
  const reactMutation = useMutation({
    mutationFn: (emoji: string) => chatApi.addReaction(drawId, emoji),
    onError: (err: any) => toast.error(err.response?.data?.error || err.message),
  });

  const handleReact = (emoji: string) => {
    reactMutation.mutate(emoji);
    // Animation flottante locale
    const id = floatingId.current++;
    setFloatingEmojis(prev => [...prev, { id, emoji }]);
  };

  const removeFloating = useCallback((id: number) => {
    setFloatingEmojis(prev => prev.filter(e => e.id !== id));
  }, []);

  // ── Admin actions ─────────────────────────────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: (messageId: string) => chatApi.deleteMessage(messageId),
    onSuccess: () => toast.success("Message supprimé"),
    onError: (err: any) => toast.error(err.response?.data?.error || err.message),
  });

  const banMutation = useMutation({
    mutationFn: (userId: string) => chatApi.banUser(userId),
    onSuccess: () => toast.success("Utilisateur banni du chat"),
    onError: (err: any) => toast.error(err.response?.data?.error || err.message),
  });

  const userId = user?.id;

  return (
    <div className="relative">

      {/* ── Emojis flottants ── */}
      <div className="relative pointer-events-none">
        <AnimatePresence>
          {floatingEmojis.map(({ id, emoji }) => (
            <FloatingEmoji key={id} emoji={emoji} id={id} onDone={() => removeFloating(id)} />
          ))}
        </AnimatePresence>
      </div>

      {/* ── Bouton barre de réactions (toujours visible) ── */}
      <div className="flex items-center justify-between gap-2 py-2">
        <div className="flex gap-1.5 flex-wrap">
          {ALLOWED_REACTIONS.map(emoji => (
            <button
              key={emoji}
              onClick={() => handleReact(emoji)}
              className="flex items-center gap-1 px-2 py-1 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all active:scale-125 text-sm"
            >
              <span>{emoji}</span>
              {reactions[emoji] > 0 && (
                <span className="text-[9px] font-black text-muted-foreground tabular-nums">
                  {reactions[emoji]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Bouton ouvrir/fermer chat */}
        <button
          onClick={() => { setIsOpen(v => !v); setUnread(0); }}
          className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass border border-white/10 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Chat
          {unread > 0 && !isOpen && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold rounded-full text-[8px] font-black text-background flex items-center justify-center">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>
      </div>

      {/* ── Panneau chat ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="glass-card rounded-2xl border border-white/5 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/5">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Chat en direct — {messages.length} messages
                </p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="h-64 overflow-y-auto p-3 space-y-2 scroll-smooth">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full opacity-30 space-y-2">
                  <MessageSquare className="w-8 h-8" />
                  <p className="text-xs">Soyez le premier à écrire !</p>
                </div>
              )}
              {messages.map((msg) => {
                const isMe = msg.user_id === userId;
                const isAdminMsg = msg.role === 'admin' || msg.role === 'super_admin';

                return (
                  <div key={msg.id} className={`flex gap-2 group ${isMe ? "flex-row-reverse" : ""}`}>
                    {/* Avatar */}
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black shrink-0 ${
                      isAdminMsg ? "bg-gold/20 text-gold" :
                      isMe ? "bg-purple-500/20 text-purple-400" :
                      "bg-white/10 text-muted-foreground"
                    }`}>
                      {isAdminMsg ? "★" : msg.display_name?.charAt(0)?.toUpperCase() || "?"}
                    </div>

                    {/* Bulle */}
                    <div className={`max-w-[75%] space-y-0.5 ${isMe ? "items-end" : "items-start"} flex flex-col`}>
                      <div className="flex items-center gap-1.5">
                        <p className={`text-[9px] font-bold ${isAdminMsg ? "text-gold" : "text-muted-foreground"}`}>
                          {isAdminMsg && <Shield className="w-2.5 h-2.5 inline mr-0.5" />}
                          {isMe ? "Vous" : msg.display_name}
                        </p>
                      </div>
                      <div className={`px-3 py-1.5 rounded-2xl text-xs leading-relaxed ${
                        isAdminMsg ? "bg-gold/10 border border-gold/20 text-foreground" :
                        isMe ? "bg-purple-500/20 border border-purple-500/20 text-foreground" :
                        "bg-white/5 border border-white/5 text-foreground"
                      }`}>
                        {msg.text}
                      </div>
                    </div>

                    {/* Actions admin */}
                    {isAdmin && !isMe && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity self-center shrink-0">
                        <button
                          onClick={() => deleteMutation.mutate(msg.id)}
                          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Bannir ${msg.display_name} du chat ?`)) {
                              banMutation.mutate(msg.user_id);
                            }
                          }}
                          className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          title="Bannir"
                        >
                          <Ban className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            {!isClosed ? (
              <div className="p-3 border-t border-white/5 flex gap-2">
                <input
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="Écrire un message..."
                  maxLength={300}
                  className="flex-1 bg-muted/40 border border-white/10 rounded-xl px-3 py-2 text-xs focus:border-gold/40 outline-none transition-colors"
                />
                <button
                  onClick={handleSend}
                  disabled={!text.trim() || sendMutation.isPending}
                  className="w-8 h-8 rounded-xl gradient-gold flex items-center justify-center disabled:opacity-40 transition-all hover:scale-105 active:scale-95 shrink-0"
                >
                  <Send className="w-3.5 h-3.5 text-background" />
                </button>
              </div>
            ) : (
              <div className="p-3 border-t border-white/5 text-center">
                <p className="text-[10px] text-muted-foreground italic">Chat fermé — tirage terminé</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LiveChat;