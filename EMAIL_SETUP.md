# Wishly Email Setup Guide - Static Hosting Friendly! 🚀

## 🎯 Best Options for Static Hosting

You have **3 great options** that work perfectly with GitHub Pages + additional services:

---

## Option 1: **Supabase Edge Functions** (RECOMMENDED) ⭐

Since you're already using Supabase, this is the easiest!

### Setup Steps:

1. **Install Supabase CLI:**

   ```bash
   npm install -g supabase
   ```

2. **Deploy the email function:**

   ```bash
   # From your project root
   npx supabase functions deploy send-invitation
   ```

3. **Set environment variables in Supabase Dashboard:**

   - Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/functions
   - Add environment variable: `RESEND_API_KEY=your_resend_key`

4. **Get a free Resend account:**

   - Sign up at: https://resend.com (free tier: 3,000 emails/month)
   - Get your API key
   - Add it to Supabase environment variables

5. **Done!** Your app will now send emails via Supabase functions

### Hosting Options:

- ✅ **GitHub Pages** + Supabase functions
- ✅ **Vercel** (free tier)
- ✅ **Netlify** (free tier)
- ✅ Any static hosting

---

## Option 2: **Vercel Serverless Functions**

Great if you want to deploy everything in one place:

1. **Push your code to GitHub**
2. **Connect to Vercel** (free account at vercel.com)
3. **Set environment variables** in Vercel dashboard:
   - `SMTP_USER=your-gmail@gmail.com`
   - `SMTP_PASS=your-app-password`
4. **Deploy!** Vercel automatically detects the `/api` folder

### Benefits:

- Free hosting for your entire app
- Automatic deployments from GitHub
- Built-in environment variable management

---

## Option 3: **Netlify Functions**

Similar to Vercel:

1. **Connect repository to Netlify**
2. **Add environment variables**
3. **Deploy**

---

## 🏆 **Recommendation: Use Supabase Functions**

### Why Supabase Functions are perfect:

✅ **Already integrated** - You're using Supabase  
✅ **No extra setup** - Functions are part of your existing stack  
✅ **Free tier** - Generous limits  
✅ **Any hosting works** - GitHub Pages, Vercel, Netlify, anywhere  
✅ **Built-in auth** - Integrates with your Supabase auth  
✅ **Simple deployment** - One command: `supabase functions deploy`

### Quick Start with Supabase:

```bash
# 1. Deploy the email function (already created for you!)
npx supabase functions deploy send-invitation

# 2. Add your Resend API key in Supabase dashboard
# 3. That's it! Your app now sends emails
```

### Hosting your app:

**GitHub Pages:**

```bash
npm run build
# Upload dist/ folder to GitHub Pages
```

**Vercel (easiest):**

```bash
# Just connect your GitHub repo to Vercel - done!
```

---

## 🛠️ What I've Set Up For You:

1. **Supabase Edge Function** (`/supabase/functions/send-invitation/`)
2. **Updated EmailService** to use Supabase functions
3. **Vercel config** (`/api/send-invitation.js`) as backup option
4. **Beautiful email templates** with Wishly branding

---

## 🚀 Deploy Now:

### For Supabase Functions (Recommended):

```bash
# Deploy email function
npx supabase functions deploy send-invitation

# Build your app
npm run build

# Deploy to GitHub Pages, Vercel, or Netlify
```

### For Vercel (All-in-one):

1. Push to GitHub
2. Connect repo to Vercel
3. Add environment variables
4. Deploy!

---

## 📧 Email Features:

- 🎨 **Beautiful Wishly branding**
- 📱 **Mobile-friendly design**
- ✨ **Personalized invitations**
- ⏰ **7-day expiration notices**
- 🔒 **Secure token-based links**

Your friends and family will love the professional invitation emails! 🎁✨

---

## 🔧 No More Complex Server Management!

Gone are the days of:

- ❌ Managing separate Node.js servers
- ❌ Docker containers
- ❌ Complex hosting setups
- ❌ Port management

Now you have:

- ✅ Serverless functions that scale automatically
- ✅ Deploy anywhere static hosting works
- ✅ One-command deployment
- ✅ Professional email delivery

**Your Wishly app is now ready for friends and family!** 🎉
