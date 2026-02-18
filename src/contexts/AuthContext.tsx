import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface Profile {
  id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  phone: string | null;
  birth_date: string | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  ownerId: string | null;
  permissions: Record<string, boolean>;
  isOwner: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signOut: async () => { },
  refreshProfile: async () => { },
  ownerId: null,
  permissions: {},
  isOwner: true,
});

function clearState(
  setSession: (s: Session | null) => void,
  setUser: (u: User | null) => void,
  setProfile: (p: Profile | null) => void,
  setOwnerId: (o: string | null) => void,
  setPermissions: (p: Record<string, boolean>) => void,
  setIsOwner: (b: boolean) => void,
) {
  setSession(null);
  setUser(null);
  setProfile(null);
  setOwnerId(null);
  setPermissions({});
  setIsOwner(true);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [isOwner, setIsOwner] = useState(true);

  const fetchProfileAndTeam = useCallback(async (userId: string, email?: string) => {
    try {
      // 1. Fetch Profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error("AuthContext: Profile fetch error:", profileError);
      }
      setProfile(profileData ?? null);

      // 2. Check Team Membership
      let { data: teamData, error: teamError } = await supabase
        .from("team_members")
        .select("id, owner_id, permissions, member_id")
        .eq("member_id", userId)
        .maybeSingle();

      if (teamError) console.error("AuthContext: Team fetch by ID error:", teamError);

      // Se não achou por ID e temos email, tenta por email
      if (!teamData && email) {
        const { data: emailData, error: emailError } = await supabase
          .from("team_members")
          .select("id, owner_id, permissions, member_id")
          .eq("member_email", email)
          .maybeSingle();

        if (emailError) console.error("AuthContext: Team fetch by Email error:", emailError);
        teamData = emailData;

        if (teamData && !teamData.member_id) {
          await supabase
            .from("team_members")
            .update({ member_id: userId })
            .eq("id", teamData.id);
        }
      }

      if (teamData) {
        setOwnerId(teamData.owner_id);
        const perms = typeof teamData.permissions === 'object' && teamData.permissions !== null
          ? teamData.permissions as Record<string, boolean>
          : {};
        setPermissions(perms);
        setIsOwner(false);
      } else {
        setOwnerId(userId);
        setPermissions({});
        setIsOwner(true);
      }
    } catch (err) {
      console.error("AuthContext: Unexpected error in fetchProfileAndTeam:", err);
      setOwnerId(userId);
      setIsOwner(true);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfileAndTeam(user.id, user.email);
  }, [user, fetchProfileAndTeam]);

  useEffect(() => {
    let mounted = true;
    let initDone = false;

    const loadSession = async (currentSession: Session | null) => {
      if (!mounted) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        await fetchProfileAndTeam(currentSession.user.id, currentSession.user.email);
      } else {
        clearState(setSession, setUser, setProfile, setOwnerId, setPermissions, setIsOwner);
      }
    };

    // 1. Fetch initial session
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("AuthContext: getSession error", error);
        }
        if (mounted) {
          await loadSession(currentSession);
        }
      } catch (error) {
        console.error("AuthContext: Initial session fetch error:", error);
      } finally {
        if (mounted) {
          initDone = true;
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;
        console.log("AuthContext: onAuthStateChange event:", event);

        if (event === 'SIGNED_OUT') {
          clearState(setSession, setUser, setProfile, setOwnerId, setPermissions, setIsOwner);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await loadSession(currentSession);
        }
        // Ignore INITIAL_SESSION since initializeAuth already handles it

        if (mounted) setLoading(false);
      }
    );

    // 3. Safety timeout — force loading=false after 3s
    const safetyTimer = setTimeout(() => {
      if (mounted && !initDone) {
        console.warn("AuthContext: Safety timeout — forcing loading=false");
        setLoading(false);
      }
    }, 3000);

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, [fetchProfileAndTeam]);

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("AuthContext: signOut error", err);
    } finally {
      // Always clear state, even if Supabase call fails
      clearState(setSession, setUser, setProfile, setOwnerId, setPermissions, setIsOwner);
      setLoading(false);
      // Force redirect to auth
      window.location.href = '/auth';
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile, ownerId, permissions, isOwner }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
