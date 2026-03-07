-- Families table with unique invite codes
CREATE TABLE IF NOT EXISTS public.families (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  family_code TEXT UNIQUE NOT NULL DEFAULT UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)),
  cover_image_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Family members junction table
CREATE TABLE IF NOT EXISTS public.family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'editor', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(family_id, user_id)
);

-- RLS for families
ALTER TABLE public.families ENABLE ROW LEVEL SECURITY;

-- Users can view families they belong to
CREATE POLICY "families_select" ON public.families 
  FOR SELECT USING (
    id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid())
  );

-- Authenticated users can create families
CREATE POLICY "families_insert" ON public.families 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Only admins can update family settings
CREATE POLICY "families_update" ON public.families 
  FOR UPDATE USING (
    id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid() AND role = 'admin')
  );

-- RLS for family_members
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;

-- Users can view members of families they belong to
CREATE POLICY "family_members_select" ON public.family_members 
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM public.family_members fm WHERE fm.user_id = auth.uid())
  );

-- Authenticated users can join families (insert themselves)
CREATE POLICY "family_members_insert" ON public.family_members 
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Users can leave families, admins can remove members
CREATE POLICY "family_members_delete" ON public.family_members 
  FOR DELETE USING (
    user_id = auth.uid() 
    OR family_id IN (SELECT family_id FROM public.family_members fm WHERE fm.user_id = auth.uid() AND fm.role = 'admin')
  );
