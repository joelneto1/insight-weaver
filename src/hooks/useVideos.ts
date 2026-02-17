import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

export type Video = Tables<"videos"> & { position: number };
export type VideoStatus = "planejamento" | "roteiro" | "gravado" | "upload" | "postado";
export type VideoInsert = Omit<Video, "id" | "created_at" | "updated_at" | "user_id">;

export const STATUS_LABELS: Record<VideoStatus, string> = {
    planejamento: "Planejamento",
    roteiro: "Roteiro",
    gravado: "Gravado",
    upload: "Upload",
    postado: "Postado",
};

export const STATUS_COLORS: Record<VideoStatus, string> = {
    planejamento: "bg-yellow-500",
    roteiro: "bg-orange-500",
    gravado: "bg-emerald-500",
    upload: "bg-blue-500",
    postado: "bg-purple-500",
};

export function useVideos() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);

    const fetch = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase
            .from("videos")
            .select("*")
            .eq("user_id", user.id)
            .order("position", { ascending: true })
            .order("created_at", { ascending: true });
        if (error) {
            toast({ title: "Erro ao carregar vídeos", description: error.message, variant: "destructive" });
        } else {
            setVideos((data as Video[]) || []);
        }
        setLoading(false);
    }, [user]);

    useEffect(() => { fetch(); }, [fetch]);

    const create = async (video: VideoInsert) => {
        if (!user) return null;
        const { data, error } = await supabase
            .from("videos")
            .insert({ ...video, user_id: user.id })
            .select()
            .single();
        if (error) {
            toast({ title: "Erro ao criar vídeo", description: error.message, variant: "destructive" });
            return null;
        }
        toast({ title: "Vídeo criado!" });
        await fetch();
        return data;
    };

    const update = async (id: string, video: Partial<VideoInsert>) => {
        if (!user) return false;
        const { error } = await supabase
            .from("videos")
            .update(video)
            .eq("id", id)
            .eq("user_id", user.id);
        if (error) {
            toast({ title: "Erro ao atualizar vídeo", description: error.message, variant: "destructive" });
            return false;
        }
        await fetch();
        return true;
    };

    const remove = async (id: string) => {
        if (!user) return false;
        const { error } = await supabase
            .from("videos")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id);
        if (error) {
            toast({ title: "Erro ao excluir vídeo", description: error.message, variant: "destructive" });
            return false;
        }
        toast({ title: "Vídeo excluído!" });
        await fetch();
        return true;
    };

    const bulkUpdate = async (updates: { id: string; data: Partial<VideoInsert> }[]) => {
        if (!user) return false;
        try {
            setLoading(true); // Optimistic UI or loading indicator
            // Ideally use an RPC function for batch updates, but sequential is okay for small batches
            await Promise.all(updates.map(u =>
                supabase
                    .from("videos")
                    .update(u.data)
                    .eq("id", u.id)
                    .eq("user_id", user.id)
            ));
            await fetch();
            return true;
        } catch (error) {
            console.error("Bulk update failed:", error);
            toast({ title: "Erro ao atualizar ordem", variant: "destructive" });
            await fetch(); // Revert/refresh
            return false;
        } finally {
            setLoading(false);
        }
    };

    return { videos, loading, create, update, remove, bulkUpdate, refetch: fetch };
}
