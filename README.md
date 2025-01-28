# Technical Blog Validation System

A full-stack web application for validating and improving technical blog posts using the DeepSeek R1 API.

## Features

- Technical accuracy validation
- Industry standards verification
- Content structure analysis
- Code snippet validation
- Real-time feedback
- History tracking
- Export capabilities

## Tech Stack

### Backend
- Node.js with Express
- TypeScript
- MongoDB for data storage
- Redis for caching
- DeepSeek R1 API integration
- JWT authentication

### Frontend (Coming Soon)
- React 18+
- TypeScript
- Tailwind CSS
- React Query
- Monaco Editor

## Prerequisites

- Node.js (v16+)
- MongoDB
- Redis
- DeepSeek R1 API key

## Environment Setup

### Backend Environment Variables

The backend uses the following environment variables for local development:

```env
NODE_ENV=development
PORT=3001

# MongoDB Connection (local)
MONGO_URI=mongodb://localhost:27017/blog_review

# Redis Connection (local)
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your_jwt_secret_here

# External Services
DEEPSEEK_API_URL=https://api.deepseek.com/v1
DEEPSEEK_API_KEY=not_required_for_local_testing
```

For production (Vercel), the following values are used:
- `MONGO_URI`: MongoDB Atlas connection string
- `REDIS_URL`: Redis Cloud connection string
- `JWT_SECRET`: Production JWT secret
- `DEEPSEEK_API_KEY`: Production API key

### Frontend Environment Variables

The frontend uses Vite's environment variable system with three configurations:

1. `.env` - Default environment variables:
```env
VITE_API_URL=http://localhost:3001
VITE_ENABLE_AI_SUGGESTIONS=true
VITE_ENABLE_REAL_TIME_VALIDATION=true
VITE_ENABLE_ANALYTICS=false
VITE_CACHE_TTL=300
VITE_MAX_CACHE_SIZE=100
VITE_VALIDATION_BATCH_SIZE=5
VITE_VALIDATION_DEBOUNCE_MS=1000
```

2. `.env.development` - Development-specific overrides
3. `.env.production` - Production-specific overrides

For production deployment on Vercel:
- The API URL will be automatically configured
- Feature flags can be managed through the Vercel dashboard
- Analytics and monitoring variables should be set in the Vercel environment

### Local Development Setup

1. Backend:
   ```bash
   cd backend
   cp .env.example .env
   # Update values in .env as needed
   ```

2. Frontend:
   ```bash
   cd frontend
   # The default .env file should work for local development
   # Use .env.development for development-specific overrides
   ```

### Production Deployment

Environment variables for production are managed through the Vercel dashboard. Do not commit production values to the repository.

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd blog-review-system
```

2. Install dependencies:
```bash
# Backend
cd backend
npm install

# Frontend (Coming Soon)
cd ../frontend
npm install
```

3. Configure environment variables:
```bash
# Backend
cd backend
cp .env.example .env
```
Edit `.env` with your configuration.

4. Build the project:
```bash
# Backend
npm run build
```

5. Start the development server:
```bash
# Backend
npm run dev
```

## API Endpoints

### Blog Posts
- `POST /api/blog-posts` - Create a new blog post
- `GET /api/blog-posts` - List all blog posts (with pagination)
- `POST /api/blog-posts/:id/validate` - Validate a blog post
- `GET /api/blog-posts/:id/validation-history` - Get validation history
- `PATCH /api/blog-posts/:id` - Update a blog post
- `DELETE /api/blog-posts/:id` - Delete a blog post

## Development

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Building for Production
```bash
npm run build
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Acknowledgments

- DeepSeek R1 API for technical validation capabilities
- MongoDB for reliable data storage
- Redis for efficient caching 