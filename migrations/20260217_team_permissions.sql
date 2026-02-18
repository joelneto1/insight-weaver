-- 1. Enable UPDATE on team_members for self-linking via email
CREATE POLICY "Members can link themselves via email"
ON public.team_members
FOR UPDATE
USING (
  member_email = (( SELECT users.email FROM auth.users WHERE (users.id = ( SELECT auth.uid() AS uid))::uuid ))::text
  AND member_id IS NULL
)
WITH CHECK (
  member_id = auth.uid()
);

-- Note: The subquery above handles casting correctly for Supabase auth.users.email
-- If simply using auth.jwt()->>'email' is preferred, adapt accordingly.
-- The executed policy used: member_email = (SELECT email FROM auth.users WHERE id = auth.uid())::text

-- 2. Update RLS policies for data tables to use is_team_member function

-- Table: financeiro
DROP POLICY IF EXISTS "Enable all for users based on user_id" ON public.financeiro;
DROP POLICY IF EXISTS "Users can manage their own financeiro records" ON public.financeiro;
CREATE POLICY "Team access for financeiro"
ON public.financeiro
FOR ALL
USING ( public.is_team_member(user_id, 'financeiro') )
WITH CHECK ( public.is_team_member(user_id, 'financeiro') );

-- Table: contas
DROP POLICY IF EXISTS "Enable all for users based on user_id" ON public.contas;
DROP POLICY IF EXISTS "Users can manage their own accounts" ON public.contas;
CREATE POLICY "Team access for contas"
ON public.contas
FOR ALL
USING ( public.is_team_member(user_id, 'contas') )
WITH CHECK ( public.is_team_member(user_id, 'contas') );

-- Table: kanban_columns
DROP POLICY IF EXISTS "Enable all for users based on user_id" ON public.kanban_columns;
DROP POLICY IF EXISTS "Users can manage their own kanban columns" ON public.kanban_columns;
CREATE POLICY "Team access for kanban_columns"
ON public.kanban_columns
FOR ALL
USING ( public.is_team_member(user_id, 'kanban') )
WITH CHECK ( public.is_team_member(user_id, 'kanban') );

-- Table: videos
DROP POLICY IF EXISTS "Enable all for users based on user_id" ON public.videos;
DROP POLICY IF EXISTS "Users can manage their own videos" ON public.videos;
CREATE POLICY "Team access for videos"
ON public.videos
FOR ALL
USING ( public.is_team_member(user_id, 'kanban') )
WITH CHECK ( public.is_team_member(user_id, 'kanban') );

-- Table: canais
DROP POLICY IF EXISTS "Enable all for users based on user_id" ON public.canais;
DROP POLICY IF EXISTS "Users can manage their own channels" ON public.canais;
CREATE POLICY "Team access for canais"
ON public.canais
FOR ALL
USING ( public.is_team_member(user_id, 'kanban') )
WITH CHECK ( public.is_team_member(user_id, 'kanban') );

-- Table: prompts
DROP POLICY IF EXISTS "Enable all for users based on user_id" ON public.prompts;
DROP POLICY IF EXISTS "Users can manage their own prompts" ON public.prompts;
CREATE POLICY "Team access for prompts"
ON public.prompts
FOR ALL
USING ( public.is_team_member(user_id) )
WITH CHECK ( public.is_team_member(user_id) );
