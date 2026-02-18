import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
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

interface TeamMember {
  owner_id: string;
  permissions: Record<string, boolean>;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  ownerId: string | null; // ID efetivo do dono dos dados (meu ou do chefe)
  permissions: Record<string, boolean>; // Minhas permissões
  isOwner: boolean; // Se sou o dono da conta principal
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [isOwner, setIsOwner] = useState(true);

  const fetchProfileAndTeam = async (userId: string, email?: string) => {
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

        // Se achou por email mas member_id está vazio, atualiza para vincular
        if (teamData && !teamData.member_id) {
          const { error: linkError } = await supabase
            .from("team_members")
            .update({ member_id: userId })
            .eq("id", teamData.id);

          if (linkError) console.error("AuthContext: Team link update error:", linkError);
        }
      }

      if (teamData) {
        // I am a team member
        setOwnerId(teamData.owner_id);
        const perms = typeof teamData.permissions === 'object' && teamData.permissions !== null
          ? teamData.permissions as Record<string, boolean>
          : {};
        setPermissions(perms);
        setIsOwner(false);
      } else {
        // I am the owner
        setOwnerId(userId);
        setPermissions({});
        setIsOwner(true);
      }
    } catch (err) {
      console.error("AuthContext: Unexpected error in fetchProfileAndTeam:", err);
      // Fallback safe state
      setOwnerId(userId);
      setIsOwner(true);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfileAndTeam(user.id, user.email);
  };

  useEffect(() => {
    let mounted = true;

    // Subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
        try {
          setSession(session);
          setUser(session?.user ?? null);

          if (session?.user) {
            await fetchProfileAndTeam(session.user.id, session.user.email);
          } else {
            setProfile(null);
            setOwnerId(null);
            setPermissions({});
            setIsOwner(true);
          }
        } catch (error) {
          console.error("AuthContext: Auth state change error:", error);
        } finally {
          if (mounted) setLoading(false);
        }
      }
    );

    // Initial check
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (!mounted) return;
      if (error) {
        console.error("AuthContext: Get session error:", error);
        setLoading(false);
        return;
      }

      try {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfileAndTeam(session.user.id, session.user.email);
        }
      } catch (error) {
        console.error("AuthContext: Initial load error:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setOwnerId(null);
    setPermissions({});
    setIsOwner(true);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile, ownerId, permissions, isOwner }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
