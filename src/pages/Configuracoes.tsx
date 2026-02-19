import { Settings, Moon, Sun, User, Save, Loader2, Pencil, Camera, Phone, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

import { TeamManagement } from "@/components/TeamManagement";

export default function Configuracoes() {
  const { profile, user, refreshProfile, isOwner } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { toast } = useToast();

  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [birthDate, setBirthDate] = useState(profile?.birth_date || "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url || null);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || "");
      setBio(profile.bio || "");
      setPhone(profile.phone || "");
      setBirthDate(profile.birth_date || "");
      setAvatarUrl(profile.avatar_url || null);
    }
  }, [profile]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("Você deve selecionar uma imagem para upload.");
      }

      const file = event.target.files[0];

      // Validate file type and size
      const MAX_SIZE = 2 * 1024 * 1024; // 2MB
      const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
      if (file.size > MAX_SIZE) {
        throw new Error("Arquivo muito grande. O tamanho máximo é 2MB.");
      }
      if (!ALLOWED_TYPES.includes(file.type)) {
        throw new Error("Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF.");
      }

      const fileExt = file.name.split(".").pop();
      const fileName = `${user?.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      setAvatarUrl(data.publicUrl);

      if (user) {
        await supabase
          .from("profiles")
          .update({ avatar_url: data.publicUrl })
          .eq("user_id", user.id);
        await refreshProfile();
      }

      toast({ title: "Avatar atualizado!", description: "Sua foto de perfil foi alterada." });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Erro desconhecido no upload.";
      toast({ title: "Erro no upload", description: message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        bio,
        phone: phone || null,
        birth_date: birthDate || null,
        avatar_url: avatarUrl
      })
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      await refreshProfile();
      setIsEditing(false);
      toast({ title: "Perfil atualizado!", description: "Suas informações foram salvas." });
    }
    setSaving(false);
  };

  const handleChangePassword = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
      redirectTo: window.location.origin,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "E-mail enviado", description: "Verifique sua caixa de entrada para redefinir a senha." });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-2xl">
      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Configurações</h1>
      </div>

      {/* Profile */}
      <div className="bg-card border border-border rounded-xl p-4 sm:p-6 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Perfil</h2>
          </div>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              <Pencil className="w-4 h-4 mr-2" /> Editar Informações
            </Button>
          )}
        </div>

        {/* Avatar Upload */}
        <div className="flex flex-col items-center sm:flex-row gap-6">
          <div className="relative group">
            <Avatar className="w-24 h-24 border-2 border-border">
              <AvatarImage src={avatarUrl || profile?.avatar_url || undefined} className="object-cover" />
              <AvatarFallback className="text-2xl font-bold bg-secondary text-secondary-foreground">
                {user?.email?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {isEditing && (
              <>
                <label htmlFor="avatar-upload" className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="w-8 h-8 text-white" />
                </label>
                <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
              </>
            )}
            {uploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-4 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Nome de Exibição</label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Seu nome" className="mt-1" maxLength={50} disabled={!isEditing} />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">E-mail</label>
                <Input value={user?.email || ""} disabled className="mt-1 opacity-60 cursor-not-allowed" />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Telefone</label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" className="pl-10" disabled={!isEditing} />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Data de Nascimento</label>
                <div className="relative mt-1">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="pl-10 block" disabled={!isEditing} />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Bio</label>
              <Textarea value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Conte um pouco sobre você..." className="mt-1" maxLength={300} rows={3} disabled={!isEditing} />
              {isEditing && <span className="text-xs text-muted-foreground">{bio.length}/300</span>}
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="ghost" onClick={() => setIsEditing(false)} disabled={saving}>Cancelar</Button>
            <Button onClick={handleSaveProfile} disabled={saving} className="gradient-accent text-primary-foreground gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar Alterações
            </Button>
          </div>
        )}
      </div>

      {/* Theme */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Aparência</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isDark ? <Moon className="w-5 h-5 text-primary" /> : <Sun className="w-5 h-5 text-status-planning" />}
            <div>
              <p className="font-medium text-foreground">Modo Escuro</p>
              <p className="text-sm text-muted-foreground">Alternar entre tema claro e escuro</p>
            </div>
          </div>
          <Switch checked={isDark} onCheckedChange={toggleTheme} />
        </div>
      </div>

      {/* Security */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Segurança</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <p className="font-medium text-foreground">Alterar Senha</p>
            <p className="text-sm text-muted-foreground">Enviaremos um link para redefinição por e-mail</p>
          </div>
          <Button variant="outline" onClick={handleChangePassword} className="w-full sm:w-auto">Redefinir Senha</Button>
        </div>
      </div>

      {isOwner && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <TeamManagement />
        </div>
      )}
    </div>
  );
}
