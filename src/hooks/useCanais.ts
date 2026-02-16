import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

export type Canal = Tables<"canais">;
export type CanalInsert = Omit<Canal, "id" | "created_at" | "updated_at" | "user_id">;

export function useCanais() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [canais, setCanais] = useState<Canal[]>([]);
    const [loading, setLoading] = useState(true);

    const fetch = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase
            .from("canais")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: true });
        if (error) {
            toast({ title: "Erro ao carregar canais", description: error.message, variant: "destructive" });
        } else {
            setCanais(data || []);
        }
        setLoading(false);
    }, [user]);

    useEffect(() => { fetch(); }, [fetch]);

    const create = async (canal: CanalInsert) => {
        if (!user) return null;
        const { data, error } = await supabase
            .from("canais")
            .insert({ ...canal, user_id: user.id })
            .select()
            .single();
        if (error) {
            toast({ title: "Erro ao criar canal", description: error.message, variant: "destructive" });
            return null;
        }
        toast({ title: "Canal criado!" });
        await fetch();
        return data;
    };

    const update = async (id: string, canal: Partial<CanalInsert>) => {
        if (!user) return false;
        const { error } = await supabase
            .from("canais")
            .update(canal)
            .eq("id", id)
            .eq("user_id", user.id);
        if (error) {
            toast({ title: "Erro ao atualizar canal", description: error.message, variant: "destructive" });
            return false;
        }
        toast({ title: "Canal atualizado!" });
        await fetch();
        return true;
    };

    const remove = async (id: string) => {
        if (!user) return false;
        const { error } = await supabase
            .from("canais")
            .delete()
            .eq("id", id)
            .eq("user_id", user.id);
        if (error) {
            toast({ title: "Erro ao excluir canal", description: error.message, variant: "destructive" });
            return false;
        }
        toast({ title: "Canal excluído!" });
        await fetch();
        return true;
    };

    return { canais, loading, create, update, remove, refetch: fetch };
}
