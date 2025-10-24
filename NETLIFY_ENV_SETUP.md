# Netlify Environment Variables Setup

## Critical: Supabase Credentials Missing on Netlify

The 406 error on your deployed site is because Netlify doesn't have the Supabase environment variables configured.

## Steps to Fix:

### 1. Go to Netlify Dashboard
1. Visit https://app.netlify.com
2. Select your Word Bomb project
3. Go to **Site settings** → **Environment variables**

### 2. Add These Environment Variables

Click "Add a variable" and add each of these:

**Variable 1:**
- **Key:** `REACT_APP_SUPABASE_URL`
- **Value:** `https://vpyynbrldnatefsjqpjr.supabase.co`
- **Scopes:** Check all (Production, Deploy Previews, Branch deploys)

**Variable 2:**
- **Key:** `REACT_APP_SUPABASE_ANON_KEY`
- **Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZweXluYnJsZG5hdGVmc2pxcGpyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzMDI5NzUsImV4cCI6MjA3Njg3ODk3NX0.1LLdlUkycXZqbVICqAZW42HK5bnAj-z2WHGMq3IADy0`
- **Scopes:** Check all (Production, Deploy Previews, Branch deploys)

### 3. Trigger a Redeploy

After adding the environment variables:

**Option A: Trigger redeploy from Netlify**
1. Go to **Deploys** tab
2. Click **Trigger deploy** → **Deploy site**

**Option B: Push a small change**
```bash
git commit --allow-empty -m "Trigger Netlify redeploy with env vars"
git push origin main
```

### 4. Verify the Fix

Once redeployed:
1. Open your deployed site
2. Open browser DevTools (F12) → Console
3. You should see: `Dictionary loaded: 370105 words`
4. You should NOT see any 406 errors
5. Try joining a game - the joiner should appear in the lobby

## Why This Happened

- `.env.local` files are NOT committed to Git (they're in `.gitignore`)
- Netlify builds from Git, so it doesn't have access to your local `.env.local`
- Environment variables must be configured separately in Netlify's dashboard
- Without these variables, the Supabase client can't connect, causing 406 errors

## Security Note

The Supabase anon key is safe to expose publicly because:
- It's protected by Row Level Security (RLS) policies
- It only allows operations permitted by your RLS policies
- This is the intended way to use Supabase in client-side applications
