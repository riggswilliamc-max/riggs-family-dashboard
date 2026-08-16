# Riggs Family Dashboard

A real-time, collaborative family coordination app built with React and Firebase. Stay organized together with shared tasks, chores, shopping lists, notes, and more.

## Features ✨

- **🏠 Home Dashboard** — At-a-glance view of tasks, chores, shopping items, and upcoming deadlines
- **✓ Tasks** — Create tasks with due dates, mark complete, see who added what
- **🧹 Chore Chart** — Assign chores to family members, track completion
- **🛒 Shopping List** — Shared shopping list with check-off tracking
- **📝 Notes** — Family notes for quick communication
- **📅 Calendar** — Google Calendar integration (coming soon)
- **🌤️ Weather** — Jacksonville weather widget on home dashboard
- **📸 Photo Slideshow** — Google Photos integration (coming soon)
- **🔒 Secure** — Gmail login only, encrypted data storage
- **⚡ Real-time** — All changes sync instantly across devices

## Tech Stack

- **React 18** — UI framework
- **Firebase** — Authentication, real-time database (Firestore)
- **Tailwind CSS** — Styling
- **Vite** — Lightning-fast build tool

## Project Structure

```
riggs-family-dashboard/
├── src/
│   ├── App.jsx           # Main dashboard component
│   └── main.jsx          # React entry point
├── index.html            # HTML entry point
├── package.json          # Dependencies
├── vite.config.js        # Build configuration
├── DEPLOYMENT_GUIDE.md   # Step-by-step deployment
└── README.md            # This file
```

## Quick Start (Local Development)

### Prerequisites
- Node.js 16+ installed
- npm or yarn

### Steps
```bash
# 1. Navigate to project directory
cd riggs-family-dashboard

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# 4. Open in browser
# http://localhost:5173
```

## Deployment to Vercel

**See `DEPLOYMENT_GUIDE.md` for complete step-by-step instructions.**

Quick summary:
1. Create GitHub repository
2. Deploy to Vercel (1-click)
3. Point domain `riggs-family-dashboard.com` to Vercel
4. Done! Accessible at `riggs-family-dashboard.com`

## Firebase Configuration

The app is pre-configured with your Firebase credentials:
- Project: `riggs-family-dashboard`
- Auth: Google Sign-In enabled
- Database: Firestore (real-time sync)

### Collections in Firestore
- `tasks` — Shared tasks with due dates
- `chores` — Household chores assigned to family members
- `shopping` — Shopping list items
- `notes` — Family notes

## Usage

### Login
1. Go to the app
2. Click **Login with Google**
3. Sign in with your Gmail account
4. Dashboard loads with real-time family data

### Adding Items
- **Tasks** — Type task, set due date, click Add
- **Chores** — Type chore, assign to family member, set due date
- **Shopping** — Type item, click Add
- **Notes** — Type message, click Add Note

### Checking Off Items
- Click the circle (○) to mark as complete (✓)
- Click again to unmark

### Deleting Items
- Click the trash icon (🗑️)

## Security & Privacy

- All data encrypted in transit and at rest
- Only logged-in family members can access data
- No data is shared with third parties
- Google Sign-In handles authentication securely

## Cost

- **Domain:** ~$12/year (Network Solutions)
- **Hosting:** Free (Vercel)
- **Database:** Free tier (Firebase) — covers typical family usage
- **Total:** ~$12/year

## Troubleshooting

**Login not working?**
- Verify you're using a Gmail account
- Check that Google Sign-In is enabled in Firebase

**Data not syncing?**
- Refresh the page
- Check browser console for errors (F12)
- Verify you're in Firestore Test mode

**Domain not loading?**
- DNS changes take 5-30 minutes to propagate
- Use the Vercel URL in the meantime: `riggs-family-dashboard.vercel.app`

For more issues, see `DEPLOYMENT_GUIDE.md`.

## Future Enhancements

- Google Calendar API integration (show shared family calendar)
- Google Photos integration (real photo slideshow)
- Weather API integration (live weather data)
- Notifications for due items
- Mobile app versions
- Meal planning integration

## Support

For questions or issues:
1. Check the browser console (F12 → Console)
2. Review `DEPLOYMENT_GUIDE.md`
3. Check Firebase console for errors

---

Built with ❤️ for the Riggs family. Ready to keep your family organized and connected!
