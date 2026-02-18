import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

export type Video = Tables<"videos"> & { position: number };
export type VideoInsert = Omit<Video, "id" | "created_at" | "updated_at" | "user_id">;

export function useVideos() {
    const { user, ownerId } = useAuth();
    const { toast } = useToast();
    const toastRef = useRef(toast);
    toastRef.current = toast;

    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);

    const fetch = useCallback(async () => {
        console.log("useVideos: fetch called, user:", user?.id, "ownerId:", ownerId);
        if (!user || !ownerId) {
            console.warn("useVideos: skipping fetch - user or ownerId is null", { user: !!user, ownerId });
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("videos")
                .select("*")
                .eq("user_id", ownerId)
                .order("column_id", { ascending: true })
                .order("position", { ascending: true });
            console.log("useVideos: query result", { count: data?.length, error: error?.message });
            if (error) {
                toastRef.current({ title: "Erro ao carregar vídeos", description: error.message, variant: "destructive" });
            } else {
                setVideos((data as Video[]) || []);
            }
        } catch (err) {
            console.error("useVideos fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, [user, ownerId]);

    useEffect(() => { fetch(); }, [fetch]);

    const create = async (video: VideoInsert) => {
        if (!user || !ownerId) return null;
        if (!video.column_id) {
            console.warn("create video: column_id is missing");
        }

        const { data, error } = await supabase
            .from("videos")
            .insert({ ...video, user_id: ownerId })
            .select()
            .single();
        if (error) {
            toastRef.current({ title: "Erro ao criar vídeo", description: error.message, variant: "destructive" });
            return null;
        }
        toastRef.current({ title: "Vídeo criado!", description: "O vídeo foi adicionado à coluna selecionada." });
        await fetch();
        return data as Video;
    };

    const update = async (id: string, updates: Partial<VideoInsert>) => {
        if (!user || !ownerId) return false;

        const { error } = await supabase
            .from("videos")
            .update(updates)
            .eq("id", id)
            .eq("user_id", ownerId);

        if (error) {
            toastRef.current({ title: "Erro ao atualizar vídeo", description: error.message, variant: "destructive" });
            return false;
        }
        await fetch();
        return true;
    };

    const remove = async (id: string) => {
        if (!user || !ownerId) return false;
        const { error } = await supabase
            .from("videos")
            .delete()
            .eq("id", id)
            .eq("user_id", ownerId);
        if (error) {
            toastRef.current({ title: "Erro ao excluir vídeo", description: error.message, variant: "destructive" });
            return false;
        }
        toastRef.current({ title: "Vídeo excluído!" });
        await fetch();
        return true;
    };

    const bulkUpdate = async (updates: { id: string; data: Partial<VideoInsert> }[]) => {
        if (!user || !ownerId) return false;
        try {
            setLoading(true);
            await Promise.all(updates.map(u =>
                supabase
                    .from("videos")
                    .update(u.data)
                    .eq("id", u.id)
                    .eq("user_id", ownerId)
            ));
            await fetch();
            return true;
        } catch (error) {
            console.error("Bulk update failed:", error);
            toastRef.current({ title: "Erro ao atualizar ordem", variant: "destructive" });
            await fetch();
            return false;
        } finally {
            setLoading(false);
        }
    };

    return { videos, loading, create, update, remove, bulkUpdate, refetch: fetch };
}
