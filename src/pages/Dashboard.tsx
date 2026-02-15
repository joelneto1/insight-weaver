import { SAMPLE_CANAIS, SAMPLE_VIDEOS, STATUS_LABELS, STATUS_COLORS, type VideoStatus } from "@/lib/data";
import { Tv, Video, FileText, Upload, CheckCircle, TrendingUp, Clock, BarChart3, ChevronRight, Youtube, Ghost, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { formatDate, formatCurrency } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Simulated production data for the chart
const chartData = [
  { name: "Seg", videos: 2, views: 1200 },
  { name: "Ter", videos: 1, views: 900 },
  { name: "Qua", videos: 3, views: 1800 },
  { name: "Qui", videos: 2, views: 2200 },
  { name: "Sex", videos: 4, views: 3100 },
  { name: "Sáb", videos: 3, views: 4800 },
  { name: "Dom", videos: 5, views: 5200 },
];

const CHANNEL_STYLES = [
  { icon: Youtube, iconClass: "channel-icon-red", label: "YouTube" },
  { icon: Ghost, iconClass: "channel-icon-purple", label: "Terror" },
  { icon: Tv, iconClass: "channel-icon-blue", label: "Canal" },
  { icon: Tv, iconClass: "channel-icon-teal", label: "Canal" },
];

export default function Dashboard() {
  const { profile, user } = useAuth();

  const statusCounts = Object.keys(STATUS_LABELS).reduce((acc, status) => {
    acc[status as VideoStatus] = SAMPLE_VIDEOS.filter((v) => v.status === status).length;
    return acc;
  }, {} as Record<VideoStatus, number>);

  const totalVideos = SAMPLE_VIDEOS.length;
  const postados = statusCounts.postado || 0;
  const emProducao = totalVideos - postados;
  const taxaConclusao = totalVideos > 0 ? Math.round((postados / totalVideos) * 100) : 0;

  const recentVideos = [...SAMPLE_VIDEOS]
    .filter((v) => v.dataPostagem)
    .sort((a, b) => (b.dataPostagem! > a.dataPostagem! ? 1 : -1))
    .slice(0, 5);

  const statCards = [
    { label: "Total Vídeos", value: totalVideos, icon: BarChart3, colorClass: "stat-card-cyan", iconBg: "bg-cyan-500/20", iconColor: "text-cyan-400", change: "+12%", positive: true },
    { label: "Publicados", value: postados, icon: CheckCircle, colorClass: "stat-card-emerald", iconBg: "bg-emerald-500/20", iconColor: "text-emerald-400", change: "+8%", positive: true },
    { label: "Em Produção", value: emProducao, icon: Clock, colorClass: "stat-card-amber", iconBg: "bg-amber-500/20", iconColor: "text-amber-400", change: "-2", positive: false },
    { label: "Taxa de Conclusão", value: `${taxaConclusao}%`, icon: TrendingUp, colorClass: "stat-card-purple", iconBg: "bg-purple-500/20", iconColor: "text-purple-400", change: "+3.07%", positive: true },
  ];

  return (
    <div className="p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 md:space-y-8 max-w-[100vw] overflow-x-hidden">
      {/* Greeting */}
      <div>
        <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-foreground truncate flex items-center gap-2">
          Olá, {profile?.display_name || user?.email?.split("@")[0] || "Usuário"} 👋
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-1">Visão geral do seu pipeline de produção</p>
      </div>

      {/* ===== CHANNEL CARDS (like social media cards in reference) ===== */}
      <div className="grid grid-cols-1 min-[380px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {SAMPLE_CANAIS.map((canal, i) => {
          const style = CHANNEL_STYLES[i % CHANNEL_STYLES.length];
          const canalVideos = SAMPLE_VIDEOS.filter((v) => v.canalId === canal.id);
          const canalPostados = canalVideos.filter((v) => v.status === "postado").length;
          return (
            <motion.div
              key={canal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
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
                  <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${canalPostados > 0 ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'}`}>
                    {canalPostados > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {canalPostados} postados
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}

        {/* Highlight Card (like "Your Balance" in reference) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          className="highlight-card rounded-xl p-4 sm:p-5 sm:col-span-2 lg:col-span-2"
        >
          <p className="text-xs sm:text-sm font-medium text-white/80 mb-1">Pipeline Total</p>
          <p className="text-[10px] sm:text-xs text-white/60 mb-2 sm:mb-3 capitalize">{new Date().toLocaleDateString("pt-BR", { weekday: 'short', day: 'numeric', month: 'short' })}</p>
          <div className="flex items-end justify-between">
            <p className="text-3xl sm:text-4xl font-extrabold text-white">{totalVideos} <span className="text-base sm:text-lg font-medium text-white/70">vídeos</span></p>
            <div className="flex items-center gap-1 text-sm font-bold text-white bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-sm">
              <TrendingUp className="w-4 h-4" />
              {taxaConclusao}%
            </div>
          </div>
        </motion.div>
      </div>

      {/* ===== STAT CARDS ===== */}
      <div className="grid grid-cols-1 min-[350px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.06 }}
            className={`${stat.colorClass} rounded-xl p-3 sm:p-5 transition-all duration-300`}
          >
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate max-w-[80px] sm:max-w-none">{stat.label}</span>
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl ${stat.iconBg} flex items-center justify-center shrink-0`}>
                <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.iconColor}`} />
              </div>
            </div>
            <p className="text-xl sm:text-3xl font-extrabold text-foreground mb-1 truncate">{stat.value}</p>
            <div className={`flex items-center gap-1 text-xs font-semibold ${stat.positive ? 'text-emerald-400' : 'text-red-400'}`}>
              {stat.positive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              <span>{stat.change}</span>
              <span className="text-muted-foreground font-normal ml-1">vs semana ant.</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ===== AREA CHART (like reference) ===== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-card border border-border/50 rounded-xl p-4 sm:p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-foreground">Produção Semanal</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Vídeos produzidos nos últimos 7 dias</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-cyan-400" />
              <span className="text-muted-foreground">Vídeos</span>
            </div>
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
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "hsl(215, 25%, 50%)" }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "hsl(215, 25%, 50%)" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(218, 42%, 12%)",
                border: "1px solid hsla(218, 35%, 20%, 0.5)",
                borderRadius: "12px",
                boxShadow: "0 8px 32px -4px rgba(0,0,0,0.5)",
                color: "hsl(210, 40%, 95%)",
                padding: "12px 16px",
              }}
              labelStyle={{ color: "hsl(215, 25%, 50%)", marginBottom: "4px", fontSize: "12px" }}
              itemStyle={{ color: "hsl(185, 85%, 50%)", fontWeight: 600 }}
            />
            <Area
              type="monotone"
              dataKey="videos"
              stroke="url(#lineGradient)"
              strokeWidth={3}
              fill="url(#chartGradient)"
              dot={{ r: 4, fill: "hsl(185, 85%, 50%)", stroke: "hsl(218, 42%, 10%)", strokeWidth: 2 }}
              activeDot={{ r: 6, fill: "hsl(185, 85%, 50%)", stroke: "white", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* ===== BOTTOM ROW: Recent Activity + Progress ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

        {/* Recent Orders (like reference) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-card border border-border/50 rounded-xl p-4 sm:p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-foreground">Últimos Vídeos</h2>
            <Link to="/kanban" className="text-sm text-primary hover:text-primary/80 font-medium transition-colors">Ver todos</Link>
          </div>
          {recentVideos.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum vídeo publicado ainda.</p>
          ) : (
            <div className="space-y-3">
              {recentVideos.map((video, i) => {
                const canal = SAMPLE_CANAIS.find((c) => c.id === video.canalId);
                const style = CHANNEL_STYLES[SAMPLE_CANAIS.findIndex((c) => c.id === video.canalId) % CHANNEL_STYLES.length];
                const StatusIcon = video.status === "postado" ? CheckCircle : video.status === "upload" ? Upload : FileText;
                return (
                  <div key={video.id} className="flex items-center gap-4 py-3 border-b border-border/30 last:border-0">
                    <div className={`w-9 h-9 rounded-lg ${style.iconClass} flex items-center justify-center shrink-0`}>
                      <StatusIcon className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground text-sm truncate">{video.titulo}</p>
                      <p className="text-xs text-muted-foreground">{canal?.nome}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-muted-foreground">{formatDate(video.dataPostagem)}</p>
                      <span className={`inline-block text-[10px] font-semibold mt-1 px-2 py-0.5 rounded-full ${video.status === "postado" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"
                        }`}>
                        {STATUS_LABELS[video.status]}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Pipeline Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="bg-card border border-border/50 rounded-xl p-4 sm:p-6"
        >
          <h2 className="text-lg font-bold text-foreground mb-5">Progresso do Pipeline</h2>
          <div className="space-y-4">
            {(Object.keys(STATUS_LABELS) as VideoStatus[]).map((status, i) => {
              const pct = totalVideos > 0 ? (statusCounts[status] / totalVideos) * 100 : 0;
              const colors = ["bg-cyan-400", "bg-blue-400", "bg-emerald-400", "bg-amber-400", "bg-purple-400"];
              const iconColors = ["text-cyan-400", "text-blue-400", "text-emerald-400", "text-amber-400", "text-purple-400"];
              const bgColors = ["bg-cyan-400/15", "bg-blue-400/15", "bg-emerald-400/15", "bg-amber-400/15", "bg-purple-400/15"];
              const icons = [FileText, FileText, Video, Upload, CheckCircle];
              const Icon = icons[i];
              return (
                <div key={status} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${bgColors[i]} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${iconColors[i]}`} />
                      </div>
                      <span className="font-medium text-foreground">{STATUS_LABELS[status]}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{statusCounts[status]}</span>
                      <span className="text-xs text-muted-foreground">({Math.round(pct)}%)</span>
                    </div>
                  </div>
                  <div className="h-2 bg-secondary/50 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 0.3 + i * 0.1 }}
                      className={`h-full rounded-full ${colors[i]}`}
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
