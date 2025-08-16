# Everything Calculator Platform

A modern web application that generates interactive calculators from natural language prompts using AI. Built with React, TypeScript, Supabase, and shadcn/ui.

## Features

- 🤖 **AI-Powered Calculator Generation** - Generate calculators from simple prompts using Google's Gemini API
- 🔐 **User Authentication** - Complete sign up, sign in, and password reset functionality
- 💾 **Save & Share** - Save your calculators and share them publicly
- 🎨 **Modern UI** - Beautiful, responsive interface built with shadcn/ui
- 📱 **Mobile Responsive** - Works perfectly on all devices
- 🔒 **Secure** - Built with Supabase for secure authentication and data storage

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI**: shadcn/ui, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **AI**: Google Gemini API for calculator generation
- **State Management**: Zustand
- **Routing**: React Router DOM
- **Forms**: React Hook Form
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Google AI Studio account (for Gemini API)

### 1. Clone the Repository

```bash
git clone https://github.com/onlynishadd/prompt-to-compute.git
cd prompt-to-compute
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Gemini API Configuration
VITE_GEMINI_API_KEY=your-gemini-api-key
```

### 4. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Update your `.env.local` file with the Supabase credentials

### 5. Set Up Gemini API

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add the API key to your `.env.local` file as `VITE_GEMINI_API_KEY`

### 6. Set Up Database

1. In your Supabase dashboard, go to SQL Editor
2. Run the migration from `supabase/migrations/20240101000000_create_tables.sql`
3. This will create the necessary tables and security policies

### 7. Configure Authentication

1. In Supabase dashboard, go to Authentication > Settings
2. Configure your site URL (e.g., `http://localhost:5173` for development)
3. Add your email provider settings if needed

### 8. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:5173` to see your application.

## Project Structure

```
src/
├── components/
│   ├── auth/           # Authentication components
│   ├── ui/             # shadcn/ui components
│   ├── Header.tsx      # Main header with auth
│   ├── PromptComposer.tsx
│   └── CalculatorPreview.tsx
├── hooks/
│   ├── use-auth.tsx    # Authentication hook
│   └── use-toast.ts
├── integrations/
│   └── supabase/       # Supabase client and types
├── pages/
│   ├── Index.tsx
│   └── NotFound.tsx
├── store/
│   └── calculatorStore.ts
└── App.tsx
```

## AI-Powered Calculator Generation

The application uses Google's Gemini API to generate calculator specifications from natural language prompts. Here's how it works:

### How AI Generation Works

1. **User Input**: User enters a prompt like "Calculate mortgage payments"
2. **AI Processing**: Gemini API analyzes the prompt and generates a structured calculator specification
3. **Dynamic Rendering**: The app renders an interactive calculator based on the AI-generated spec
4. **User Interaction**: Users can input values and see calculated results

### Example Prompts

- "Calculate mortgage payments based on loan amount, interest rate, and term"
- "BMI calculator with height and weight inputs"
- "ROI calculator for investment projects"
- "Carbon footprint calculator for daily activities"
- "Calorie calculator for different exercises"

### AI Response Format

The Gemini API generates JSON specifications like this:

```json
{
  "title": "Mortgage Payment Calculator",
  "fields": [
    {
      "id": "loan_amount",
      "label": "Loan Amount",
      "type": "number",
      "placeholder": "300000"
    },
    {
      "id": "interest_rate",
      "label": "Annual Interest Rate (%)",
      "type": "number",
      "placeholder": "4.5"
    },
    {
      "id": "loan_term",
      "label": "Loan Term (Years)",
      "type": "number",
      "placeholder": "30"
    }
  ],
  "formula": "PMT((interest_rate/100)/12, loan_term*12, -loan_amount)",
  "cta": "Calculate Monthly Payment",
  "description": "Calculate your monthly mortgage payment based on loan amount, interest rate, and term."
}
```

## Authentication Flow

The application includes a complete authentication system:

1. **Sign Up**: Users can create accounts with email/password
2. **Sign In**: Existing users can sign in
3. **Password Reset**: Users can reset forgotten passwords
4. **User Profiles**: Automatic profile creation on signup
5. **Session Management**: Persistent sessions across browser sessions

## Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `email` (Text)
- `full_name` (Text, nullable)
- `avatar_url` (Text, nullable)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### Calculators Table
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to users)
- `title` (Text)
- `prompt` (Text)
- `spec` (JSONB)
- `is_public` (Boolean)
- `slug` (Text, unique)
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

## Security Features

- **Row Level Security (RLS)** enabled on all tables
- **Authentication policies** ensure users can only access their own data
- **Public calculator sharing** with proper access controls
- **Secure password handling** through Supabase Auth
- **API key protection** through environment variables

## Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key
   - `VITE_GEMINI_API_KEY`: Your Gemini API key
3. Deploy!

### Environment Variables for Production

Make sure to set these environment variables in your production environment:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_GEMINI_API_KEY=your-gemini-api-key
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

If you encounter any issues:

1. Check the Supabase dashboard for any authentication errors
2. Verify your environment variables are set correctly
3. Ensure the database migration has been run successfully
4. Check the browser console for any JavaScript errors
5. Verify your Gemini API key is valid and has proper permissions

## Future Enhancements

- [ ] Real-time calculator collaboration
- [ ] Advanced calculator templates
- [ ] API for third-party integrations
- [ ] Analytics dashboard
- [ ] Team workspaces
- [ ] Advanced sharing options
- [ ] More sophisticated formula evaluation
- [ ] Calculator templates library
- [ ] Export calculators as embeddable widgets
