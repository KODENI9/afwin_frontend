import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { flashApi } from "@/services/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Zap, Plus, Play, Clock, Trophy, CheckCircle,
  XCircle, Timer, Settings2, ToggleLeft, ToggleRight,
  Trash2, Save
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale/fr";

// ─── Compte à rebours inline ─────────────────────────────────────────────────
const Countdown = ({ endTime }: { endTime: string }) => {
  const [rem, setRem] = useState(() =>
    Math.max(0, new Date(endTime).getTime() - Date.now())
  );
  useState(() => {
    const id = setInterval(() => {
      setRem(Math.max(0, new Date(endTime).getTime() - Date.now()));
    }, 1000);
    return () => clearInterval(id);
  });
  const m = Math.floor(rem / 60000);
  const s = Math.floor((rem % 60000) / 1000);
  return (
    <span className="font-mono font-black tabular-nums text-amber-400">
      {String(m).padStart(2, "0")}:{String(s).padStart(2, "0")}
    </span>
  );
};

// ─── Statut badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  const cfg = {
    OPEN:     { label: "En cours",  className: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: Zap },
    CLOSED:   { label: "Fermé",     className: "bg-amber-500/10 text-amber-400 border-amber-500/20",   icon: Clock },
    RESOLVED: { label: "Résolu",    className: "bg-blue-500/10 text-blue-400 border-blue-500/20",     icon: CheckCircle },
  }[status] || { label: status, className: "bg-white/5 text-muted-foreground border-white/10", icon: XCircle };

  return (
    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${cfg.className}`}>
      <cfg.icon className="w-2.5 h-2.5" />
      {cfg.label}
    </span>
  );
};

// ─── Onglet principal Flash ───────────────────────────────────────────────────
const FlashAdminTab = () => {
  const queryClient = useQueryClient();

  // Form lancement manuel
  const [form, setForm] = useState({
    label: "⚡ Flash Spécial",
    durationMinutes: 5,
    multiplier: 8,
  });

  // Config plages horaires
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [slots, setSlots] = useState<any[]>([]);
  const [scheduleLoaded, setScheduleLoaded] = useState(false);

  // ── Queries ──
  const { data: flashList = [], isLoading } = useQuery({
    queryKey: ["adminFlashList"],
    queryFn: () => flashApi.list(),
    refetchInterval: 15000,
  });

  const { data: activeFlash } = useQuery({
    queryKey: ["activeFlash"],
    queryFn: () => flashApi.getActive(),
    refetchInterval: 10000,
  });

  useQuery({
    queryKey: ["flashSchedule"],
    queryFn: async () => {
      const config = await flashApi.getSchedule();
      if (!scheduleLoaded) {
        setScheduleEnabled(config.enabled ?? false);
        setSlots(config.slots ?? []);
        setScheduleLoaded(true);
      }
      return config;
    },
  });

  // ── Mutations ──
  const createFlash = useMutation({
    mutationFn: () => flashApi.create(form),
    onSuccess: (data) => {
      toast.success(data.message || "Flash lancé !");
      queryClient.invalidateQueries({ queryKey: ["adminFlashList"] });
      queryClient.invalidateQueries({ queryKey: ["activeFlash"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || err.message),
  });

  const resolveFlash = useMutation({
    mutationFn: (flash_id: string) => flashApi.resolve(flash_id),
    onSuccess: () => {
      toast.success("Flash résolu !");
      queryClient.invalidateQueries({ queryKey: ["adminFlashList"] });
      queryClient.invalidateQueries({ queryKey: ["activeFlash"] });
    },
    onError: (err: any) => toast.error(err.response?.data?.error || err.message),
  });

  const saveSchedule = useMutation({
    mutationFn: () => flashApi.saveSchedule({ enabled: scheduleEnabled, slots }),
    onSuccess: () => toast.success("Configuration sauvegardée !"),
    onError: (err: any) => toast.error(err.response?.data?.error || err.message),
  });

  // ── Gestion des slots ──
  const addSlot = () => {
    setSlots(prev => [...prev, {
      id: `FS${Date.now()}`,
      label: "⚡ Flash Auto",
      startHour: 12,
      startMinute: 0,
      durationMinutes: 5,
      multiplier: 8,
      enabled: true,
    }]);
  };  

  const updateSlot = (idx: number, field: string, value: any) => {
    setSlots(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const removeSlot = (idx: number) => {
    setSlots(prev => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* ── Flash actif en cours ── */}
      {activeFlash && activeFlash.status === "OPEN" && (
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-amber-500/10 p-5">
          <div className="absolute -top-6 -right-6 w-24 h-24 bg-amber-400/20 blur-3xl rounded-full pointer-events-none" />
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-amber-400 mb-0.5">
                  Flash en cours
                </p>
                <p className="text-sm font-black text-foreground">{activeFlash.label}</p>
                <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground">
                  <span>x{activeFlash.multiplier}</span>
                  <span>•</span>
                  <span>{activeFlash.durationMinutes} min</span>
                  <span>•</span>
                  <span>Pool : {Number(activeFlash.totalPool || 0).toLocaleString("fr-FR")} CFA</span>
                  <span>•</span>
                  <Timer className="w-3 h-3" />
                  <Countdown endTime={activeFlash.endTime} />
                </div>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => resolveFlash.mutate(activeFlash.id)}
              disabled={resolveFlash.isPending}
              className="h-9 px-4 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 text-[10px] font-black uppercase rounded-xl"
            >
              {resolveFlash.isPending ? "..." : "Résoudre maintenant"}
            </Button>
          </div>
        </div>
      )}

      {/* ── Lancement manuel ── */}
      <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-4">
        <div className="flex items-center gap-2">
          <Play className="w-4 h-4 text-gold" />
          <h2 className="font-display text-sm font-bold">Lancement Manuel</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Label */}
          <div className="sm:col-span-3 space-y-1">
            <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">
              Nom du Flash
            </label>
            <input
              value={form.label}
              onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
              className="w-full h-10 bg-muted/40 border border-white/10 rounded-xl px-4 text-sm focus:border-gold/50 outline-none"
              placeholder="⚡ Flash Spécial"
            />
          </div>

          {/* Durée */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">
              Durée (min)
            </label>
            <input
              type="number" min={2} max={60}
              value={form.durationMinutes}
              onChange={e => setForm(f => ({ ...f, durationMinutes: Number(e.target.value) }))}
              className="w-full h-10 bg-muted/40 border border-white/10 rounded-xl px-4 text-sm focus:border-gold/50 outline-none"
            />
          </div>

          {/* Multiplicateur */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">
              Multiplicateur
            </label>
            <div className="relative">
              <input
                type="number" min={2} max={20}
                value={form.multiplier}
                onChange={e => setForm(f => ({ ...f, multiplier: Number(e.target.value) }))}
                className="w-full h-10 bg-muted/40 border border-white/10 rounded-xl px-4 text-sm focus:border-gold/50 outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground font-bold">x</span>
            </div>
          </div>

          {/* Aperçu gain potentiel */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">
              Gain max (100 CFA)
            </label>
            <div className="h-10 bg-emerald-500/5 border border-emerald-500/20 rounded-xl px-4 flex items-center">
              <span className="text-sm font-black text-emerald-400">
                {(100 * form.multiplier).toLocaleString("fr-FR")} CFA
              </span>
            </div>
          </div>
        </div>

        <Button
          onClick={() => createFlash.mutate()}
          disabled={createFlash.isPending || (activeFlash?.status === "OPEN")}
          className="w-full h-12 gradient-gold font-black uppercase tracking-widest text-[11px] rounded-xl"
        >
          {createFlash.isPending ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : activeFlash?.status === "OPEN" ? (
            "Un Flash est déjà en cours"
          ) : (
            <><Zap className="w-4 h-4 mr-2" /> Lancer le Flash maintenant</>
          )}
        </Button>
      </div>

      {/* ── Config plages horaires automatiques ── */}
      <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings2 className="w-4 h-4 text-gold" />
            <h2 className="font-display text-sm font-bold">Plages Horaires Auto</h2>
          </div>
          <button
            onClick={() => setScheduleEnabled(v => !v)}
            className="flex items-center gap-2 text-xs font-bold"
          >
            {scheduleEnabled
              ? <ToggleRight className="w-6 h-6 text-emerald-400" />
              : <ToggleLeft className="w-6 h-6 text-muted-foreground" />}
            <span className={scheduleEnabled ? "text-emerald-400" : "text-muted-foreground"}>
              {scheduleEnabled ? "Activé" : "Désactivé"}
            </span>
          </button>
        </div>

        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Le système lance automatiquement un Flash à chaque heure configurée (UTC+0 = heure de Lomé).
          Un seul Flash actif à la fois.
        </p>

        {/* Liste des slots */}
        <div className="space-y-3">
          {slots.length === 0 && (
            <p className="text-xs text-muted-foreground italic text-center py-4 opacity-50">
              Aucune plage configurée. Ajoutez-en une ci-dessous.
            </p>
          )}
          {slots.map((slot, idx) => (
            <div key={slot.id} className={`rounded-xl p-4 border space-y-3 transition-all ${
              slot.enabled ? "bg-white/5 border-white/10" : "bg-black/20 border-white/5 opacity-60"
            }`}>
              <div className="flex items-center justify-between">
                <input
                  value={slot.label}
                  onChange={e => updateSlot(idx, "label", e.target.value)}
                  className="flex-1 bg-transparent text-sm font-bold outline-none border-b border-white/10 pb-0.5 mr-3"
                  placeholder="Nom du Flash"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateSlot(idx, "enabled", !slot.enabled)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {slot.enabled
                      ? <ToggleRight className="w-5 h-5 text-emerald-400" />
                      : <ToggleLeft className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => removeSlot(idx)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="space-y-1">
                  <label className="text-[9px] uppercase text-muted-foreground font-bold">Heure</label>
                  <input
                    type="number" min={0} max={23}
                    value={slot.startHour}
                    onChange={e => updateSlot(idx, "startHour", Number(e.target.value))}
                    className="w-full h-8 bg-muted/40 border border-white/10 rounded-lg px-2 text-xs text-center outline-none focus:border-gold/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase text-muted-foreground font-bold">Minute</label>
                  <input
                    type="number" min={0} max={59}
                    value={slot.startMinute}
                    onChange={e => updateSlot(idx, "startMinute", Number(e.target.value))}
                    className="w-full h-8 bg-muted/40 border border-white/10 rounded-lg px-2 text-xs text-center outline-none focus:border-gold/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase text-muted-foreground font-bold">Durée (min)</label>
                  <input
                    type="number" min={2} max={60}
                    value={slot.durationMinutes}
                    onChange={e => updateSlot(idx, "durationMinutes", Number(e.target.value))}
                    className="w-full h-8 bg-muted/40 border border-white/10 rounded-lg px-2 text-xs text-center outline-none focus:border-gold/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] uppercase text-muted-foreground font-bold">Multiplicateur</label>
                  <input
                    type="number" min={2} max={20}
                    value={slot.multiplier}
                    onChange={e => updateSlot(idx, "multiplier", Number(e.target.value))}
                    className="w-full h-8 bg-muted/40 border border-white/10 rounded-lg px-2 text-xs text-center outline-none focus:border-gold/30"
                  />
                </div>
              </div>

              <p className="text-[9px] text-muted-foreground">
                Lancement à{" "}
                <span className="text-gold font-bold">
                  {String(slot.startHour).padStart(2, "0")}h{String(slot.startMinute).padStart(2, "0")}
                </span>{" "}
                pendant{" "}
                <span className="text-gold font-bold">{slot.durationMinutes} min</span>{" "}
                — multiplicateur{" "}
                <span className="text-gold font-bold">x{slot.multiplier}</span>
              </p>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={addSlot}
            className="flex-1 h-9 text-[10px] font-black uppercase rounded-xl border-white/10"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Ajouter une plage
          </Button>
          <Button
            size="sm"
            onClick={() => saveSchedule.mutate()}
            disabled={saveSchedule.isPending}
            className="flex-1 h-9 text-[10px] font-black uppercase rounded-xl gradient-gold"
          >
            {saveSchedule.isPending ? (
              <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <><Save className="w-3.5 h-3.5 mr-1" /> Sauvegarder</>
            )}
          </Button>
        </div>
      </div>

      {/* ── Historique Flash ── */}
      <div className="glass-card rounded-2xl p-5 border border-white/5 space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          <h2 className="font-display text-sm font-bold">Historique Flash</h2>
          <span className="text-[9px] text-muted-foreground">(20 derniers)</span>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          </div>
        ) : flashList.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground italic py-6 opacity-50">
            Aucun Flash lancé pour l'instant.
          </p>
        ) : (
          <div className="space-y-2">
            {flashList.map((flash: any) => (
              <div key={flash.id}
                className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    flash.status === "OPEN" ? "bg-amber-500/20" :
                    flash.status === "RESOLVED" ? "bg-blue-500/10" : "bg-white/5"
                  }`}>
                    <Zap className={`w-4 h-4 ${
                      flash.status === "OPEN" ? "text-amber-400 animate-pulse" :
                      flash.status === "RESOLVED" ? "text-blue-400" : "text-muted-foreground"
                    }`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{flash.label}</p>
                    <div className="flex items-center gap-2 text-[9px] text-muted-foreground mt-0.5 flex-wrap">
                      <span>x{flash.multiplier}</span>
                      <span>•</span>
                      <span>{flash.durationMinutes}min</span>
                      <span>•</span>
                      <span>{Number(flash.totalPool || 0).toLocaleString()} CFA</span>
                      {flash.createdAt && (
                        <>
                          <span>•</span>
                          <span>{format(new Date(flash.createdAt), "dd/MM HH:mm", { locale: fr })}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusBadge status={flash.status} />
                  {flash.status === "OPEN" && (
                    <Button size="sm"
                      onClick={() => resolveFlash.mutate(flash.id)}
                      disabled={resolveFlash.isPending}
                      className="h-7 px-2 text-[9px] font-black bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-lg">
                      Résoudre
                    </Button>
                  )}
                  {flash.status === "RESOLVED" && flash.winningNumber && (
                    <div className="w-7 h-7 rounded-lg gradient-gold flex items-center justify-center font-black text-xs text-background">
                      {flash.winningNumber}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashAdminTab;