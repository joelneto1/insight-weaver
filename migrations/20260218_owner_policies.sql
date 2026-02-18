-- Add explicit owner access policies to bypass function checks for own data
-- This ensures that owners can always access their own data regardless of team logic complexity

-- Videos
DROP POLICY IF EXISTS "Owner direct access videos" ON videos;
CREATE POLICY "Owner direct access videos" ON videos
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Kanban Columns
DROP POLICY IF EXISTS "Owner direct access kanban_columns" ON kanban_columns;
CREATE POLICY "Owner direct access kanban_columns" ON kanban_columns
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Canais
DROP POLICY IF EXISTS "Owner direct access canais" ON canais;
CREATE POLICY "Owner direct access canais" ON canais
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Financeiro
DROP POLICY IF EXISTS "Owner direct access financeiro" ON financeiro;
CREATE POLICY "Owner direct access financeiro" ON financeiro
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Contas
DROP POLICY IF EXISTS "Owner direct access contas" ON contas;
CREATE POLICY "Owner direct access contas" ON contas
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Prompts
DROP POLICY IF EXISTS "Owner direct access prompts" ON prompts;
CREATE POLICY "Owner direct access prompts" ON prompts
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
