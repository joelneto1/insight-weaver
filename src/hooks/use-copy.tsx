import { useToast } from "@/hooks/use-toast";

export function useCopy() {
    const { toast } = useToast();

    const copyToClipboard = async (text: string, label: string = "Conteúdo") => {
        try {
            await navigator.clipboard.writeText(text);
            toast({
                title: "Copiado!",
                description: `${label} copiado para a área de transferência.`,
                duration: 2000,
            });
        } catch (err) {
            toast({
                title: "Erro ao copiar",
                description: "Não foi possível copiar o conteúdo.",
                variant: "destructive",
            });
        }
    };

    return { copyToClipboard };
}
