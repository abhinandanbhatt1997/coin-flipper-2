#!/bin/bash

# === CONFIG ===
PROJECT_REF="kflzyfonuzdvmnztdojt"
PROJECT_URL="https://$PROJECT_REF.supabase.co"
DB_URL="postgresql://postgres:postgres@$PROJECT_REF.supabase.co:6543/postgres"
ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

echo "=== Linking Project ==="
npx supabase link --project-ref $PROJECT_REF

echo "=== Dropping old users table (if exists) ==="
npx supabase db remote commit "drop_users" --db-url "$DB_URL" --sql "DROP TABLE IF EXISTS public.users CASCADE;"

echo "=== Pushing schema (games, participants, transactions) ==="
npx supabase db push

echo "=== Creating test auth users ==="
for i in 1 2 3 4 5; do
  curl -s -X POST "$PROJECT_URL/auth/v1/signup" \
    -H "apikey: $ANON_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"test$i@example.com\",\"password\":\"pass1234\"}" > /dev/null
done

echo "=== Creating users table linked to auth.users ==="
npx supabase db remote commit "create_users" --db-url "$DB_URL" --sql "
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  phone text,
  wallet_balance numeric DEFAULT 1000 CHECK (wallet_balance >= 0),
  created_at timestamptz DEFAULT now()
);
INSERT INTO public.users (id, email, wallet_balance)
SELECT id, email, 1000 FROM auth.users ON CONFLICT (id) DO NOTHING;
"

echo "=== Seeding a test game ==="
npx supabase db remote commit "seed_game" --db-url "$DB_URL" --sql "
INSERT INTO games (status, entry_fee, max_players, current_players)
VALUES ('waiting', 100, 10, 0)
ON CONFLICT DO NOTHING;
"

echo "=== DONE ==="
echo "Log in with test users (test1@example.com ... test5@example.com, password: pass1234)"
