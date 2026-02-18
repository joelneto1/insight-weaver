import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

export type Video = Tables<"videos"> & { position: number };
// VideoInsert should rely on column_id instead of status
export type VideoInsert = Omit<Video, "id" | "created_at" | "updated_at" | "user_id">;

export function useVideos() {
    const { user, ownerId } = useAuth();
    const { toast } = useToast();
    const [videos, setVideos] = useState<Video[]>([]);
    const [loading, setLoading] = useState(true);

    const fetch = useCallback(async () => {
        if (!user || !ownerId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const { data, error } = await supabase
            .from("videos")
            .select("*")
            .eq("user_id", ownerId)
            .order("column_id", { ascending: true }) // Group by column if needed for initial sorting
            .order("position", { ascending: true }); // Within column

        if (error) {
            toast({ title: "Erro ao carregar vídeos", description: error.message, variant: "destructive" });
        } else {
            console.log("Fetched videos:", data);
            setVideos((data as Video[]) || []);
        }
        setLoading(false);
    }, [user, ownerId, toast]);

    useEffect(() => { fetch(); }, [fetch]);

    const create = async (video: VideoInsert) => {
        if (!user || !ownerId) return null;
        // Ensure column_id is present?
        if (!video.column_id) {
            // Fallback logic? Or require it. The UI should provide a default column.
            // We can default to the first column if missing, but let's assume UI handles it.
            console.warn("create video: column_id is missing");
        }

        const { data, error } = await supabase
            .from("videos")
            .insert({ ...video, user_id: ownerId })
            .select()
            .single();
        if (error) {
            toast({ title: "Erro ao criar vídeo", description: error.message, variant: "destructive" });
            return null;
        }
        toast({ title: "Vídeo criado!", description: "O vídeo foi adicionado à coluna selecionada." });
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
            toast({ title: "Erro ao atualizar vídeo", description: error.message, variant: "destructive" });
            return false;
        }
        // Optimistic update locally could be done here instead of fetch...
        // But fetch ensures consistency with other users/sessions.
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
            toast({ title: "Erro ao excluir vídeo", description: error.message, variant: "destructive" });
            return false;
        }
        toast({ title: "Vídeo excluído!" });
        await fetch();
        return true;
    };

    const bulkUpdate = async (updates: { id: string; data: Partial<VideoInsert> }[]) => {
        if (!user || !ownerId) return false;
        try {
            setLoading(true); // Optimistic UI or loading indicator
            // Sequential is safer for order-sensitive updates if they depend on each other,
            // but for independent rows, parallelism is fine.
            // Using Promise.all for speed.
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
            toast({ title: "Erro ao atualizar ordem", variant: "destructive" });
            await fetch(); // Revert/refresh
            return false;
        } finally {
            setLoading(false);
        }
    };

    return { videos, loading, create, update, remove, bulkUpdate, refetch: fetch };
}
