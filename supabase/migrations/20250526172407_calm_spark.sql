/*
  # Create projects and categories tables

  1. New Tables
    - `projects`
      - `id` (uuid, primary key)
      - `title` (varchar, required)
      - `description` (text, required)
      - `status` (varchar, default 'Aktif')
      - `image_url` (text, optional)
      - `project_url` (text, optional)
      - `slug` (varchar, required)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `categories` (jsonb, array of strings)
    
    - `categories`
      - `id` (uuid, primary key)
      - `name` (varchar, required)
      - `description` (text, optional)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage data
*/

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title varchar NOT NULL,
  description text NOT NULL,
  status varchar NOT NULL DEFAULT 'Aktif',
  image_url text,
  project_url text,
  slug varchar NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  categories jsonb DEFAULT '[]'::jsonb
);

-- Create categories table for reference
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text
);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users (admin)
CREATE POLICY "Authenticated users can perform all operations on projects"
  ON projects
  FOR ALL
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can perform all operations on categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (true);

-- Create policy for anonymous users (read-only)
CREATE POLICY "Anonymous users can read projects"
  ON projects
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can read categories"
  ON categories
  FOR SELECT
  TO anon
  USING (true);

-- Add initial categories
INSERT INTO categories (name) 
VALUES 
  ('AI & Data'),
  ('Airdrop'),
  ('Alpha Project'),
  ('DeFi'),
  ('Early-Access'),
  ('Gaming & Metaverse'),
  ('Identity'),
  ('Infra'),
  ('Privacy & Security'),
  ('Social'),
  ('Tooling'),
  ('Wallet')
ON CONFLICT (name) DO NOTHING;