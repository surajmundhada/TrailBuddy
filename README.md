# TrailBuddy 

🏆 **Top 10 Finalist – MVPM Startup Hackathon**

TrailBuddy is an AI-powered travel marketplace that connects travelers with verified local guides across India. The platform combines intelligent trip planning, secure bookings, real-time communication, and hyperlocal discovery to help users explore destinations through authentic local experiences.

Built using **React, Spring Boot, MySQL, JWT Authentication, WebSockets, Google Places API, and OpenAI**.

## 🎥 Project Demo

Watch the complete project walkthrough:

🔗 **Demo Video:** https://drive.google.com/file/d/1NRiZEqoY8RYdHwQFtdweyVpoY_kOrQ6d/view?usp=sharing

The demo covers:

* User Authentication & Authorization
* Guide Discovery & Search
* AI-Powered Trip Planning
* Booking Workflow
* Payment Integration
* Real-Time Chat
* Admin Dashboard
* Guide Verification System

## 👥 Team

Developed as part of the MVPM Startup Hackathon by:

* **Suraj Mundhada**
* **Yash Agiwal**
* **Shrikant Somani**

## 📌 Problem Statement

Modern travelers often struggle to find trustworthy local guides, authentic cultural experiences, and personalized travel plans. Existing travel platforms focus primarily on transportation and accommodation while overlooking local expertise and community-driven experiences.

## 💡 Solution

TrailBuddy bridges this gap by creating a trusted marketplace where travelers can discover verified local guides, generate AI-assisted travel itineraries, book experiences securely, and communicate directly with guides before and during their journeys.


## 🌟 Features

### Core Features
- **🔐 User Authentication** - JWT-based auth with role management (User/Guide/Admin)
- **✅ Verified Guide System** - Aadhar verification, document upload, admin approval
- **🤖 AI Trip Planner** - OpenAI/Gemini integration for personalized itineraries
- **📍 Real-time Discovery** - Google Places API for nearby attractions and hidden gems
- **📅 Booking System** - Calendar-based availability, status tracking
- **💳 Payment Integration** - Razorpay integration with secure transactions
- **⭐ Review System** - User ratings, reviews, and feedback management
- **🛡️ Women Safety** - Special safety features and women-friendly guides
- **💬 Real-time Chat** - WebSocket-based messaging between users and guides
- **📊 Admin Dashboard** - Comprehensive analytics and management tools
- **📦 Subscription System** - Premium plans with advanced features
- **📖 Hyperlocal Stories** - Cultural insights and experiences shared by guides

### Advanced Features
- **🎯 Geo-location Recommendations** - Location-based guide suggestions
- **🔍 Smart Search & Filters** - Advanced filtering by city, language, price, etc.
- **⏰ Real-time Availability** - Dynamic pricing and availability management
- **🔔 Notification System** - Email and in-app notifications
- **📱 Mobile Responsive** - Progressive Web App ready
- **🌐 Multi-language Support** - Support for 11+ Indian languages

## 🏗️ Technology Stack

### Frontend
- **React.js** with Vite
- **Tailwind CSS** for modern UI
- **React Router** for navigation
- **React Query** for state management
- **React Hook Form** for forms
- **Axios** for API calls
- **Heroicons** for icons

### Backend
- **Spring Boot 3.2** (Java 17)
- **Spring Security** with JWT
- **Spring Data JPA** with Hibernate
- **MySQL 8.0** database
- **WebSocket** support with STOMP
- **JavaMail** for email services

### DevOps & Infrastructure
- **Docker** containerization
- **Docker Compose** for orchestration
- **Nginx** reverse proxy
- **Redis** for caching
- **Maven** for build management

### External Integrations
- **Razorpay** for payments
- **Google Places API** for location services
- **OpenAI/Gemini API** for AI features
- **Signzy API** for KYC verification
- **Twilio** for SMS services
- **Mailtrap** for email testing

## 📋 Prerequisites

- Java 17+
- Node.js 18+
- MySQL 8.0+
- Docker & Docker Compose (optional)
- Maven 3.6+

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

1. **Clone the repository**
```bash
git clone https://github.com/your-username/trailbuddy.git
cd trailbuddy
```

2. **Create environment file**
```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. **Update environment variables**
Edit `backend/.env` and `frontend/.env` with your API keys and configurations.

4. **Start the application**
```bash
docker-compose up -d
```

5. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080/api
- API Documentation: http://localhost:8080/swagger-ui.html

### Option 2: Manual Setup

#### Backend Setup

1. **Navigate to backend directory**
```bash
cd backend
```

2. **Configure database**
```bash
# Create MySQL database
mysql -u root -p
CREATE DATABASE trailbuddy;
```

3. **Set up environment**
```bash
cp .env.example .env
# Edit .env with your configurations
```

4. **Run the application**
```bash
./mvnw spring-boot:run
```

#### Frontend Setup

1. **Navigate to frontend directory**
```bash
cd frontend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment**
```bash
cp .env.example .env
# Edit .env with your configurations
```

4. **Start development server**
```bash
npm run dev
```

## 📊 Database Schema

The application uses a normalized MySQL schema with the following main tables:

- **users** - User accounts and authentication
- **roles** - User roles (USER, GUIDE, ADMIN)
- **guides** - Guide profiles and verification status
- **bookings** - Tour bookings and scheduling
- **payments** - Payment transactions and records
- **reviews** - User reviews and ratings
- **stories** - Hyperlocal stories and experiences
- **chat_messages** - Real-time messaging
- **subscriptions** - Premium subscription management

For complete schema details, see `database/schema.sql`.

## 🔧 Configuration

### Backend Configuration

Key configuration files:
- `application.yml` - Main Spring Boot configuration
- `.env` - Environment variables and secrets

### Frontend Configuration

Key configuration files:
- `vite.config.js` - Vite build configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `.env` - Environment variables

## 📝 API Documentation

Once the backend is running, access Swagger UI at:
```
http://localhost:8080/swagger-ui.html
```

### Main API Endpoints

#### Authentication
- `POST /api/auth/signin` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/refresh-token` - Token refresh

#### Guides
- `GET /api/guides` - List all guides
- `GET /api/guides/{id}` - Get guide details
- `POST /api/guides/register` - Register as guide

#### Bookings
- `POST /api/bookings` - Create booking
- `GET /api/bookings/user` - Get user bookings
- `PUT /api/bookings/{id}/status` - Update booking status

#### Payments
- `POST /api/payments` - Process payment
- `POST /api/payments/{id}/verify` - Verify payment

## 🧪 Testing

### Backend Tests
```bash
cd backend
./mvnw test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📦 Deployment

### Production Deployment with Docker

1. **Build and deploy**
```bash
docker-compose --profile production up -d
```

2. **Configure SSL**
Place SSL certificates in `nginx/ssl/` directory.

### Environment Variables for Production

Required environment variables:
- `DB_HOST`, `DB_NAME`, `DB_USERNAME`, `DB_PASSWORD`
- `JWT_SECRET`
- `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- `GOOGLE_PLACES_API_KEY`
- `OPENAI_API_KEY`
- `MAIL_HOST`, `MAIL_USERNAME`, `MAIL_PASSWORD`

## 🔒 Security Features

- **JWT Authentication** with refresh tokens
- **Role-based Access Control** (RBAC)
- **Password Encryption** with BCrypt
- **CORS Configuration**
- **SQL Injection Prevention** with JPA
- **XSS Protection** headers
- **HTTPS Enforcement** in production
- **Input Validation** with Jakarta Validation
- **Rate Limiting** on sensitive endpoints

## 📈 Performance Optimization

- **Database Indexing** on frequently queried columns
- **Redis Caching** for frequently accessed data
- **Lazy Loading** for JPA entities
- **Image Compression** and CDN integration
- **Code Splitting** in React
- **Service Worker** for offline support

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.


Built with ❤️ for travelers across India 🇮🇳

