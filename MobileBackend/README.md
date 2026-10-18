# MobileBackend - Civics Issue Reporting System

## Overview
This is the backend service for the Civics Issue Reporting System mobile application. It provides RESTful APIs for managing civic issues, user authentication, and notifications.

## Features Implemented

### Issue Management Endpoints
1. **POST /api/issues/create** - Create a new issue (Citizen only)
   - Multer middleware for handling multipart/form-data (image uploads)
   - Cloudinary integration for image storage
   - Zod validation for input data
   - Duplicate detection using geospatial queries
   - Priority calculation based on category, report frequency, and age
   - Tracking ID generation
   - Status history tracking

2. **GET /api/issues/myIssues** - Get user's issues with pagination (Citizen only)
   - Pagination support (page, limit)
   - Status filtering
   - Sorting by creation date (newest first)

3. **GET /api/issues/getIssue/:id** - Get issue details by ID
   - Ownership/authorization checks (owner, assignee, or admin)
   - Population of related user data (reporter, assignee, status history)

4. **GET /api/issues/nearby** - Get nearby issues based on geospatial query
   - Geospatial search using MongoDB 2dsphere index
   - Configurable search radius (default: 1000m)
   - Optional category filtering
   - Excludes resolved/rejected issues

5. **PATCH /api/issues/progress/:id** - Update issue progress (Officer only)
   - Status transitions (In Progress, Resolved)
   - Optional remark
   - Optional progress/image upload
   - Status workflow validation

6. **POST /api/issues/confirm/:id** - Confirm issue resolution (Citizen only)
   - Reporter-only access
   - Issue must be in Resolved status
   - Optional rating (1-5) and feedback

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (citizen, officer, admin)
- Protected routes with appropriate role restrictions
- Password hashing with bcryptjs

### Supporting Services
- **Priority Calculation Service**: Computes issue priority based on category severity, report frequency, and age
- **Duplicate Detection Service**: Identifies potential duplicate issues using geospatial queries
- **Status Workflow Service**: Manages valid status transitions
- **Cloudinary Integration**: Handles image uploads and storage
- **Multer Middleware**: Handles multipart/form-data for file uploads

## Technical Stack
- **Node.js** with **Express.js**
- **MongoDB** with **Mongoose** ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Zod** for input validation
- **Multer** for file upload handling
- **Cloudinary** for image storage
- **Helmet** & **CORS** for security
- **Dotenv** for environment configuration

## Environment Variables
Create a `.env` file based on `.env.example`:
```
PORT=5001
MONGODB_URI=mongodb://localhost:27017/civics-mobile
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
JWT_SECRET=your_jwt_secret_here_make_it_long_and_random
NODE_ENV=development
```

## API Documentation
See `API_CURL_EXAMPLES.md` for detailed cURL examples of all endpoints.

## Models
- **User**: Stores user information with role-based access control
- **Issue**: Stores issue details with geospatial indexing, status history, and priority calculation
- **Notification**: Stores user notifications (in shared/models)

## Installation & Setup
1. Install dependencies: `npm install`
2. Set up environment variables in `.env`
3. Ensure MongoDB is running
4. Start development server: `npm run dev`
5. Run tests: `npm test`

## Testing
Integration tests are written using Jest and Supertest. Tests use mongodb-memory-server for in-memory MongoDB instance during testing.

## Contributing
Follow the existing code style and patterns. Ensure all new endpoints have appropriate validation, error handling, and tests.

## License
MIT