# GYM AI - Smart Fitness Tracker

A modern, AI-powered fitness and nutrition tracking application built with Next.js, featuring voice input capabilities for seamless workout and meal logging.

## Features

### 🏋️ Smart Workout Tracking
- **Voice Input**: Describe your workouts naturally using voice commands
- **AI Processing**: OpenAI Whisper transcribes speech, GPT-4 parses into structured data
- **Detailed Logging**: Track exercises, sets, reps, weights, and rest times
- **Progress Visualization**: View workout history with expandable details

### 🍽️ Intelligent Nutrition Tracking
- **Voice-Powered Food Logging**: Simply speak what you ate
- **Accurate Nutrition Data**: AI estimates calories, macros, and micronutrients
- **Meal Organization**: Separate tracking for breakfast, lunch, dinner, snacks, and mid-meals
- **Comprehensive Analytics**: Detailed nutritional breakdowns and totals

### 📊 Advanced Dashboard
- **Real-time Statistics**: Calories burned/eaten, protein intake, net calories
- **Trend Analysis**: 7-day progress charts with visual indicators
- **Goal Tracking**: Progress bars for protein and calorie targets
- **Smart Comparisons**: Day-over-day changes with directional indicators

### 🎯 Key Technologies
- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui with Radix UI primitives
- **Database**: Prisma ORM with SQLite (dev) / PostgreSQL (prod)
- **AI Integration**: OpenAI Whisper (speech-to-text) + GPT-4 (data parsing)
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- OpenAI API key

### Installation

1. **Clone and install dependencies**
   \`\`\`bash
   git clone <repository-url>
   cd gym-ai-app
   npm install
   \`\`\`

2. **Environment Setup**
   \`\`\`bash
   cp .env.local.example .env.local
   \`\`\`
   
   Add your OpenAI API key to `.env.local`:
   \`\`\`env
   OPENAI_API_KEY=your_openai_api_key_here
   DATABASE_URL="file:./dev.db"
   \`\`\`

3. **Database Setup**
   \`\`\`bash
   npm run setup
   \`\`\`
   This will generate Prisma client, push schema, and seed demo data.

4. **Start Development Server**
   \`\`\`bash
   npm run dev
   \`\`\`
   
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage Guide

### Voice Input Workflow

1. **Workouts**: Navigate to Workouts page, click microphone, describe your session
   - Example: *"I did 3 sets of bench press with 80kg for 10 reps each, then 3 sets of pull-ups"*

2. **Food Logging**: Go to Food page, click "Add Food" on any meal, then use voice input
   - Example: *"I had 2 scrambled eggs, 1 slice of whole wheat toast with butter, and a glass of orange juice"*

3. **AI Processing**: The system will:
   - Transcribe your speech using Whisper
   - Parse the content using GPT-4
   - Present structured data for review
   - Save to database after confirmation

### Dashboard Insights

- **Calories Burned Today**: Shows daily total with percentage change from yesterday
- **Calories Eaten Today**: Current intake with remaining calories to target
- **Net Calories**: Difference between consumed and burned calories
- **Protein Progress**: Visual progress bar toward daily protein goal
- **7-Day Trends**: Mini chart showing calorie burn patterns over the week

## Architecture

### Database Schema
- **Users & Profiles**: Personal info, goals, TDEE calculations
- **Workouts & Exercises**: Hierarchical workout structure with sets
- **Meals & Items**: Flexible meal tracking with detailed nutrition data

### AI Processing Pipeline
1. **Audio Capture**: Browser MediaRecorder API with optimized settings
2. **Transcription**: OpenAI Whisper with error handling and retry logic
3. **Parsing**: GPT-4 with structured prompts and JSON schema validation
4. **Validation**: Zod schemas ensure data integrity
5. **Storage**: Prisma ORM with automatic revalidation

### Mobile-First Design
- **Responsive Layout**: Sidebar on desktop, sheet drawer on mobile
- **Touch-Optimized**: Large tap targets, swipe gestures
- **Fixed Input**: Voice input bar stays accessible at bottom
- **Progressive Enhancement**: Works without JavaScript for core features

## Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production
\`\`\`env
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=your_postgresql_connection_string
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=https://your-domain.com
\`\`\`

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes
- `npm run db:seed` - Seed database with demo data
- `npm run setup` - Complete database setup

### Project Structure
\`\`\`
├── app/                 # Next.js app router pages
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── dashboard/      # Dashboard-specific components
│   ├── workouts/       # Workout tracking components
│   └── food/           # Food tracking components
├── lib/                # Utility functions and configurations
│   ├── actions/        # Server actions
│   ├── prisma.ts       # Database client
│   ├── openai.ts       # AI configuration
│   └── utils.ts        # Helper functions
├── prisma/             # Database schema and migrations
└── public/             # Static assets
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@gym-ai.com or open an issue on GitHub.
