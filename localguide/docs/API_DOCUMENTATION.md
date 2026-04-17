# TrailBuddy API Documentation

## Base URL
```
http://localhost:8080/api
```

## Authentication

The API uses JWT (JSON Web Token) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Response Format

All API responses follow this format:

### Success Response
```json
{
  "data": {},
  "message": "Success",
  "status": "OK"
}
```

### Error Response
```json
{
  "error": "Error message",
  "status": "BAD_REQUEST",
  "timestamp": "2024-03-23T12:00:00Z"
}
```

## Endpoints

### Authentication

#### POST /auth/signin
Login user and return JWT tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "refresh-token-here",
  "type": "Bearer",
  "id": 1,
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "roles": ["USER"]
}
```

#### POST /auth/signup
Register a new user.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "9876543210",
  "role": "USER"
}
```

#### POST /auth/forgot-password
Initiate password reset.

**Query Parameters:**
- `email` (string): User email address

#### POST /auth/reset-password
Reset password with token.

**Query Parameters:**
- `token` (string): Reset token
- `newPassword` (string): New password

#### POST /auth/verify-email
Verify email address.

**Query Parameters:**
- `token` (string): Verification token

### Guides

#### GET /guides
Get all guides with filtering and pagination.

**Query Parameters:**
- `city` (string, optional): Filter by city
- `search` (string, optional): Search term
- `sortBy` (string, optional): Sort by field (rating, price-low, price-high, experience, bookings)
- `page` (int, optional): Page number (default: 0)
- `size` (int, optional): Page size (default: 10)
- `minPrice` (int, optional): Minimum hourly rate
- `maxPrice` (int, optional): Maximum hourly rate
- `languages` (string, optional): Comma-separated languages
- `womenOnly` (boolean, optional): Filter women-friendly guides
- `verifiedOnly` (boolean, optional): Filter verified guides only

**Response:**
```json
{
  "content": [
    {
      "id": 1,
      "user": {
        "firstName": "Rajesh",
        "lastName": "Kumar",
        "email": "rajesh@example.com",
        "profileImageUrl": "https://example.com/avatar.jpg"
      },
      "city": "Jaipur",
      "state": "Rajasthan",
      "bio": "Expert in Rajasthan heritage...",
      "languages": ["Hindi", "English"],
      "expertiseAreas": ["Heritage Tours", "Cultural Tours"],
      "hourlyRate": 800,
      "dailyRate": 5000,
      "averageRating": 4.8,
      "totalReviews": 124,
      "isVerified": true,
      "isAvailable": true,
      "experienceYears": 10
    }
  ],
  "pageable": {
    "pageNumber": 0,
    "pageSize": 10,
    "totalElements": 50,
    "totalPages": 5
  }
}
```

#### GET /guides/{id}
Get guide by ID.

#### POST /guides/register
Register as a guide (requires authentication).

**Request Body:**
```json
{
  "userId": 1,
  "aadharNumber": "123456789012",
  "city": "Jaipur",
  "state": "Rajasthan",
  "bio": "Expert guide with 10 years experience...",
  "languages": ["Hindi", "English"],
  "expertiseAreas": ["Heritage Tours", "Cultural Tours"],
  "hourlyRate": 800,
  "dailyRate": 5000,
  "verificationDocuments": ["doc1.jpg", "doc2.pdf"]
}
```

#### PUT /guides/profile
Update guide profile (requires GUIDE role).

#### GET /guides/{id}/availability
Get guide availability for date range.

**Query Parameters:**
- `startDate` (date): Start date (YYYY-MM-DD)
- `endDate` (date): End date (YYYY-MM-DD)

#### POST /guides/availability
Update guide availability (requires GUIDE role).

**Request Body:**
```json
[
  {
    "date": "2024-03-25",
    "isAvailable": true,
    "notes": "Available for morning tours"
  }
]
```

### Bookings

#### POST /bookings
Create a new booking (requires USER role).

**Request Body:**
```json
{
  "guideId": 1,
  "startDate": "2024-03-25",
  "endDate": "2024-03-27",
  "startTime": "09:00",
  "endTime": "17:00",
  "specialRequirements": "Wheelchair accessible tour"
}
```

#### GET /bookings/user
Get current user's bookings (requires USER role).

#### GET /bookings/guide
Get guide's bookings (requires GUIDE role).

#### GET /bookings/{id}
Get booking by ID.

#### PUT /bookings/{id}/status
Update booking status.

**Query Parameters:**
- `status` (string): New status (PENDING, CONFIRMED, CANCELLED, COMPLETED, REFUNDED)

**Request Body (optional):**
```json
{
  "reason": "Customer requested cancellation"
}
```

#### PUT /bookings/{id}/cancel
Cancel booking.

#### PUT /bookings/{id}/confirm
Confirm booking (requires GUIDE role).

#### PUT /bookings/{id}/complete
Mark booking as completed.

### Payments

#### POST /payments
Process payment for booking.

**Request Body:**
```json
{
  "bookingId": 1,
  "amount": 5000,
  "paymentMethod": "RAZORPAY"
}
```

#### POST /payments/{id}/verify
Verify Razorpay payment.

**Request Body:**
```json
{
  "razorpayOrderId": "order_123",
  "razorpayPaymentId": "pay_123",
  "razorpaySignature": "signature123"
}
```

#### POST /payments/{id}/refund
Refund payment (requires ADMIN role).

### Reviews

#### POST /reviews
Create a review for completed booking.

**Request Body:**
```json
{
  "bookingId": 1,
  "rating": 5,
  "reviewText": "Amazing experience! Guide was very knowledgeable."
}
```

#### PUT /reviews/{id}
Update review.

#### DELETE /reviews/{id}
Delete review.

#### GET /reviews/guide/{guideId}
Get reviews for a guide.

#### GET /reviews/user
Get current user's reviews.

### Stories

#### GET /stories
Get all stories with pagination.

**Query Parameters:**
- `page` (int, optional): Page number
- `size` (int, optional): Page size
- `city` (string, optional): Filter by city
- `tags` (string, optional): Filter by tags

#### GET /stories/{id}
Get story by ID.

#### POST /stories
Create a new story (requires GUIDE role).

**Request Body:**
```json
{
  "title": "Hidden Gems of Jaipur",
  "content": "Discover the lesser-known places in Jaipur...",
  "images": ["image1.jpg", "image2.jpg"],
  "tags": ["heritage", "culture", "jaipur"],
  "location": "Jaipur, Rajasthan"
}
```

#### PUT /stories/{id}
Update story (requires GUIDE role and ownership).

#### DELETE /stories/{id}
Delete story (requires GUIDE role and ownership).

#### POST /stories/{id}/like
Like a story.

#### DELETE /stories/{id}/like
Unlike a story.

#### GET /stories/{id}/comments
Get comments for a story.

#### POST /stories/{id}/comments
Add comment to story.

**Request Body:**
```json
{
  "comment": "Great story! Thanks for sharing.",
  "parentCommentId": null
}
```

### Chat

#### POST /chat/send
Send a message.

**Request Body:**
```json
{
  "receiverId": 2,
  "messageText": "Hi! I'm interested in booking a tour.",
  "messageType": "TEXT"
}
```

#### GET /chat/history
Get chat history with user.

**Query Parameters:**
- `userId` (long): Other user's ID
- `page` (int, optional): Page number
- `size` (int, optional): Page size

#### PUT /chat/{messageId}/read
Mark message as read.

### AI Planner

#### POST /ai/planner
Generate AI trip plan.

**Request Body:**
```json
{
  "destination": "Jaipur",
  "budget": 15000,
  "days": 3,
  "preferences": ["heritage", "food", "shopping"],
  "travelers": 2,
  "accommodationType": "hotel"
}
```

**Response:**
```json
{
  "itinerary": [
    {
      "day": 1,
      "activities": [
        {
          "time": "09:00",
          "activity": "Visit Amber Fort",
          "description": "Explore the magnificent Amber Fort...",
          "duration": "3 hours",
          "cost": 500
        }
      ]
    }
  ],
  "hiddenGems": [
    {
      "place": "Panna Meena ka Kund",
      "description": "A stepwell near Amber Fort...",
      "whySpecial": "Less crowded, photogenic"
    }
  ],
  "localInsights": [
    {
      "category": "Food",
      "insight": "Try the authentic Rajasthani thali at..."
    }
  ]
}
```

### Places

#### GET /places/nearby
Get nearby attractions.

**Query Parameters:**
- `lat` (double): Latitude
- `lng` (double): Longitude
- `radius` (int, optional): Search radius in meters (default: 5000)
- `type` (string, optional): Place type (tourist_attraction, restaurant, etc.)

#### GET /places/search
Search places.

**Query Parameters:**
- `query` (string): Search query
- `location` (string): Location for search

#### GET /places/{placeId}
Get place details.

### Subscriptions

#### POST /subscriptions
Create subscription.

**Request Body:**
```json
{
  "planType": "PRO",
  "paymentId": 1
}
```

#### GET /subscriptions/current
Get current user's subscription.

#### POST /subscriptions/cancel
Cancel subscription.

#### POST /subscriptions/renew
Renew subscription.

### Admin

#### GET /admin/dashboard
Get admin dashboard data.

**Response:**
```json
{
  "totalUsers": 1250,
  "totalGuides": 450,
  "totalBookings": 3200,
  "totalRevenue": 2500000,
  "pendingGuideApprovals": 12,
  "recentBookings": [],
  "topGuides": [],
  "revenueChart": []
}
```

#### GET /admin/users
Get all users with pagination.

#### GET /admin/guides
Get all guides with pagination.

#### POST /admin/guides/{id}/approve
Approve guide registration.

#### POST /admin/guides/{id}/reject
Reject guide registration.

**Request Body:**
```json
{
  "reason": "Insufficient documentation"
}
```

#### GET /admin/bookings
Get all bookings.

#### GET /admin/revenue
Get revenue analytics.

**Query Parameters:**
- `startDate` (date): Start date
- `endDate` (date): End date

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 500 | Internal Server Error |

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- Authentication endpoints: 5 requests per minute
- Booking endpoints: 10 requests per minute
- Other endpoints: 100 requests per minute

## WebSocket

Real-time chat is available via WebSocket:

**Connection URL:**
```
ws://localhost:8080/ws/chat
```

**Message Format:**
```json
{
  "type": "CHAT",
  "senderId": 1,
  "receiverId": 2,
  "content": "Hello!",
  "timestamp": "2024-03-23T12:00:00Z"
}
```

## Testing

Use the provided Swagger UI at `/swagger-ui.html` for interactive API testing.

## SDKs

Client SDKs are available for:
- JavaScript/TypeScript
- Java
- Python

See the `sdk/` directory for implementation details.
