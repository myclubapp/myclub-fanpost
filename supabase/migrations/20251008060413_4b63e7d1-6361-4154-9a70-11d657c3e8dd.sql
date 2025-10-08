-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('free_user', 'paid_user', 'admin');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'free_user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- User roles policies
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create templates table for paid users
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  template_type TEXT NOT NULL CHECK (template_type IN ('game-preview', 'game-result')),
  svg_config JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS on templates
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Templates policies
CREATE POLICY "Paid users can view their own templates"
  ON public.templates FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id AND 
    public.has_role(auth.uid(), 'paid_user')
  );

CREATE POLICY "Paid users can create templates"
  ON public.templates FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND 
    public.has_role(auth.uid(), 'paid_user')
  );

CREATE POLICY "Paid users can update their own templates"
  ON public.templates FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id AND 
    public.has_role(auth.uid(), 'paid_user')
  );

CREATE POLICY "Paid users can delete their own templates"
  ON public.templates FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id AND 
    public.has_role(auth.uid(), 'paid_user')
  );

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert profile
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  
  -- Assign free_user role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (new.id, 'free_user');
  
  RETURN new;
END;
$$;

-- Trigger to create profile and assign role on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();