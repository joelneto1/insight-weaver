import { FileText, Send, Loader2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function Formulario() {
    const { toast } = useToast();

    const [titulo, setTitulo] = useState("");
    const [nomeCanal, setNomeCanal] = useState("");
    const [idioma, setIdioma] = useState("");
    const [quantidadeImagens, setQuantidadeImagens] = useState("");
    const [sending, setSending] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!titulo || !nomeCanal || !idioma || !quantidadeImagens) {
            toast({
                title: "Campos obrigatórios",
                description: "Preencha todos os campos antes de enviar.",
                variant: "destructive",
            });
            return;
        }

        setSending(true);

        try {
            // Envia os dados para o webhook do n8n
            const response = await fetch(import.meta.env.VITE_N8N_WEBHOOK_URL || "https://n8n.joelneto.uk/webhook/formulario", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    titulo,
                    nome_canal: nomeCanal,
                    idioma,
                    quantidade_imagens: Number(quantidadeImagens),
                }),
            });

            if (!response.ok) {
                throw new Error("Falha ao enviar formulário");
            }

            setSent(true);
            toast({
                title: "Automação acionada!",
                description: "O formulário foi enviado com sucesso para o n8n.",
            });

            // Reset depois de 3s
            setTimeout(() => {
                setSent(false);
                setTitulo("");
                setNomeCanal("");
                setIdioma("");
                setQuantidadeImagens("");
            }, 3000);
        } catch (error) {
            toast({
                title: "Erro ao enviar",
                description: "Não foi possível acionar a automação. Tente novamente.",
                variant: "destructive",
            });
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="p-6 lg:p-8 space-y-6 max-w-2xl">
            <div className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">Formulário</h1>
            </div>

            <p className="text-muted-foreground text-sm">
                Preencha os campos abaixo para acionar uma automação no n8n.
            </p>

            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="bg-card border border-border rounded-xl p-6 space-y-6"
            >
                <AnimatePresence mode="wait">
                    {sent ? (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex flex-col items-center justify-center py-12 gap-4"
                        >
                            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8 text-green-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-foreground">Enviado com sucesso!</h3>
                            <p className="text-muted-foreground text-sm text-center">
                                A automação foi acionada. O formulário será resetado em instantes.
                            </p>
                        </motion.div>
                    ) : (
                        <motion.form
                            key="form"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onSubmit={handleSubmit}
                            className="space-y-5"
                        >
                            {/* Título */}
                            <div className="space-y-2">
                                <label htmlFor="titulo" className="text-sm font-medium text-foreground">
                                    Título
                                </label>
                                <Input
                                    id="titulo"
                                    value={titulo}
                                    onChange={(e) => setTitulo(e.target.value)}
                                    placeholder="Ex: 10 dicas de produtividade"
                                    disabled={sending}
                                />
                            </div>

                            {/* Nome do Canal */}
                            <div className="space-y-2">
                                <label htmlFor="nome-canal" className="text-sm font-medium text-foreground">
                                    Nome do Canal
                                </label>
                                <Input
                                    id="nome-canal"
                                    value={nomeCanal}
                                    onChange={(e) => setNomeCanal(e.target.value)}
                                    placeholder="Ex: MeuCanal"
                                    disabled={sending}
                                />
                            </div>

                            {/* Idioma */}
                            <div className="space-y-2">
                                <label htmlFor="idioma" className="text-sm font-medium text-foreground">
                                    Idioma
                                </label>
                                <Select value={idioma} onValueChange={setIdioma} disabled={sending}>
                                    <SelectTrigger id="idioma">
                                        <SelectValue placeholder="Selecione o idioma" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pt-br">Português (Brasil)</SelectItem>
                                        <SelectItem value="en">Inglês</SelectItem>
                                        <SelectItem value="es">Espanhol</SelectItem>
                                        <SelectItem value="fr">Francês</SelectItem>
                                        <SelectItem value="de">Alemão</SelectItem>
                                        <SelectItem value="it">Italiano</SelectItem>
                                        <SelectItem value="ja">Japonês</SelectItem>
                                        <SelectItem value="ko">Coreano</SelectItem>
                                        <SelectItem value="zh">Chinês</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Quantidade de Imagens */}
                            <div className="space-y-2">
                                <label htmlFor="quantidade-imagens" className="text-sm font-medium text-foreground">
                                    Quantidade de Imagens
                                </label>
                                <Input
                                    id="quantidade-imagens"
                                    type="number"
                                    min="1"
                                    value={quantidadeImagens}
                                    onChange={(e) => setQuantidadeImagens(e.target.value)}
                                    placeholder="Ex: 5"
                                    disabled={sending}
                                />
                            </div>

                            {/* Botão de Enviar */}
                            <div className="pt-2">
                                <Button
                                    type="submit"
                                    disabled={sending}
                                    className="w-full gradient-accent text-primary-foreground gap-2 h-11 text-base font-semibold"
                                >
                                    {sending ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Enviando...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-5 h-5" />
                                            Acionar Automação
                                        </>
                                    )}
                                </Button>
                            </div>
                        </motion.form>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
}
