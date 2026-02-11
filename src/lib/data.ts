export type VideoStatus = "titulo_gerado" | "roteiro_gerado" | "geracao_imagens" | "upload" | "postado";

export interface Canal {
  id: string;
  nome: string;
  nicho: string;
  subnicho: string;
  micronicho: string;
  idioma: string;
  horarioPostagem: string;
  email: string;
  frequencia: string;
  videosPostados: number;
  anotacoes: string;
}

export interface Video {
  id: string;
  canalId: string;
  titulo: string;
  thumbnail: string;
  notas: string;
  status: VideoStatus;
  dataPostagem?: string;
}

export interface Prompt {
  id: string;
  canalId: string;
  tipo: string;
  conteudo: string;
  favorito: boolean;
}

export const STATUS_LABELS: Record<VideoStatus, string> = {
  titulo_gerado: "Título Gerado",
  roteiro_gerado: "Roteiro Gerado",
  geracao_imagens: "Geração de Imagens",
  upload: "Upload",
  postado: "Postado",
};

export const STATUS_COLORS: Record<VideoStatus, string> = {
  titulo_gerado: "bg-status-planning",
  roteiro_gerado: "bg-status-production",
  geracao_imagens: "bg-status-ready",
  upload: "bg-status-scheduled",
  postado: "bg-status-published",
};

// Sample data
export const SAMPLE_CANAIS: Canal[] = [
  {
    id: "1",
    nome: "Feridas da Família",
    nicho: "História",
    subnicho: "Relatos de Pai",
    micronicho: "Relatos de pai contra filha adotiva",
    idioma: "Português",
    horarioPostagem: "13:00",
    email: "rodolfoalmeida.jhow@gmail.com",
    frequencia: "3x por semana",
    videosPostados: 4,
    anotacoes: "",
  },
  {
    id: "2",
    nome: "Mistérios do Além",
    nicho: "Terror",
    subnicho: "Histórias Sobrenaturais",
    micronicho: "Relatos paranormais reais",
    idioma: "Português",
    horarioPostagem: "20:00",
    email: "misterios@gmail.com",
    frequencia: "Diário",
    videosPostados: 12,
    anotacoes: "Canal em crescimento",
  },
];

export const SAMPLE_VIDEOS: Video[] = [
  { id: "v1", canalId: "1", titulo: "O Pai Que Nunca Perdoou", thumbnail: "", notas: "História emocionante", status: "postado", dataPostagem: "2025-02-01" },
  { id: "v2", canalId: "1", titulo: "A Carta Que Mudou Tudo", thumbnail: "", notas: "", status: "postado", dataPostagem: "2025-02-03" },
  { id: "v3", canalId: "1", titulo: "Segredos de Família", thumbnail: "", notas: "Pesquisar mais", status: "geracao_imagens" },
  { id: "v4", canalId: "1", titulo: "O Reencontro", thumbnail: "", notas: "", status: "titulo_gerado" },
  { id: "v5", canalId: "2", titulo: "A Casa Abandonada", thumbnail: "", notas: "", status: "roteiro_gerado" },
  { id: "v6", canalId: "2", titulo: "Vozes na Escuridão", thumbnail: "", notas: "", status: "upload" },
  { id: "v7", canalId: "2", titulo: "O Espelho Maldito", thumbnail: "", notas: "Thumbnail impactante", status: "titulo_gerado" },
  { id: "v8", canalId: "2", titulo: "Pesadelo Real", thumbnail: "", notas: "", status: "postado", dataPostagem: "2025-01-28" },
];

export const SAMPLE_PROMPTS: Prompt[] = [];
