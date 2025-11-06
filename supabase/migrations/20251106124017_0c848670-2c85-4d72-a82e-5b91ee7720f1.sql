-- Allow anonymous users to view system templates
CREATE POLICY "Anonymous users can view system templates"
  ON public.templates FOR SELECT
  TO anon
  USING (is_system = true);