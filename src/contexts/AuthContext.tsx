import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
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
  ownerName: string | null;
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
  ownerName: null,
  permissions: {},
  isOwner: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [ownerName, setOwnerName] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [isOwner, setIsOwner] = useState(true);

  // Use ref to track if we're signing out to prevent race conditions
  const isSigningOut = useRef(false);

  const clearAllState = useCallback(() => {
    setSession(null);
    setUser(null);
    setProfile(null);
    setOwnerId(null);
    setOwnerName(null);
    setPermissions({});
    setIsOwner(true);
  }, []);

  const fetchProfileAndTeam = useCallback(async (userId: string, email?: string) => {
    // Don't fetch if we're signing out
    if (isSigningOut.current) return;

    try {
      // 1. Fetch Profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileError) {
        console.error("AuthContext: Profile fetch error:", profileError);
      }
      if (!isSigningOut.current) {
        setProfile(profileData ?? null);
      }

      // 2. Check Team Membership - is this user a MEMBER of someone's team?
      let teamData: { id: string; owner_id: string; permissions: unknown; member_id: string | null } | null = null;

      // First try by member_id
      const { data: byId, error: teamError } = await supabase
        .from("team_members")
        .select("id, owner_id, permissions, member_id")
        .eq("member_id", userId)
        .maybeSingle();

      if (teamError) {
        console.warn("AuthContext: Team fetch by ID warning:", teamError.message);
      }
      teamData = byId;

      // If not found by ID and we have email, try by email
      if (!teamData && email) {
        const { data: byEmail, error: emailError } = await supabase
          .from("team_members")
          .select("id, owner_id, permissions, member_id")
          .eq("member_email", email)
          .maybeSingle();

        if (emailError) {
          console.warn("AuthContext: Team fetch by Email warning:", emailError.message);
        }
        teamData = byEmail;

        // Auto-link member_id if found by email
        if (teamData && !teamData.member_id) {
          await supabase
            .from("team_members")
            .update({ member_id: userId })
            .eq("id", teamData.id);
        }
      }

      if (isSigningOut.current) return;

      if (teamData && teamData.owner_id !== userId) {
        // This user IS a team member (not the owner)
        setOwnerId(teamData.owner_id);
        const perms = typeof teamData.permissions === 'object' && teamData.permissions !== null
          ? teamData.permissions as Record<string, boolean>
          : {};
        setPermissions(perms);
        setIsOwner(false);
        console.log("AuthContext: User is team member, owner:", teamData.owner_id);

        // 3. Fetch the owner's profile to get their name
        const { data: ownerProfile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("user_id", teamData.owner_id)
          .maybeSingle();

        if (!isSigningOut.current) {
          setOwnerName(ownerProfile?.display_name || null);
          console.log("AuthContext: Owner name:", ownerProfile?.display_name);
        }
      } else {
        // User is their own owner (either no team entry, or they ARE the owner)
        setOwnerId(userId);
        setOwnerName(null);
        setPermissions({});
        setIsOwner(true);
        console.log("AuthContext: User is owner, ownerId:", userId);
      }
    } catch (err) {
      console.error("AuthContext: Unexpected error in fetchProfileAndTeam:", err);
      // Fallback on error - user is their own owner
      if (!isSigningOut.current) {
        setOwnerId(userId);
        setOwnerName(null);
        setPermissions({});
        setIsOwner(true);
      }
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) await fetchProfileAndTeam(user.id, user.email);
  }, [user, fetchProfileAndTeam]);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("AuthContext: getSession error", error);
        }

        if (!mounted) return;

        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
          await fetchProfileAndTeam(currentSession.user.id, currentSession.user.email);
        } else {
          clearAllState();
        }
      } catch (error) {
        console.error("AuthContext: Initial session fetch error:", error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;
        console.log("AuthContext: onAuthStateChange event:", event);

        if (event === 'SIGNED_OUT') {
          clearAllState();
          setLoading(false);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          if (currentSession?.user) {
            setSession(currentSession);
            setUser(currentSession.user);
            await fetchProfileAndTeam(currentSession.user.id, currentSession.user.email);
          }
          setLoading(false);
        }
        // Ignore INITIAL_SESSION since initializeAuth already handles it
      }
    );

    // Safety timeout — force loading=false after 4s
    const safetyTimer = setTimeout(() => {
      if (mounted) {
        setLoading(false);
      }
    }, 4000);

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, [fetchProfileAndTeam, clearAllState]);

  const signOut = useCallback(async () => {
    console.log("AuthContext: signOut initiated");
    isSigningOut.current = true;

    // 1. Clear state FIRST to immediately reflect in the UI
    clearAllState();
    setLoading(false);

    // 2. Clear all storage
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn("AuthContext: Error clearing storage:", e);
    }

    // 3. Sign out from Supabase (global scope to invalidate all sessions)
    try {
      await supabase.auth.signOut({ scope: 'local' });
    } catch (err) {
      console.error("AuthContext: signOut error (continuing anyway)", err);
    }

    // 4. Reset signing out flag
    isSigningOut.current = false;

    // 5. Force hard reload to clear any in-memory state
    window.location.href = '/auth';
  }, [clearAllState]);

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile, ownerId, ownerName, permissions, isOwner }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
