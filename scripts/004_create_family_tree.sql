-- Family tree members (can include non-users like deceased relatives)
CREATE TABLE IF NOT EXISTS public.tree_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
  linked_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  birth_date DATE,
  death_date DATE,
  birth_place TEXT,
  location TEXT,
  bio TEXT,
  avatar_url TEXT,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', NULL)),
  -- Node position for React Flow
  position_x FLOAT DEFAULT 0,
  position_y FLOAT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Relationships between tree members
CREATE TABLE IF NOT EXISTS public.tree_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
  from_member_id UUID REFERENCES public.tree_members(id) ON DELETE CASCADE,
  to_member_id UUID REFERENCES public.tree_members(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL CHECK (relationship_type IN ('parent', 'spouse', 'sibling')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(from_member_id, to_member_id, relationship_type)
);

-- RLS for tree_members
ALTER TABLE public.tree_members ENABLE ROW LEVEL SECURITY;

-- Users can view tree members of families they belong to
CREATE POLICY "tree_members_select" ON public.tree_members 
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid())
  );

-- Family members can add tree members
CREATE POLICY "tree_members_insert" ON public.tree_members 
  FOR INSERT WITH CHECK (
    family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid())
  );

-- Family members can update tree members
CREATE POLICY "tree_members_update" ON public.tree_members 
  FOR UPDATE USING (
    family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid())
  );

-- Admins and editors can delete tree members
CREATE POLICY "tree_members_delete" ON public.tree_members 
  FOR DELETE USING (
    family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid() AND role IN ('admin', 'editor'))
  );

-- RLS for tree_relationships
ALTER TABLE public.tree_relationships ENABLE ROW LEVEL SECURITY;

-- Users can view relationships of families they belong to
CREATE POLICY "tree_relationships_select" ON public.tree_relationships 
  FOR SELECT USING (
    family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid())
  );

-- Family members can add relationships
CREATE POLICY "tree_relationships_insert" ON public.tree_relationships 
  FOR INSERT WITH CHECK (
    family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid())
  );

-- Admins and editors can delete relationships
CREATE POLICY "tree_relationships_delete" ON public.tree_relationships 
  FOR DELETE USING (
    family_id IN (SELECT family_id FROM public.family_members WHERE user_id = auth.uid() AND role IN ('admin', 'editor'))
  );
