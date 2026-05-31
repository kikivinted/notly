-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('viewer', 'creator', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Creators table
CREATE TABLE IF NOT EXISTS public.creators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  youtube_channel_id TEXT UNIQUE NOT NULL,
  channel_name TEXT NOT NULL,
  channel_thumbnail TEXT,
  subscriber_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT false,
  subscription_status TEXT CHECK (subscription_status IN ('active', 'cancelled', 'past_due', 'trialing')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Videos table
CREATE TABLE IF NOT EXISTS public.videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID REFERENCES public.creators(id) ON DELETE SET NULL,
  youtube_video_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT NOT NULL,
  duration TEXT,
  published_at TIMESTAMPTZ NOT NULL,
  view_count INTEGER NOT NULL DEFAULT 0,
  avg_rating NUMERIC(3, 2) NOT NULL DEFAULT 0,
  total_votes INTEGER NOT NULL DEFAULT 0,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ratings table
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, video_id)
);

-- Monthly top charts
CREATE TABLE IF NOT EXISTS public.monthly_tops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
  period TEXT NOT NULL, -- YYYY-MM
  rank INTEGER NOT NULL,
  avg_rating NUMERIC(3, 2) NOT NULL,
  total_votes INTEGER NOT NULL,
  UNIQUE(video_id, period)
);

-- Semester top charts
CREATE TABLE IF NOT EXISTS public.semester_tops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
  period TEXT NOT NULL, -- YYYY-S1 or YYYY-S2
  rank INTEGER NOT NULL,
  avg_rating NUMERIC(3, 2) NOT NULL,
  total_votes INTEGER NOT NULL,
  UNIQUE(video_id, period)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_videos_creator_id ON public.videos(creator_id);
CREATE INDEX IF NOT EXISTS idx_videos_avg_rating ON public.videos(avg_rating DESC);
CREATE INDEX IF NOT EXISTS idx_videos_total_votes ON public.videos(total_votes DESC);
CREATE INDEX IF NOT EXISTS idx_videos_published_at ON public.videos(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_videos_title_trgm ON public.videos USING GIN (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON public.ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_video_id ON public.ratings(video_id);
CREATE INDEX IF NOT EXISTS idx_monthly_tops_period ON public.monthly_tops(period, rank);
CREATE INDEX IF NOT EXISTS idx_semester_tops_period ON public.semester_tops(period, rank);
CREATE INDEX IF NOT EXISTS idx_creators_channel_name_trgm ON public.creators USING GIN (channel_name gin_trgm_ops);

-- Function to update video avg_rating and total_votes when a rating changes
CREATE OR REPLACE FUNCTION update_video_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.videos
  SET
    avg_rating = (
      SELECT COALESCE(AVG(score::NUMERIC), 0)
      FROM public.ratings
      WHERE video_id = COALESCE(NEW.video_id, OLD.video_id)
    ),
    total_votes = (
      SELECT COUNT(*)
      FROM public.ratings
      WHERE video_id = COALESCE(NEW.video_id, OLD.video_id)
    )
  WHERE id = COALESCE(NEW.video_id, OLD.video_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for rating updates
CREATE TRIGGER on_rating_insert
  AFTER INSERT ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION update_video_rating();

CREATE TRIGGER on_rating_update
  AFTER UPDATE ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION update_video_rating();

CREATE TRIGGER on_rating_delete
  AFTER DELETE ON public.ratings
  FOR EACH ROW EXECUTE FUNCTION update_video_rating();

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, username, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      SPLIT_PART(NEW.email, '@', 1) || '_' || SUBSTRING(NEW.id::TEXT, 1, 8)
    ),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_tops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semester_tops ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- Creators policies
CREATE POLICY "Creators are publicly viewable" ON public.creators FOR SELECT USING (true);
CREATE POLICY "Creators can update own record" ON public.creators FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Authenticated users can insert creator" ON public.creators FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Videos policies
CREATE POLICY "Videos are publicly viewable" ON public.videos FOR SELECT USING (true);
CREATE POLICY "Anyone authenticated can insert videos" ON public.videos
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Creators can update their videos" ON public.videos
  FOR UPDATE USING (
    creator_id IN (SELECT id FROM public.creators WHERE user_id = auth.uid())
  );

-- Ratings policies
CREATE POLICY "Ratings are publicly viewable" ON public.ratings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can rate" ON public.ratings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ratings" ON public.ratings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ratings" ON public.ratings
  FOR DELETE USING (auth.uid() = user_id);

-- Top charts policies
CREATE POLICY "Monthly tops are publicly viewable" ON public.monthly_tops FOR SELECT USING (true);
CREATE POLICY "Semester tops are publicly viewable" ON public.semester_tops FOR SELECT USING (true);

-- Function to compute top charts
CREATE OR REPLACE FUNCTION compute_monthly_tops(p_period TEXT DEFAULT TO_CHAR(NOW(), 'YYYY-MM'))
RETURNS void AS $$
BEGIN
  DELETE FROM public.monthly_tops WHERE period = p_period;

  INSERT INTO public.monthly_tops (video_id, period, rank, avg_rating, total_votes)
  SELECT
    v.id,
    p_period,
    ROW_NUMBER() OVER (ORDER BY (v.avg_rating * 0.6 + LOG(GREATEST(v.total_votes, 1) + 1) * 0.3) DESC),
    v.avg_rating,
    v.total_votes
  FROM public.videos v
  JOIN public.creators c ON c.id = v.creator_id
  WHERE c.is_active = true
    AND v.total_votes >= 1
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION compute_semester_tops(p_period TEXT DEFAULT
  CASE
    WHEN EXTRACT(MONTH FROM NOW()) <= 6 THEN TO_CHAR(NOW(), 'YYYY') || '-S1'
    ELSE TO_CHAR(NOW(), 'YYYY') || '-S2'
  END
)
RETURNS void AS $$
DECLARE
  period_start TIMESTAMPTZ;
BEGIN
  IF p_period LIKE '%-S1' THEN
    period_start := (SPLIT_PART(p_period, '-', 1) || '-01-01')::TIMESTAMPTZ;
  ELSE
    period_start := (SPLIT_PART(p_period, '-', 1) || '-07-01')::TIMESTAMPTZ;
  END IF;

  DELETE FROM public.semester_tops WHERE period = p_period;

  INSERT INTO public.semester_tops (video_id, period, rank, avg_rating, total_votes)
  SELECT
    v.id,
    p_period,
    ROW_NUMBER() OVER (ORDER BY (v.avg_rating * 0.6 + LOG(GREATEST(v.total_votes, 1) + 1) * 0.3) DESC),
    v.avg_rating,
    v.total_votes
  FROM public.videos v
  JOIN public.creators c ON c.id = v.creator_id
  WHERE c.is_active = true
    AND v.total_votes >= 1
    AND v.published_at >= period_start
  LIMIT 50;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
