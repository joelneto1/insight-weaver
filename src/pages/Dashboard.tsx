import { SAMPLE_CANAIS, SAMPLE_VIDEOS, STATUS_LABELS, STATUS_COLORS, type VideoStatus } from "@/lib/data";
import { Tv, Video, FileText, Upload, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const STAT_ICONS: Record<string, React.ElementType> = {
  titulo_gerado: FileText,
  roteiro_gerado: FileText,
  geracao_imagens: Video,
  upload: Upload,
  postado: CheckCircle,
};

export default function Dashboard() {
  const statusCounts = Object.keys(STATUS_LABELS).reduce((acc, status) => {
    acc[status as VideoStatus] = SAMPLE_VIDEOS.filter((v) => v.status === status).length;
    return acc;
  }, {} as Record<VideoStatus, number>);

  const recentVideos = [...SAMPLE_VIDEOS]
    .filter((v) => v.dataPostagem)
    .sort((a, b) => (b.dataPostagem! > a.dataPostagem! ? 1 : -1))
    .slice(0, 5);

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Visão geral do seu pipeline de produção</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {STATUS_LABELS[status]}
                </span>
              </div>
              <p className="text-3xl font-bold text-foreground">{statusCounts[status]}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Canais */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Tv className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Canais ({SAMPLE_CANAIS.length})</h2>
          </div>
          <div className="space-y-3">
            {SAMPLE_CANAIS.map((canal) => {
              const totalVideos = SAMPLE_VIDEOS.filter((v) => v.canalId === canal.id).length;
              return (
                <div key={canal.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <div>
                    <p className="font-medium text-foreground">{canal.nome}</p>
                    <p className="text-xs text-muted-foreground">{canal.nicho} · {canal.frequencia}</p>
                  </div>
                  <span className="text-sm text-muted-foreground">{totalVideos} vídeos</span>
                </div>
              );
            })}
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
