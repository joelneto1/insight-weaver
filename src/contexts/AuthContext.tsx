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
  // Track if initial auth has been processed to avoid double processing
  const initialAuthDone = useRef(false);

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
      // 1. Fetch Profile AND Team membership in PARALLEL for speed
      const [profileResult, teamByIdResult] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("team_members")
          .select("id, owner_id, permissions, member_id")
          .eq("member_id", userId)
          .maybeSingle()
      ]);

      if (isSigningOut.current) return;

      // Handle profile
      if (profileResult.error) {
        console.error("AuthContext: Profile fetch error:", profileResult.error);
      }
      setProfile(profileResult.data ?? null);

      // Handle team membership
      let teamData = teamByIdResult.data;
      if (teamByIdResult.error) {
        console.warn("AuthContext: Team fetch by ID warning:", teamByIdResult.error.message);
      }

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

        // Auto-link member_id if found by email (fire and forget)
        if (teamData && !teamData.member_id) {
          supabase
            .from("team_members")
            .update({ member_id: userId })
            .eq("id", teamData.id)
            .then(() => { });
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

        // Fetch the owner's name in background (non-blocking)
        supabase
          .from("profiles")
          .select("display_name")
          .eq("user_id", teamData.owner_id)
          .maybeSingle()
          .then(({ data: ownerProfile }) => {
            if (!isSigningOut.current) {
              setOwnerName(ownerProfile?.display_name || null);
            }
          });
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

  // Store stable references to avoid effect re-runs
  const fetchProfileAndTeamRef = useRef(fetchProfileAndTeam);
  fetchProfileAndTeamRef.current = fetchProfileAndTeam;
  const clearAllStateRef = useRef(clearAllState);
  clearAllStateRef.current = clearAllState;

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
          // CRITICAL: await this so ownerId is set BEFORE loading becomes false
          await fetchProfileAndTeamRef.current(currentSession.user.id, currentSession.user.email);
        } else {
          clearAllStateRef.current();
        }
      } catch (error) {
        // Only log non-abort errors, abort errors are expected on cleanup
        if (error instanceof DOMException && error.name === 'AbortError') {
          console.debug("AuthContext: Session fetch aborted (expected on cleanup)");
        } else {
          console.error("AuthContext: Initial session fetch error:", error);
        }
      } finally {
        if (mounted) {
          initialAuthDone.current = true;
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;

        // Skip INITIAL_SESSION since initializeAuth handles it
        if (event === 'INITIAL_SESSION') return;

        console.log("AuthContext: onAuthStateChange event:", event);

        if (event === 'SIGNED_OUT') {
          clearAllStateRef.current();
          setLoading(false);
        } else if (event === 'SIGNED_IN') {
          // Only process if initializeAuth already ran (avoids double-fetch)
          if (initialAuthDone.current && currentSession?.user) {
            setSession(currentSession);
            setUser(currentSession.user);
            await fetchProfileAndTeamRef.current(currentSession.user.id, currentSession.user.email);
            setLoading(false);
          }
        } else if (event === 'TOKEN_REFRESHED') {
          // Only update session/user, no need to re-fetch all profile data
          if (currentSession?.user) {
            setSession(currentSession);
            setUser(currentSession.user);
          }
        }
      }
    );

    // Safety timeout — force loading=false after 10s (increased to give more time)
    const safetyTimer = setTimeout(() => {
      if (mounted) {
        setLoading(prev => {
          if (prev) {
            console.warn("AuthContext: Safety timeout reached, forcing loading=false");
            return false;
          }
          return prev;
        });
      }
    }, 10000);

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - runs once on mount, uses refs for latest callbacks

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

    // 3. Sign out from Supabase
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
