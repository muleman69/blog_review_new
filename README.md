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