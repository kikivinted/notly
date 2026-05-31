-- Make creator_id nullable for open video model
ALTER TABLE public.videos ALTER COLUMN creator_id DROP NOT NULL;

-- Add youtube_channels table for unclaimed channels
CREATE TABLE IF NOT EXISTS public.youtube_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  youtube_channel_id TEXT UNIQUE NOT NULL,
  channel_name TEXT NOT NULL,
  channel_thumbnail TEXT,
  subscriber_count INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.youtube_channels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Channels are publicly viewable" ON public.youtube_channels FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert channels" ON public.youtube_channels FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update channels" ON public.youtube_channels FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Add youtube_channel_ref to videos for unclaimed videos
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS youtube_channel_id TEXT;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS channel_name TEXT;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS channel_thumbnail TEXT;

-- Drop creator subscription requirement from creators table
ALTER TABLE public.creators ALTER COLUMN is_active SET DEFAULT true;

-- Update video insert policy
DROP POLICY IF EXISTS "Creators can insert their videos" ON public.videos;
CREATE POLICY "Anyone authenticated can insert videos" ON public.videos
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Also allow anonymous viewing
DROP POLICY IF EXISTS "Videos are publicly viewable" ON public.videos;
CREATE POLICY "Videos are publicly viewable" ON public.videos FOR SELECT USING (true);
