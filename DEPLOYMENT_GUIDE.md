# Riggs Family Dashboard - Deployment Guide

Your React app with Firebase is ready to deploy. Here's the exact step-by-step process:

---

## **STEP 1: Create GitHub Repository (2 min)**

### Option A: If you have GitHub
1. Go to https://github.com/new
2. Repository name: `riggs-family-dashboard`
3. Description: "Family coordination dashboard"
4. Choose **Public** or **Private** (your preference)
5. Click **Create repository**
6. Follow GitHub's instructions to push code (they'll give you the commands)

### Option B: Quick Clone & Push
If you just created a repo, GitHub will show you commands. Run these in your terminal:
```bash
cd /path/to/riggs-dashboard-app
git init
git add .
git commit -m "Initial commit: Riggs Family Dashboard"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/riggs-family-dashboard.git
git push -u origin main
```

---

## **STEP 2: Deploy to Vercel (2 min)**

1. Go to https://vercel.com/new
2. Sign in with your Gmail (same account you used to create Vercel)
3. Click **Import Project**
4. Choose **Import Git Repository**
5. Paste your GitHub repo URL: `https://github.com/YOUR_USERNAME/riggs-family-dashboard`
6. Click **Continue**
7. **Leave all settings as default** (Vercel auto-detects Vite)
8. Click **Deploy**
9. **Wait ~2 min** for deployment to finish

Once deployed, Vercel will give you a URL like: `riggs-family-dashboard.vercel.app`

---

## **STEP 3: Point Your Domain (3 min)**

Go to **Network Solutions** where you registered `riggs-family-dashboard.com`:

1. Login to your Network Solutions account
2. Go to **Manage Domains** → Select `riggs-family-dashboard.com`
3. Click **Manage DNS** (or **DNS Manager**)
4. Look for **Nameservers**
5. Change nameservers to Vercel's:
   - Nameserver 1: `ns1.vercel-dns.com`
   - Nameserver 2: `ns2.vercel-dns.com`
6. **Save** changes

**Note:** DNS changes take 5-30 min to propagate. Go back to Vercel and add your domain:

### In Vercel:
1. Go to your project dashboard
2. Click **Settings** → **Domains**
3. Add domain: `riggs-family-dashboard.com`
4. Vercel will verify it automatically (after DNS propagates)

---

## **STEP 4: Test It Live (5 min)**

1. Go to `riggs-family-dashboard.com` in your browser
2. You should see the login screen
3. Click **Login with Google** → Sign in with your Gmail
4. You should be logged in and see the dashboard
5. **Text Jessica & Lucas** — have them go to the same URL and log in with their Gmail accounts
6. **Add a task as yourself**, then log out and log back in as Jessica — you should see the task sync in real-time

---

## **Troubleshooting**

### Domain not working yet
- DNS propagation takes 5-30 minutes
- In the meantime, use the Vercel URL: `riggs-family-dashboard.vercel.app`
- Check Vercel dashboard to confirm domain is added

### Login not working
- Make sure Jessica & Lucas have their Gmail accounts
- Verify Firebase Google Sign-In is enabled (you did this earlier)
- Check browser console for errors (F12 → Console)

### Data not syncing
- Make sure all 3 of you are logged into the **same** Firebase project
- Check that Firestore database is in **Test mode** (allows reads/writes)
- Refresh the page

### "npm install" issues
- Make sure you have Node.js 16+ installed
- Delete `node_modules/` and `package-lock.json`, then run `npm install` again

---

## **What's Next**

Once it's live and working:
- Jessica & Lucas can access it anytime from any device
- Data syncs in real-time across all 3 devices
- No passwords to manage (uses Gmail login)
- Costs: **~$12/year** (just the domain)

Enjoy! 🎉
