# TrailBuddy - Complete Test Cases

## 🚀 Getting Started

### 1. Start Backend
```bash
cd backend
mvn spring-boot:run
```
Backend runs at: http://localhost:8080/api

### 2. Start Frontend
```bash
cd frontend
npm run dev
```
Frontend runs at: http://localhost:5173

---

## 📋 Test Case 1: User Authentication

### 1.1 User Registration
**Steps:**
1. Go to http://localhost:5173/register
2. Fill registration form:
   - Full Name: Test User
   - Email: testuser@gmail.com
   - Phone: 9876543210
   - Password: Test@123
   - Confirm Password: Test@123
3. Click "Create Account"

**Expected Result:** 
- Success message: "User registered successfully!"
- Redirect to login page
- User receives verification email (check Mailtrap)

### 1.2 User Login
**Steps:**
1. Go to http://localhost:5173/login
2. Enter credentials:
   - Email: testuser@gmail.com
   - Password: Test@123
3. Click "Sign In"

**Expected Result:**
- JWT token stored in localStorage
- Redirect to Dashboard
- User profile loaded in navbar

### 1.3 Logout
**Steps:**
1. Click user avatar in navbar
2. Click "Logout"

**Expected Result:**
- Token removed from localStorage
- Redirect to login page
- Protected routes inaccessible

---

## 📋 Test Case 2: Guide Search & Discovery

### 2.1 Search Guides by City
**Steps:**
1. Login as user
2. Go to "Find Guides" page
3. Select City: "Goa" from dropdown
4. Click "Search"

**Expected Result:**
- List of guides from Goa displayed
- Guide cards show: name, rating, price, languages
- Filter options visible

### 2.2 Filter by Languages
**Steps:**
1. On guides page, check "Hindi" and "English"
2. Click "Apply Filters"

**Expected Result:**
- Only guides speaking Hindi/English shown
- URL updates with filter params

### 2.3 Filter by Price Range
**Steps:**
1. Set min price: 500
2. Set max price: 2000
3. Click "Apply Filters"

**Expected Result:**
- Guides with hourly rate 500-2000 shown
- Results update in real-time

### 2.4 View Guide Profile
**Steps:**
1. Click on any guide card
2. View full profile page

**Expected Result:**
- Guide details: bio, expertise, languages, reviews
- "Book Now" button visible
- Availability calendar shown

---

## 📋 Test Case 3: Booking Flow

### 3.1 Create Booking
**Steps:**
1. Login as user
2. Find a guide and click "Book Now"
3. Select dates:
   - Start Date: Tomorrow
   - End Date: Day after tomorrow
4. Select time slot
5. Enter special requirements: "Need help with photography spots"
6. Click "Continue to Payment"

**Expected Result:**
- Booking summary displayed
- Total amount calculated (guide fee + platform fee)
- Razorpay payment button visible

### 3.2 Payment Processing
**Steps:**
1. Click "Pay with Razorpay"
2. Use test card: 5267 3181 8797 5449
3. Enter any future expiry date
4. Enter CVV: 123
5. Complete payment

**Expected Result:**
- Payment success message
- Booking status: "CONFIRMED"
- Redirect to booking confirmation page
- Confirmation email sent

### 3.3 View My Bookings
**Steps:**
1. Go to "My Bookings" page
2. View list of all bookings

**Expected Result:**
- All user bookings displayed
- Status badges: PENDING, CONFIRMED, COMPLETED, CANCELLED
- Cancel option for pending bookings

---

## 📋 Test Case 4: Guide Registration

### 4.1 Register as Guide
**Steps:**
1. Login as regular user
2. Go to "Become a Guide" page
3. Fill guide registration form:
   - Bio: "Professional tour guide with 5 years experience"
   - City: Jaipur
   - State: Rajasthan
   - Languages: Hindi, English
   - Expertise: Historical Tours, Cultural Tours
   - Hourly Rate: 1500
   - Aadhar Number: 1234 5678 9012
4. Upload verification documents
5. Click "Submit Application"

**Expected Result:**
- Application submitted successfully
- Status: "Pending Approval"
- User role updated to include GUIDE

### 4.2 Guide Dashboard
**Steps:**
1. After approval, login as guide
2. Go to "Guide Dashboard"

**Expected Result:**
- Dashboard shows: total bookings, earnings, rating
- Availability management calendar
- Booking requests list

### 4.3 Manage Availability
**Steps:**
1. In Guide Dashboard, click "Set Availability"
2. Mark certain dates as unavailable
3. Click "Save"

**Expected Result:**
- Availability updated
- Users cannot book unavailable dates

---

## 📋 Test Case 5: Reviews & Ratings

### 5.1 Submit Review
**Steps:**
1. Complete a booking (must be in COMPLETED status)
2. Go to "My Bookings"
3. Click "Leave Review" on completed booking
4. Give 4.5 stars rating
5. Write review: "Great experience, very knowledgeable guide!"
6. Click "Submit Review"

**Expected Result:**
- Review saved successfully
- Guide's average rating updated
- Review visible on guide's profile

### 5.2 View Reviews
**Steps:**
1. Go to any guide profile
2. Scroll to "Reviews" section

**Expected Result:**
- All reviews displayed with ratings
- Average rating shown at top
- Star distribution graph visible

---

## 📋 Test Case 6: Chat System

### 6.1 Start Chat
**Steps:**
1. Login as user
2. Go to guide profile
3. Click "Message Guide"
4. Type: "Hi, are you available next weekend?"
5. Click Send

**Expected Result:**
- Message sent successfully
- Real-time message appears in chat window
- Guide receives notification

### 6.2 View Chat History
**Steps:**
1. Go to "Messages" page
2. View list of conversations

**Expected Result:**
- All conversations listed
- Unread message count badge
- Last message preview

---

## 📋 Test Case 7: AI Trip Planner

### 7.1 Generate Trip Plan
**Steps:**
1. Go to "AI Trip Planner" page
2. Enter destination: "Manali"
3. Select dates: 3 days trip
4. Select interests: Adventure, Nature, Photography
5. Click "Generate Plan"

**Expected Result:**
- AI generates day-by-day itinerary
- Shows places to visit, activities, estimated costs
- Option to book guides for the trip

---

## 📋 Test Case 8: User Profile Management

### 8.1 Update Profile
**Steps:**
1. Login as user
2. Click avatar → "Profile"
3. Update:
   - Profile Picture
   - Phone Number
   - Emergency Contact
4. Click "Save Changes"

**Expected Result:**
- Profile updated successfully
- Changes reflected immediately

### 8.2 Change Password
**Steps:**
1. In Profile page, click "Change Password"
2. Enter:
   - Current Password: Test@123
   - New Password: NewPass@456
   - Confirm Password: NewPass@456
3. Click "Update Password"

**Expected Result:**
- Password changed successfully
- Login with new password works

---

## 📋 Test Case 9: Admin Features

### 9.1 Admin Login
**Steps:**
1. Login with admin credentials:
   - Email: admin@trailbuddy.com
   - Password: admin123

**Expected Result:**
- Admin dashboard displayed
- Admin menu options visible

### 9.2 Approve Guide Application
**Steps:**
1. In Admin Dashboard, go to "Pending Guides"
2. View guide application details
3. Click "Approve"

**Expected Result:**
- Guide status changed to APPROVED
- Guide can now accept bookings
- Email sent to guide

### 9.3 Manage Users
**Steps:**
1. Go to "Users" section
2. View all registered users
3. Click on user to view details
4. Can suspend/activate user account

**Expected Result:**
- User list displayed with pagination
- Search and filter options work
- User status changes saved

---

## 📋 Test Case 10: Emergency & Safety Features

### 10.1 Emergency Contact
**Steps:**
1. In any page, click "Emergency" button (top right)
2. Click "Call Emergency Contact"

**Expected Result:**
- Emergency contact number displayed
- One-click calling enabled

### 10.2 Share Live Location
**Steps:**
1. During active booking, go to "My Booking"
2. Click "Share Location"
3. Share with emergency contact

**Expected Result:**
- Location shared in real-time
- Emergency contact receives notification

---

## 📋 Test Case 11: Subscription Plans

### 11.1 View Plans
**Steps:**
1. Go to "Subscription" page
2. View plan comparison:
   - Basic (Free)
   - Pro (₹299/month)
   - Premium (₹499/month)

**Expected Result:**
- All plans displayed with features
- Current plan highlighted

### 11.2 Upgrade to Pro
**Steps:**
1. Click "Upgrade" on Pro plan
2. Complete payment
3. Verify features unlocked

**Expected Result:**
- Payment processed
- Account upgraded to Pro
- Premium features accessible

---

## 📋 Test Case 12: Stories & Community

### 12.1 View Stories
**Steps:**
1. Go to "Travel Stories" page
2. Browse stories from guides

**Expected Result:**
- Stories displayed in grid layout
- Filter by location, guide

### 12.2 Post Story (Guide Only)
**Steps:**
1. Login as guide
2. Click "Share Your Story"
3. Upload photos, write experience
4. Tag location
5. Click "Post"

**Expected Result:**
- Story published
- Visible to all users
- Notifications sent to followers

---

## 🔍 API Testing with Postman/cURL

### Test Login API
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@gmail.com","password":"Test@123"}'
```

### Test Get Guides API
```bash
curl -X GET "http://localhost:8080/api/guides?city=Goa" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test Create Booking API
```bash
curl -X POST http://localhost:8080/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "guideId": 1,
    "startDate": "2025-04-01",
    "endDate": "2025-04-02",
    "totalAmount": 3000
  }'
```

---

## ✅ Test Data (Pre-populated)

### Test Users
| Role | Email | Password |
|------|-------|----------|
| User | testuser@gmail.com | Test@123 |
| Guide | guide@trailbuddy.com | Guide@123 |
| Admin | admin@trailbuddy.com | admin123 |

### Sample Guide Data
- Name: Rajesh Kumar
- City: Jaipur
- Languages: Hindi, English
- Expertise: Historical Tours, Cultural Tours
- Hourly Rate: ₹1200

---

## 🐛 Common Issues & Solutions

### Issue 1: 401 Unauthorized on Public APIs
**Solution:** Clear browser cache and localStorage, then reload page

### Issue 2: Payment Failed
**Solution:** Use Razorpay test cards only in development mode

### Issue 3: Chat messages not loading
**Solution:** Check WebSocket connection in browser console

### Issue 4: Images not uploading
**Solution:** Verify uploads folder exists and has write permissions

---

## 📊 Performance Testing

### Load Test Search API
```bash
# Use Apache Bench
ab -n 1000 -c 10 http://localhost:8080/api/guides?city=Goa
```

### Expected Performance
- Page Load: < 2 seconds
- API Response: < 500ms
- Search Results: < 1 second
- Payment Processing: < 3 seconds

---

## 🎉 Success Criteria

All features working correctly when:
- [x] User can register, login, logout
- [x] Guide search with filters works
- [x] Booking creation and payment works
- [x] Chat system works real-time
- [x] Reviews can be submitted
- [x] Admin can manage users/guides
- [x] AI Trip Planner generates itineraries
- [x] Profile updates saved
- [x] All APIs return 200/201 status
- [x] No console errors in frontend
