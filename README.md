# Kemo - Movie Streaming Platform

A full-stack movie streaming website built with the MERN stack (MongoDB, Express, React, Node.js) featuring a modern dark-themed UI, Telegram integration for backup streaming, and privacy-focused design.

## 🎬 Features

### Frontend
- **Modern Dark UI**: Clean, responsive design inspired by modern streaming platforms
- **Movie Carousels**: Horizontal scrollable movie lists by categories (Latest, Popular, Genres)
- **Advanced Search**: Real-time search with filters by genre, year, and rating
- **Movie Details**: Comprehensive movie pages with synopsis, cast, and streaming options
- **Video Player**: Custom video player with quality selection and keyboard controls
- **User Authentication**: JWT-based authentication with watchlist and history tracking
- **Responsive Design**: Mobile-first approach with Tailwind CSS

### Backend
- **RESTful API**: Complete CRUD operations for movies and users
- **MongoDB Integration**: Efficient data storage with indexing and aggregation
- **Telegram Integration**: Backup streaming from Telegram channels
- **Security**: JWT authentication, rate limiting, and input validation
- **Analytics**: Privacy-focused analytics with minimal data collection

### Privacy & Security
- **Anonymous Hosting**: Designed for privacy-focused deployment
- **Minimal Data Collection**: Only essential user data stored
- **Secure Authentication**: JWT tokens with automatic expiration
- **Rate Limiting**: Protection against abuse and DDoS attacks
- **Input Validation**: Comprehensive validation and sanitization

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Telegram Bot Token (optional, for backup streaming)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd kemo-streaming
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   npm install
   
   # Install frontend dependencies
   cd client
   npm install
   cd ..
   ```

3. **Environment Configuration**
   ```bash
   # Copy environment template
   cp env.example .env
   
   # Edit .env with your configuration
   nano .env
   ```

4. **Database Setup**
   ```bash
   # Start MongoDB (if local)
   mongod
   
   # Or use MongoDB Atlas (cloud)
   # Update MONGODB_URI in .env
   ```

5. **Start Development Servers**
   ```bash
   # Start both frontend and backend
   npm run dev
   
   # Or start separately
   npm run server  # Backend on port 5000
   npm run client  # Frontend on port 3000
   ```

## 📁 Project Structure

```
kemo-streaming/
├── server/                 # Backend API
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API endpoints
│   ├── services/          # Business logic
│   ├── middleware/        # Authentication & validation
│   └── index.js           # Server entry point
├── client/                # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # React contexts
│   │   └── App.js         # Main app component
│   └── public/            # Static assets
├── package.json           # Backend dependencies
└── client/package.json    # Frontend dependencies
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/kemo-streaming

# JWT Secret (generate a strong secret)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Telegram Configuration (optional)
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
TELEGRAM_API_TOKEN=your-telegram-api-token
TELEGRAM_CHANNEL_ID=your-telegram-channel-id

# Security
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Telegram Setup (Optional)

1. **Create a Telegram Bot**
   - Message @BotFather on Telegram
   - Create a new bot and get the token
   - Add bot to your channel as admin

2. **Get Channel ID**
   - Forward a message from your channel to @userinfobot
   - Note the channel ID (starts with -100)

3. **Configure Environment**
   - Add bot token and channel ID to `.env`
   - Restart the server

## 🎯 API Endpoints

### Movies
- `GET /api/movies` - Get all movies with pagination
- `GET /api/movies/:id` - Get movie by ID
- `GET /api/movies/category/:category` - Get movies by category
- `GET /api/movies/search` - Search movies
- `GET /api/movies/:id/stream` - Get streaming URLs

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update profile

### Telegram Integration
- `GET /api/telegram/test` - Test connection
- `POST /api/telegram/backup/:movieId` - Add backup streaming URL
- `GET /api/telegram/search/:movieTitle` - Search Telegram channel

## 🎨 Customization

### Styling
The app uses Tailwind CSS for styling. Customize the theme in `client/tailwind.config.js`:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Your primary color palette
      },
      dark: {
        // Dark theme colors
      }
    }
  }
}
```

### Adding New Features
1. **Backend**: Add routes in `server/routes/`
2. **Frontend**: Add components in `client/src/components/`
3. **Database**: Update schemas in `server/models/`

## 🚀 Deployment

### Production Build
```bash
# Build frontend
cd client
npm run build

# Start production server
npm start
```

### Deployment Options

#### Vercel (Frontend)
1. Connect your GitHub repository
2. Set build command: `cd client && npm install && npm run build`
3. Set output directory: `client/build`

#### Railway/Render (Backend)
1. Connect your repository
2. Set environment variables
3. Set build command: `npm install`
4. Set start command: `npm start`

#### Docker Deployment
```dockerfile
# Dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN cd client && npm install && npm run build
EXPOSE 5000
CMD ["npm", "start"]
```

## 🔒 Security Considerations

### Privacy
- No personal data collection beyond authentication
- Anonymous analytics with privacy mode
- Minimal user tracking

### Security
- JWT token expiration
- Rate limiting on all endpoints
- Input validation and sanitization
- CORS configuration
- Helmet.js security headers

### Anonymity
- Designed for anonymous hosting
- No user IP logging
- Minimal server-side tracking
- Easy domain migration

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## ⚠️ Disclaimer

This project is for educational purposes only. Ensure you comply with local laws and regulations regarding content streaming and copyright.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the code comments

## 🔄 Updates

Stay updated with the latest features and security patches by regularly pulling from the main branch.

---

**Built with ❤️ using the MERN stack** 