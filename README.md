# 📚 Books.Inc. Backend - REST API Server

This repository hosts the backend of the Books.Inc. book exchange platform (see below for more information about the full application and links to the frontend repository).

## Description

This is the REST API server for Books.Inc., providing all the backend functionality needed to power the book exchange platform.

It handles user authentication, book management, reservations, and integrates with external book APIs to create a full book sharing experience.

## Technologies Used

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT
- **HTTP Client**: Axios
- **External APIs**: Open Library API & Google Books API

## API Features

- **User authentication**: Secure registration, login, and JWT-based session management
- **Lending library management**: Add, update, delete, and search personal book collections
- **Book discovery**: Search available books to borrow from other users with advanced filtering
- **Reservation system**: Request and manage book borrowing with custom durations
- **External book data**: Integration with Open Library and Google Books APIs

## API Endpoints

### Authentication Routes (`/auth`)
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login (returns JWT token)
- `GET /auth/verify` - Verify JWT token validity

### Book Search Routes (`/api`)
- `GET /api/search-books` - Search external APIs (Open Library + Google Books)

### Personal Lending Library Routes (`/api`)
- `GET /api/mybooks` - Get user's personal lending book library
- `POST /api/mybooks/add` - Add a new book to personal lending library
- `PUT /api/mybooks/:id` - Update book details in the library (availability, duration, etc.)
- `DELETE /api/mybooks/:id` - Remove book from personal lending library
- `GET /api/search-available-books` - Search books available for borrowing from other users

### Reservation Routes (`/api`)
- `POST /api/reservations` - Create a new book reservation
- `DELETE /api/reservations/:id` - Cancel a reservation

## Installation & Setup

### Prerequisites

- Node.js (version 16 or higher)
- MongoDB (local installation or MongoDB Atlas)
- npm or yarn package manager

### Steps to Run Locally

1. **Clone the repository**
```bash
git clone https://github.com/TheMediterraneans/book-exchange-backend.git
cd book-exchange-backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Configuration**
Create a `.env` file in the root directory and add:
```env
PORT=5005
MONGODB_URI=mongodb://127.0.0.1:27017/book-exchange-backend
TOKEN_SECRET=your-super-secret-jwt-key-here
ORIGIN=http://localhost:5173
```

**Environment Variables Explained:**
- `PORT`: Server port (default: 5005)
- `MONGODB_URI`: MongoDB connection string
- `TOKEN_SECRET`: Secret key for JWT token signing (use a strong random string)
- `ORIGIN`: Frontend URL for CORS configuration

4. **Start MongoDB**

Make sure MongoDB is running on your system:

```bash
# If using local MongoDB
mongod

# Or if using MongoDB as a service
brew services start mongodb/brew/mongodb-community
```

5. **Run the application**

**Development mode** (with auto-restart):
```bash
npm run dev
```


6. **Verify the server is running**

Navigate to `http://localhost:5005/api/` - you should see:
```json
{"message": "Book exchange api is running"}
```


## Development Tools

- **Nodemon**: Automatic server restart during development
- **Morgan**: HTTP request logging for debugging
- **Express Error Handling**: Centralized error management system

## Testing the API

You can test the API endpoints using tools like:
- **Postman** for GUI testing
- **curl** for command-line testing


Example API call:
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:5005/api/mybooks
```

## Team

Created by **Luana + Zefi** as part of the Ironhack Web Development bootcamp.

## 🔗 Books.Inc. FRONTEND

**For the complete Books.Inc. experience, check out the frontend**: https://github.com/TheMediterraneans/book-exchange-frontend

*The frontend provides the user interface for browsing, searching, and managing books.*
