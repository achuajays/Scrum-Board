/*
  # Add Comment Features

  1. Schema Changes
    - Add `image_url` column to comments table for optional image attachments
    - Add `updated_at` column to comments table for edit tracking

  2. Security
    - Maintain existing RLS policies
*/

-- Add image_url column to comments table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'comments' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE comments ADD COLUMN image_url text;
  END IF;
END $$;

-- Add updated_at column to comments table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'comments' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE comments ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;