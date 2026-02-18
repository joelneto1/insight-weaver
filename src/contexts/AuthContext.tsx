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
    // 1. Fetch Profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    setProfile(profileData ?? null);

    // 2. Check Team Membership
    // Primeiro tenta pelo ID
    let { data: teamData } = await supabase
      .from("team_members")
      .select("id, owner_id, permissions, member_id")
      .eq("member_id", userId)
      .maybeSingle();

    // Se não achou por ID e temos email, tenta por email
    if (!teamData && email) {
      const { data: emailData } = await supabase
        .from("team_members")
        .select("id, owner_id, permissions, member_id")
        .eq("member_email", email)
        .maybeSingle();

      teamData = emailData;

      // Se achou por email mas member_id está vazio, atualiza para vincular
      if (teamData && !teamData.member_id) {
        await supabase
          .from("team_members")
          .update({ member_id: userId })
          .eq("id", teamData.id);
      }
    }

    if (teamData) {
      // I am a team member
      setOwnerId(teamData.owner_id);
      // Ensure permissions is an object, handling potential null/string types
      const perms = typeof teamData.permissions === 'object' && teamData.permissions !== null
        ? teamData.permissions as Record<string, boolean>
        : {};
      setPermissions(perms);
      setIsOwner(false);
    } else {
      // I am the owner
      setOwnerId(userId);
      setPermissions({}); // Owners imply full access, logic should handle isOwner check
      setIsOwner(true);
    }
  };

  const refreshProfile = async () => {
    if (user) await fetchProfileAndTeam(user.id, user.email);
  };

  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return;
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
        setLoading(false);
      }
    );

    // Initial check
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        await fetchProfileAndTeam(session.user.id, session.user.email);
      } else {
        setLoading(false);
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
