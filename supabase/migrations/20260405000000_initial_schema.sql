-- NEXORA - Initial Schema Migration

-- 1. Profiles (linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  logo TEXT,
  primary_color TEXT DEFAULT '#FF2D55',
  secondary_color TEXT DEFAULT '#7000FF',
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'premium')),
  subscription_status TEXT DEFAULT 'ativo' CHECK (subscription_status IN ('ativo', 'cancelado', 'atrasado')),
  billing_cycle TEXT DEFAULT 'mensal',
  last_reset_date TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  pix_data JSONB -- { keyType, key, beneficiary, city }
);

-- 2. Clients
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Budgets
CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY, -- Using the short ID format from the app
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  professional_name TEXT,
  professional_phone TEXT,
  professional_logo TEXT,
  items JSONB NOT NULL, -- Array of { id, name, quantity, price }
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'Pendente' CHECK (status IN ('Pendente', 'Aprovado', 'Recusado')),
  date DATE DEFAULT CURRENT_DATE,
  expiry DATE,
  observations TEXT,
  pix_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Usage Logs
CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity TEXT NOT NULL,
  feature TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'blocked')),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- RLS POLICIES (Row Level Security)

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only see and update their own profile
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Clients: Users can only manage their own clients
CREATE POLICY "Users can manage own clients" ON clients FOR ALL USING (auth.uid() = user_id);

-- Budgets: Users can manage their own budgets, but anyone can view a budget by ID (for public links)
CREATE POLICY "Users can manage own budgets" ON budgets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Public can view budgets by ID" ON budgets FOR SELECT USING (true);

-- Usage Logs: Users can only manage their own logs
CREATE POLICY "Users can manage own logs" ON usage_logs FOR ALL USING (auth.uid() = user_id);

-- FUNCTIONS & TRIGGERS

-- Automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (new.id, new.raw_user_meta_data->>'name', new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
