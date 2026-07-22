-- Run this in Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)
-- This creates the resources table and RLS policies needed for the Resources page.

CREATE TABLE IF NOT EXISTS resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  description TEXT DEFAULT '',
  type TEXT DEFAULT 'pdf',
  category TEXT DEFAULT 'Computer Science',
  premium BOOLEAN DEFAULT false,
  downloads TEXT DEFAULT '0',
  url TEXT DEFAULT '',
  class_level TEXT DEFAULT 'General',
  course_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read resources (public page)
DROP POLICY IF EXISTS "Resources are publicly readable" ON resources;
CREATE POLICY "Resources are publicly readable" ON resources
  FOR SELECT USING (true);

-- Allow authenticated users to insert resources (teachers/admins)
DROP POLICY IF EXISTS "Authenticated users can insert resources" ON resources;
CREATE POLICY "Authenticated users can insert resources" ON resources
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow resource owner or admins to update
DROP POLICY IF EXISTS "Owners can update resources" ON resources;
CREATE POLICY "Owners can update resources" ON resources
  FOR UPDATE USING (true);

-- Allow resource owner or admins to delete
DROP POLICY IF EXISTS "Owners can delete resources" ON resources;
CREATE POLICY "Owners can delete resources" ON resources
  FOR DELETE USING (true);
