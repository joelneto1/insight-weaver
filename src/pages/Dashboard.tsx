import { SAMPLE_CANAIS, SAMPLE_VIDEOS, STATUS_LABELS, STATUS_COLORS, type VideoStatus } from "@/lib/data";
import { Tv, Video, FileText, Upload, CheckCircle, TrendingUp, Clock, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const STAT_ICONS: Record<string, React.ElementType> = {
  titulo_gerado: FileText,
  roteiro_gerado: FileText,
  geracao_imagens: Video,
  upload: Upload,
  postado: CheckCircle,
};

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

  // Videos per channel stats
  const channelStats = SAMPLE_CANAIS.map((canal) => {
    const videos = SAMPLE_VIDEOS.filter((v) => v.canalId === canal.id);
    const published = videos.filter((v) => v.status === "postado").length;
    return { ...canal, total: videos.length, published };
  });

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
      <div>
        <h1 className="text-xl md:text-2xl font-bold text-foreground truncate">
          Olá, {profile?.display_name || user?.email?.split("@")[0] || "Usuário"} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Visão geral do seu pipeline de produção</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total Vídeos</span>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-foreground">{totalVideos}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-status-published" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Publicados</span>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-foreground">{postados}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-status-production" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Em Produção</span>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-foreground">{emProducao}</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-status-ready" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Taxa Conclusão</span>
          </div>
          <p className="text-2xl md:text-3xl font-bold text-foreground">{taxaConclusao}%</p>
        </motion.div>
      </div>

      {/* Pipeline status */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">Pipeline de Produção</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {(Object.keys(STATUS_LABELS) as VideoStatus[]).map((status, i) => {
            const Icon = STAT_ICONS[status] || FileText;
            return (
              <motion.div
                key={status}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-2 h-2 rounded-full ${STATUS_COLORS[status]}`} />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide truncate">
                    {STATUS_LABELS[status]}
                  </span>
                </div>
                <p className="text-2xl md:text-3xl font-bold text-foreground">{statusCounts[status]}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-card border border-border rounded-xl p-4 md:p-6 overflow-hidden">
        <h2 className="text-lg font-semibold text-foreground mb-4">Progresso Geral</h2>
        <div className="space-y-3">
          {(Object.keys(STATUS_LABELS) as VideoStatus[]).map((status) => {
            const pct = totalVideos > 0 ? (statusCounts[status] / totalVideos) * 100 : 0;
            return (
              <div key={status} className="flex items-center gap-3 text-sm">
                <span className="font-medium text-muted-foreground w-28 md:w-36 truncate shrink-0">{STATUS_LABELS[status]}</span>
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden min-w-[50px]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className={`h-full rounded-full ${STATUS_COLORS[status]}`}
                  />
                </div>
                <span className="text-muted-foreground w-8 text-right shrink-0">{statusCounts[status]}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Canais */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Tv className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Canais ({SAMPLE_CANAIS.length})</h2>
          </div>
          <div className="space-y-3">
            {channelStats.map((canal) => (
              <div key={canal.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div>
                  <p className="font-medium text-foreground">{canal.nome}</p>
                  <p className="text-xs text-muted-foreground">{canal.nicho} · {canal.frequencia}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-foreground">{canal.total}</span>
                  <p className="text-xs text-muted-foreground">{canal.published} publicados</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent videos */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Últimos Vídeos Publicados</h2>
          {recentVideos.length === 0 ? (
            <p className="text-muted-foreground text-sm">Nenhum vídeo publicado ainda.</p>
          ) : (
            <div className="space-y-3">
              {recentVideos.map((video) => {
                const canal = SAMPLE_CANAIS.find((c) => c.id === video.canalId);
                return (
                  <div key={video.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div>
                      <p className="font-medium text-foreground">{video.titulo}</p>
                      <p className="text-xs text-muted-foreground">{canal?.nome}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{video.dataPostagem}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
