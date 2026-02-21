import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

export type Video = Tables<"videos"> & { position: number };
export type VideoInsert = Omit<Video, "id" | "created_at" | "updated_at" | "user_id">;

// Simple in-memory cache
const cache: { ownerId: string | null; data: Video[] | null } = { ownerId: null, data: null };

export function useVideos() {
    const { user, ownerId } = useAuth();
    const { toast } = useToast();
    const toastRef = useRef(toast);
    toastRef.current = toast;

    const [videos, setVideos] = useState<Video[]>(cache.ownerId === ownerId && cache.data ? cache.data : []);
    const [loading, setLoading] = useState(!(cache.ownerId === ownerId && cache.data));

    const fetch = useCallback(async (force = false) => {
        if (!user || !ownerId) {
            setLoading(false);
            return;
        }
        if (!force && cache.ownerId === ownerId && cache.data) {
            setVideos(cache.data);
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
            if (error) {
                // Don't show toast for abort errors (normal during navigation/cleanup)
                if (error.message?.includes('abort') || error.message?.includes('AbortError')) {
                    console.debug("useVideos: fetch aborted (expected)");
                } else {
                    toastRef.current({ title: "Erro ao carregar vídeos", description: error.message, variant: "destructive" });
                }
            } else {
                const result = (data as Video[]) || [];
                cache.ownerId = ownerId;
                cache.data = result;
                setVideos(result);
            }
        } catch (err: any) {
            if (err?.name === 'AbortError' || err?.message?.includes('abort')) {
                console.debug("useVideos: fetch aborted (expected)");
            } else {
                console.error("useVideos fetch error:", err);
            }
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
        await fetch(true);
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
        await fetch(true);
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
        await fetch(true);
        return true;
    };

    const bulkUpdate = async (updates: { id: string; data: Partial<VideoInsert> }[]) => {
        if (!user || !ownerId) return false;

        // Optimistic update: apply changes to local state immediately
        setVideos(prev => {
            const updatesMap = new Map(updates.map(u => [u.id, u.data]));
            const updated = prev.map(v => {
                const patch = updatesMap.get(v.id);
                return patch ? { ...v, ...patch } : v;
            });
            // Update cache too
            cache.data = updated;
            return updated;
        });

        try {
            // Send all updates to server in background (no loading state)
            const results = await Promise.all(updates.map(u =>
                supabase
                    .from("videos")
                    .update(u.data)
                    .eq("id", u.id)
                    .eq("user_id", ownerId)
            ));
            const hasError = results.some(r => r.error);
            if (hasError) {
                console.error("Some bulk updates failed, refetching...");
                await fetch(true);
            }
            return true;
        } catch (error) {
            console.error("Bulk update failed:", error);
            toastRef.current({ title: "Erro ao atualizar ordem", variant: "destructive" });
            // On failure, refetch to get correct state
            await fetch(true);
            return false;
        }
    };

    return { videos, loading, create, update, remove, bulkUpdate, refetch: fetch };
}
