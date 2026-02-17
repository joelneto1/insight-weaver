import { useMemo } from "react";
import { Tv, Video, FileText, Upload, CheckCircle, TrendingUp, Clock, BarChart3, ChevronRight, Youtube, Ghost, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { formatDate } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useCanais } from "@/hooks/useCanais";
import { useVideos } from "@/hooks/useVideos";
import { useKanbanColumns } from "@/hooks/useKanbanColumns";
import { SkeletonStatCard, SkeletonChannelCard, SkeletonListItem, SkeletonChart } from "@/components/SkeletonCard";
import EmptyState from "@/components/EmptyState";
import { useTheme } from "@/contexts/ThemeContext";

const CHANNEL_STYLES = [
  { icon: Youtube, iconClass: "channel-icon-red", label: "YouTube" },
  { icon: Ghost, iconClass: "channel-icon-purple", label: "Terror" },
  { icon: Tv, iconClass: "channel-icon-blue", label: "Canal" },
  { icon: Tv, iconClass: "channel-icon-teal", label: "Canal" },
];

export default function Dashboard() {
  const { profile, user } = useAuth();
  const { canais, loading: loadingCanais } = useCanais();
  const { videos, loading: loadingVideos } = useVideos();
  const { columns, loading: loadingColumns } = useKanbanColumns();
  const { isDark } = useTheme();

  const loading = loadingCanais || loadingVideos || loadingColumns;

  // Calculate counts per column
  const columnCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    columns.forEach(col => {
      counts[col.id] = videos.filter(v => v.column_id === col.id).length;
    });
    return counts;
  }, [videos, columns]);

  const totalVideos = videos.length;
  // Assuming the last column is "completed" or simply showing total progress
  // For a generic approach, we might not know which is "posted". 
  // But we can try to guess by title or just use the last column.
  const lastColumn = columns[columns.length - 1];
  const postados = lastColumn ? (columnCounts[lastColumn.id] || 0) : 0;
  const emProducao = totalVideos - postados;
  const taxaConclusao = totalVideos > 0 ? Math.round((postados / totalVideos) * 100) : 0;

  const recentVideos = useMemo(() =>
    [...videos]
      .filter((v) => v.data_postagem)
      .sort((a, b) => (b.data_postagem! > a.data_postagem! ? 1 : -1))
      .slice(0, 5),
    [videos]);

  // Generate chart from real data
  const chartData = useMemo(() => {
    const days = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const now = new Date();
    const result: { name: string; videos: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const count = videos.filter(v => v.created_at.startsWith(dateStr)).length;
      result.push({ name: days[d.getDay()], videos: count });
    }
    return result;
  }, [videos]);

  const statCards = [
    { label: "Total Vídeos", value: totalVideos, icon: BarChart3, colorClass: "stat-card-cyan", iconBg: "bg-cyan-500/20", iconColor: "text-cyan-400" },
    { label: "Concluídos", value: postados, icon: CheckCircle, colorClass: "stat-card-emerald", iconBg: "bg-emerald-500/20", iconColor: "text-emerald-400" },
    { label: "Em Produção", value: emProducao, icon: Clock, colorClass: "stat-card-amber", iconBg: "bg-amber-500/20", iconColor: "text-amber-400" },
    { label: "Taxa de Conclusão", value: `${taxaConclusao}%`, icon: TrendingUp, colorClass: "stat-card-purple", iconBg: "bg-purple-500/20", iconColor: "text-purple-400" },
  ];

  const tooltipStyle = isDark
    ? { backgroundColor: "hsl(218, 42%, 12%)", border: "1px solid hsla(218, 35%, 20%, 0.5)", borderRadius: "12px", boxShadow: "0 8px 32px -4px rgba(0,0,0,0.5)", color: "hsl(210, 40%, 95%)", padding: "12px 16px" }
    : { backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", boxShadow: "0 4px 16px -4px rgba(0,0,0,0.1)", color: "#1e293b", padding: "12px 16px" };

  if (!loading && totalVideos === 0 && canais.length === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-extrabold text-foreground flex items-center gap-2">
            Olá, {profile?.display_name || user?.email?.split("@")[0] || "Usuário"} 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Vamos começar a montar seu pipeline!</p>
        </div>
        <EmptyState
          icon={Tv}
          title="Nenhum canal cadastrado"
          description="Comece criando seu primeiro canal para gerenciar seus vídeos e acompanhar sua produção."
          actionLabel="Criar Primeiro Canal"
          onAction={() => window.location.href = "/canais"}
        />
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 md:space-y-8 max-w-[100vw] overflow-x-hidden">
      {/* Greeting */}
      <div>
        <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-foreground truncate flex items-center gap-2">
          Olá, {profile?.display_name || user?.email?.split("@")[0] || "Usuário"} 👋
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-1">Visão geral do seu pipeline de produção</p>
      </div>

      {/* ===== CHANNEL CARDS ===== */}
      <div className="grid grid-cols-1 min-[380px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonChannelCard key={i} />)
          : canais.map((canal, i) => {
            const style = CHANNEL_STYLES[i % CHANNEL_STYLES.length];
            const canalVideos = videos.filter((v) => v.canal_id === canal.id);
            // Count "completed" videos (last column)
            const completedCount = lastColumn ? canalVideos.filter(v => v.column_id === lastColumn.id).length : 0;

            return (
              <motion.div key={canal.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
                <Link to="/canais" className="block bg-card border border-border/50 rounded-xl p-4 sm:p-5 hover:border-primary/30 transition-all duration-300 group">
                  <div className="flex items-center gap-3 mb-3 sm:mb-4">
                    <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full ${style.iconClass} flex items-center justify-center shrink-0`}>
                      <style.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground text-sm truncate">{canal.nome}</p>
                      <p className="text-xs text-muted-foreground truncate">{canal.nicho}</p>
                    </div>
                  </div>
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-xl sm:text-2xl font-extrabold text-foreground">{canalVideos.length}</p>
                      <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mt-0.5">VÍDEOS</p>
                    </div>
                    <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${completedCount > 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>
                      {completedCount > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {completedCount} concluídos
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}

        {/* Highlight Card */}
        {!loading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}
            className="highlight-card rounded-xl p-4 sm:p-5 sm:col-span-2 lg:col-span-2">
            <p className="text-xs sm:text-sm font-medium text-white/80 mb-1">Pipeline Total</p>
            <p className="text-[10px] sm:text-xs text-white/60 mb-2 sm:mb-3 capitalize">
              {new Date().toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" })}
            </p>
            <div className="flex items-end justify-between">
              <p className="text-3xl sm:text-4xl font-extrabold text-white">{totalVideos} <span className="text-base sm:text-lg font-medium text-white/70">vídeos</span></p>
              <div className="flex items-center gap-1 text-sm font-bold text-white bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
                <TrendingUp className="w-4 h-4" />
                {taxaConclusao}%
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* ===== STAT CARDS ===== */}
      <div className="grid grid-cols-1 min-[350px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
          : statCards.map((stat, i) => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.06 }}
              className={`${stat.colorClass} rounded-xl p-3 sm:p-5 transition-all duration-300`}>
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate max-w-[80px] sm:max-w-none">{stat.label}</span>
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl ${stat.iconBg} flex items-center justify-center shrink-0`}>
                  <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.iconColor}`} />
                </div>
              </div>
              <p className="text-xl sm:text-3xl font-extrabold text-foreground mb-1 truncate">{stat.value}</p>
            </motion.div>
          ))}
      </div>

      {/* ===== AREA CHART ===== */}
      {loading ? (
        <SkeletonChart />
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-card border border-border/50 rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-foreground">Produção Semanal</h2>
              <p className="text-sm text-muted-foreground mt-0.5">Vídeos criados nos últimos 7 dias</p>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-cyan-400" />
              <span className="text-muted-foreground">Vídeos</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(185, 85%, 50%)" stopOpacity={0.4} />
                  <stop offset="50%" stopColor="hsl(210, 85%, 55%)" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="hsl(220, 85%, 55%)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="hsl(185, 85%, 50%)" />
                  <stop offset="100%" stopColor="hsl(220, 85%, 55%)" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsla(218, 35%, 20%, 0.3)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(215, 25%, 50%)" }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(215, 25%, 50%)" }} allowDecimals={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="videos" stroke="url(#lineGradient)" strokeWidth={3} fill="url(#chartGradient)"
                dot={{ r: 4, fill: "hsl(185, 85%, 50%)", stroke: isDark ? "hsl(218, 42%, 10%)" : "#fff", strokeWidth: 2 }}
                activeDot={{ r: 6, fill: "hsl(185, 85%, 50%)", stroke: "white", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* ===== BOTTOM ROW ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Videos */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="bg-card border border-border/50 rounded-xl p-4 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-foreground">Últimos Vídeos</h2>
            <Link to="/kanban" className="text-sm text-primary hover:text-primary/80 font-medium transition-colors">Ver todos</Link>
          </div>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <SkeletonListItem key={i} />)}</div>
          ) : recentVideos.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Nenhum vídeo publicado ainda.</p>
          ) : (
            <div className="space-y-3">
              {recentVideos.map((video) => {
                const canal = canais.find((c) => c.id === video.canal_id);
                const styleIdx = canais.findIndex((c) => c.id === video.canal_id);
                const style = CHANNEL_STYLES[Math.max(0, styleIdx) % CHANNEL_STYLES.length];
                // Try to find column name
                const colName = columns.find(c => c.id === video.column_id)?.title || "Sem Status";
                const StatusIcon = colName.toLowerCase() === "postado" ? CheckCircle : FileText;

                return (
                  <div key={video.id} className="flex items-center gap-4 py-3 border-b border-border/30 last:border-0">
                    <div className={`w-9 h-9 rounded-lg ${style.iconClass} flex items-center justify-center shrink-0`}>
                      <StatusIcon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{video.titulo}</p>
                      <p className="text-xs text-muted-foreground">{canal?.nome || "Sem canal"}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">{formatDate(video.data_postagem)}</p>
                      <span className={`inline-block text-[10px] font-semibold mt-1 px-2 py-0.5 rounded-full ${colName.toLowerCase() === "postado" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
                        }`}>
                        {colName}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Pipeline Progress */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
          className="bg-card border border-border/50 rounded-xl p-4 sm:p-6">
          <h2 className="text-lg font-bold text-foreground mb-5">Progresso do Pipeline</h2>
          <div className="space-y-4">
            {columns.map((col, i) => {
              const count = columnCounts[col.id] || 0;
              const pct = totalVideos > 0 ? (count / totalVideos) * 100 : 0;
              const colors = ["bg-cyan-400", "bg-blue-400", "bg-emerald-400", "bg-amber-400", "bg-purple-400"];
              const iconColors = ["text-cyan-400", "text-blue-400", "text-emerald-400", "text-amber-400", "text-purple-400"];
              const bgColors = ["bg-cyan-400/15", "bg-blue-400/15", "bg-emerald-400/15", "bg-amber-400/15", "bg-purple-400/15"];
              const cIdx = i % colors.length;
              const Icon = FileText;

              return (
                <div key={col.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${bgColors[cIdx]} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${iconColors[cIdx]}`} />
                      </div>
                      <span className="font-medium text-foreground">{col.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{count}</span>
                      <span className="text-xs text-muted-foreground">({Math.round(pct)}%)</span>
                    </div>
                  </div>
                  <div className="h-2 bg-secondary/50 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                      className={`h-full rounded-full ${colors[cIdx]}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
