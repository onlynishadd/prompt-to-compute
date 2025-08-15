# Calculator Platform

A comprehensive platform for creating, sharing, and managing interactive calculators. Transform simple prompts into powerful calculation tools with full community features.

## ✨ Features

### 🔧 Calculator Creation
- **AI-Powered Generation**: Create calculators from natural language prompts
- **Live Preview**: See your calculator in action as you build it
- **Custom Specifications**: Fine-tune calculator behavior with JSON specs

### 👥 User Management
- **Authentication**: Sign in with email or Google OAuth
- **User Profiles**: Manage your account and calculator collection
- **Secure Access**: Row-level security with Supabase

### 📚 Calculator Library
- **Personal Collection**: Save and organize your calculators
- **Public Gallery**: Discover calculators shared by the community
- **Template System**: Access pre-built calculator templates
- **Search & Filter**: Find calculators by category, tags, or keywords

### 🚀 Sharing & Collaboration
- **Public Sharing**: Make your calculators discoverable by others
- **Fork System**: Create copies of existing calculators to customize
- **Like System**: Show appreciation for useful calculators
- **Community Templates**: Share your best calculators as templates

### 📊 Analytics & Engagement
- **View Tracking**: Monitor how many people use your calculators
- **Like Counter**: See community engagement with your creations
- **Fork Counter**: Track how many times your calculators are copied

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: shadcn/ui with Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **State Management**: Zustand
- **Forms**: React Hook Form with Zod validation
- **Routing**: React Router DOM
- **Icons**: Lucide React

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/onlynishadd/prompt-to-compute.git
   cd prompt-to-compute
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Copy your project URL and anon key
   - Update the environment variables in `src/.env.local`:
     ```
     VITE_SUPABASE_URL=your_supabase_url
     VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
     ```

4. **Run database migrations**
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Run the migration file: `supabase/migrations/20240114000000_calculator_platform.sql`

5. **Configure Authentication**
   - In Supabase dashboard, go to Authentication > Providers
   - Enable Email and Google providers
   - For Google OAuth, add your OAuth credentials

6. **Start the development server**
   ```bash
   npm run dev
   ```

## 📁 Project Structure

```
src/
├── components/
│   ├── auth/                 # Authentication components
│   │   ├── LoginDialog.tsx
│   │   └── UserProfile.tsx
│   ├── calculator/           # Calculator-related components
│   │   ├── CalculatorCard.tsx
│   │   ├── CalculatorGallery.tsx
│   │   └── SaveCalculatorDialog.tsx
│   ├── ui/                   # UI components (shadcn/ui)
│   ├── CalculatorPreview.tsx
│   └── PromptComposer.tsx
├── contexts/
│   └── AuthContext.tsx       # Authentication context
├── lib/
│   ├── supabase.ts          # Supabase client & types
│   └── utils.ts             # Utility functions
├── pages/
│   ├── Index.tsx            # Main application page
│   └── NotFound.tsx         # 404 page
├── services/
│   └── calculatorService.ts # Calculator CRUD operations
└── store/
    └── calculatorStore.ts   # Calculator state management
```

## 🗄️ Database Schema

### Tables
- **profiles**: User profile information
- **calculators**: Calculator specifications and metadata
- **calculator_likes**: User likes for calculators
- **calculator_forks**: Fork relationships between calculators

### Key Features
- Row Level Security (RLS) for data protection
- Automatic profile creation on user signup
- Automatic count updates for likes/forks/views
- Efficient indexing for performance

## 🔐 Security

- **Row Level Security**: All data access is controlled by Supabase RLS policies
- **Authentication**: Secure user authentication with Supabase Auth
- **Data Validation**: Client-side and server-side validation
- **HTTPS Only**: All communication encrypted

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/onlynishadd/prompt-to-compute/issues) page
2. Create a new issue if your problem isn't already reported
3. Provide detailed information about your environment and the issue

## 🙏 Acknowledgments

- Built with [Vite](https://vitejs.dev/) and [React](https://reactjs.org/)
- UI components by [shadcn/ui](https://ui.shadcn.com/)
- Backend powered by [Supabase](https://supabase.com/)
- Icons by [Lucide](https://lucide.dev/)

---

**Happy calculating!** 🧮✨
