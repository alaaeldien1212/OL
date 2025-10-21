# 📚 المكتبة الإلكترونية للقصص - Electronic Story Library

A modern, beautiful, and interactive Arabic story library web app designed for kids (ages 7-11) with teachers and admin support. Built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## 🌟 Features

### For Students
- 📖 **Interactive Story Reading** - Beautiful, full-screen story reading experience
- 🗺️ **Story Map Journey** - Progressive unlocking of stories based on completion
- ✏️ **Form Submission** - Complete analysis forms after reading
- 🏆 **Achievement System** - Earn titles and badges for milestones
- 📊 **Personal Dashboard** - Track reading progress and statistics
- 👑 **Leaderboard** - Compare progress with classmates
- 🎨 **Colorful UI** - Kid-friendly interface with animations

### For Teachers
- 👥 **Student Management** - Create and manage student access codes
- 📝 **Story Creation** - Write and publish new stories
- 📋 **Form Builder** - Create analysis forms with different question types
- ✍️ **Grading System** - Grade student submissions with feedback
- 📊 **Analytics** - Track class progress and engagement
- 🎯 **Journey Setup** - Create story progression paths

### For Admin
- 🔧 **System Management** - Manage teachers and permissions
- 📊 **Cross-Grade Analytics** - System-wide analytics and reporting
- 🔐 **Permission Control** - Granular permission management
- 👀 **Activity Monitoring** - Track all user activities
- ⚙️ **Settings** - Configure system-wide settings

## 🎨 Design

- **Color Palette**: Sky Blue, Sunshine Yellow, Fresh Green, Coral Red
- **Fonts**: Arabic-optimized Tajawal and Cairo fonts
- **RTL Support**: Full right-to-left language support
- **Animations**: Smooth, kid-friendly animations with Framer Motion
- **Responsive**: Works seamlessly on desktop, tablet, and mobile
- **Accessibility**: WCAG compliant with high contrast and large touch targets

## 🚀 Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Authentication**: Custom access code system
- **UI Components**: Custom built with CVA (Class Variance Authority)

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Git

### Setup Steps

1. **Clone the repository**
   ```bash
   cd /Users/staynza/Documents/OL
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   Create a `.env.local` file in the project root:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   NEXT_PUBLIC_APP_NAME=المكتبة الإلكترونية للقصص
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎯 Testing

### Test Access Codes
The database is pre-seeded with test accounts:

**Admin**
- Code: `ADMIN2025`
- Permissions: Full system control

**Teachers**
- Grade 3: `TEACH3A2025`
- Grade 4: `TEACH4A2025`
- Grade 6: `TEACH6A2025`

**Students**
- Use any generated code from teacher dashboard
- First-time login requires name registration

## 📁 Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Login page
│   ├── layout.tsx         # Root layout with fonts
│   ├── globals.css        # Global styles
│   ├── student/           # Student routes
│   │   ├── page.tsx       # Dashboard
│   │   ├── profile/       # Student profile
│   │   └── read/          # Story reading
│   ├── teacher/           # Teacher routes
│   └── admin/             # Admin routes
├── components/            # Reusable components
│   ├── Button.tsx         # Button component
│   ├── Card.tsx           # Card component
│   ├── StoryCard.tsx      # Story card
│   └── AnimatedBackground.tsx  # Animated bg
├── lib/
│   ├── supabase.ts        # Supabase client & services
│   ├── store.ts           # Zustand store
│   └── utils.ts           # Utility functions
└── types/                 # TypeScript types
    └── index.ts
```

## 🔧 Building & Deployment

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Deploy to Vercel
1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy automatically on push

## 📊 Database Schema

See `DATABASE_SCHEMA.md` for complete schema documentation.

Key tables:
- `students` - Student accounts and progress
- `teachers` - Teacher accounts with grade assignments
- `admins` - Admin accounts
- `stories` - Arabic story content
- `form_templates` - Analysis forms
- `student_submissions` - Form submissions and grades
- `leaderboard_cache` - Real-time rankings
- `activity_logs` - Audit trail

## 🔒 Security

- **Row Level Security (RLS)** - Enabled on all tables
- **Access Code Authentication** - Secure access code login
- **Role-Based Access** - Admin, Teacher, Student roles
- **Activity Logging** - All actions logged for audit

## 🌐 Internationalization

- Full Arabic support with RTL layout
- Arabic fonts (Tajawal, Cairo)
- Arabic typography optimizations
- Bilingual-ready structure for future expansion

## 📝 Development Guidelines

### Creating New Pages
1. Create files in `src/app/[role]/` directory
2. Use `'use client'` directive for client components
3. Import components from `@/components`
4. Use RTL with `dir="rtl"` attribute
5. Follow naming conventions (camelCase for functions, PascalCase for components)

### Creating New Components
1. Place in `src/components/`
2. Export as named export
3. Include TypeScript types
4. Use Tailwind for styling
5. Support dark mode where applicable

### Adding Database Queries
1. Add functions to `src/lib/supabase.ts`
2. Handle errors gracefully
3. Use types from `@/types`
4. Cache results where appropriate

## 🐛 Debugging

### Enable Debug Logs
```typescript
// In any file
console.log('Debug info:', data)
```

### Check Database
- Use Supabase Dashboard
- Run SQL queries directly
- Check RLS policies

### Browser DevTools
- Check network tab for API calls
- Use React DevTools for component state
- Check console for errors

## 📚 Documentation

- `DATABASE_SCHEMA.md` - Complete database structure
- `df` - System functions breakdown
- `Style` - Design system tokens and guidelines

## 🤝 Contributing

1. Create a feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## 📄 License

This project is part of the Electronic Story Library system.

## 🎓 Educational Focus

This platform is designed to:
- Encourage reading in young students
- Make learning fun with gamification
- Track progress and celebrate achievements
- Provide structured Arabic language learning
- Foster teacher-student engagement

## 🚀 Future Enhancements

- [ ] Mobile app (React Native)
- [ ] Offline reading capability
- [ ] Reading comprehension quizzes
- [ ] Parent dashboard
- [ ] Speech synthesis for reading aloud
- [ ] Collaborative storytelling
- [ ] Achievement badges and certificates
- [ ] Export progress reports

---

Built with ❤️ for children's education | Made in 2025
# OL
