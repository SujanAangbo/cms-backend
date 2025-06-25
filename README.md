# CMS Backend

A Node.js Content Management System backend built with Express and MongoDB, following the MVC architecture.
```
## Features

- User authentication and authorization
- JWT-based authentication
- Role-based access control (Admin, Teacher, Student)
- Student management
- Teacher management
- Notice management
- Attendance tracking
- Secure API endpoints
- Input validation
- Error handling
- Cookie-based authentication for browser clients
- Token-based authentication for API clients
- MongoDB integration
```
## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4 or higher)
- npm or yarn

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd cms-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following variables:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/cms
JWT_SECRET=your_jwt_secret_key
REFRESH_TOKEN_SECRET=your_refresh_token_secret
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

4. Start the development server:
```bash
npm run dev
```

5. Access the frontend demo at: `http://localhost:3000`

## API Endpoints

### Authentication

#### Login

```
Endpoint: http://localhost:3000/api/auth/login
Method: POST
Body: {
    email: "user@example.com", (required)
    password: "password123", (required)
}
Output: {
    status: "success",
    message: "Login successful",
    data: {
        user: {
            _id: "60d0fe4f5311236168a109ca",
            firstName: "John",
            lastName: "Doe",
            email: "user@example.com",
            role: "STUDENT"
        },
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
}
Cookies: Sets accessToken and refreshToken cookies for browser clients
```

#### Logout

```
Endpoint: http://localhost:3000/api/auth/logout
Method: POST
Header: Authorization: Bearer token (for API clients)
Cookies: Uses accessToken cookie (for browser clients)
Output: {
    status: "success",
    message: "Logout successful"
}
Effect: Clears accessToken and refreshToken cookies
```

#### Change Password

```
Endpoint: http://localhost:3000/api/auth/change-password
Method: POST
Header: Authorization: Bearer token (for API clients)
Cookies: Uses accessToken cookie (for browser clients)
Body: {
    currentPassword: "password123", (required)
    newPassword: "newpassword123", (required)
}
Output: {
    status: "success",
    message: "Password changed successfully"
}
```

#### Forgot Password

```
Endpoint: http://localhost:3000/api/auth/forgot-password
Method: POST
Body: {
    email: "user@example.com", (required)
}
Output: {
    status: "success",
    message: "Password reset link sent to your email"
}
```

#### Reset Password

```
Endpoint: http://localhost:3000/api/auth/reset-password/:token
Method: POST
Body: {
    password: "newpassword123", (required)
}
Output: {
    status: "success",
    message: "Password reset successful"
}
```

#### Refresh Token

```
Endpoint: http://localhost:3000/api/auth/refresh-token
Method: POST
Header: Authorization: Bearer token
Output: {
    status: "success",
    message: "Token refreshed successfully",
    data: {
        token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
}
```

### Student Endpoints

#### Get Student Profile

```
Endpoint: http://localhost:3000/api/student/profile
Method: GET
Header: Authorization: Bearer token
Output: {
    status: "success",
    message: "Student profile retrieved successfully",
    data: {
        _id: "60d0fe4f5311236168a109ca",
        studentId: "STU001",
        user: {
            firstName: "John",
            lastName: "Doe",
            email: "student@example.com"
        },
        department: "Computer Science",
        semester: 3,
        year: 2,
        rollNumber: "CS2021001"
    }
}
```

#### Update Student Profile

```
Endpoint: http://localhost:3000/api/student/profile
Method: PUT
Header: Authorization: Bearer token
Body: {
    address: "123 Main St", (optional)
    parentContact: "+1234567890" (optional)
}
Output: {
    status: "success",
    message: "Profile updated successfully",
    data: {
        _id: "60d0fe4f5311236168a109ca",
        studentId: "STU001",
        user: {
            firstName: "John",
            lastName: "Doe",
            email: "student@example.com"
        },
        address: "123 Main St",
        parentContact: "+1234567890"
    }
}
```

#### Get Student Notices

```
Endpoint: http://localhost:3000/api/student/notices
Method: GET
Header: Authorization: Bearer token
Output: {
    status: "success",
    message: "Notices retrieved successfully",
    data: [
        {
            _id: "60d0fe4f5311236168a109ca",
            title: "Exam Schedule",
            content: "Final exams will be held from June 1 to June 15",
            targetAudience: "STUDENTS",
            priority: "HIGH",
            createdAt: "2023-01-15T10:30:00.000Z"
        }
    ]
}
```

#### Get Student Attendance

```
Endpoint: http://localhost:3000/api/student/attendance
Method: GET
Header: Authorization: Bearer token
Query Parameters: startDate=2023-01-01&endDate=2023-01-31&subjectId=60d0fe4f5311236168a109ca (optional)
Output: {
    status: "success",
    message: "Attendance retrieved successfully",
    data: [
        {
            _id: "60d0fe4f5311236168a109ca",
            subject: {
                name: "Data Structures",
                code: "CS201"
            },
            date: "2023-01-15T10:30:00.000Z",
            status: "PRESENT"
        }
    ]
}
```

#### Get Attendance Summary

```
Endpoint: http://localhost:3000/api/student/attendance/summary
Method: GET
Header: Authorization: Bearer token
Query Parameters: subjectId=60d0fe4f5311236168a109ca (optional)
Output: {
    status: "success",
    message: "Attendance summary retrieved successfully",
    data: {
        totalClasses: 30,
        present: 25,
        absent: 3,
        late: 2,
        attendancePercentage: 83.33
    }
}
```

### Teacher Endpoints

#### Get Teacher Profile

```
Endpoint: http://localhost:3000/api/teacher/profile
Method: GET
Header: Authorization: Bearer token
Output: {
    status: "success",
    message: "Teacher profile retrieved successfully",
    data: {
        _id: "60d0fe4f5311236168a109ca",
        teacherId: "TCH001",
        user: {
            firstName: "Jane",
            lastName: "Smith",
            email: "teacher@example.com"
        },
        department: "Computer Science",
        designation: "Assistant Professor",
        subjects: [
            {
                _id: "60d0fe4f5311236168a109ca",
                name: "Data Structures",
                code: "CS201"
            }
        ]
    }
}
```

#### Update Teacher Profile

```
Endpoint: http://localhost:3000/api/teacher/profile
Method: PUT
Header: Authorization: Bearer token
Body: {
    qualification: "PhD in Computer Science", (optional)
    experience: 5 (optional)
}
Output: {
    status: "success",
    message: "Profile updated successfully",
    data: {
        _id: "60d0fe4f5311236168a109ca",
        teacherId: "TCH001",
        user: {
            firstName: "Jane",
            lastName: "Smith",
            email: "teacher@example.com"
        },
        qualification: "PhD in Computer Science",
        experience: 5
    }
}
```

#### Get Teacher Notices

```
Endpoint: http://localhost:3000/api/teacher/notices
Method: GET
Header: Authorization: Bearer token
Output: {
    status: "success",
    message: "Notices retrieved successfully",
    data: [
        {
            _id: "60d0fe4f5311236168a109ca",
            title: "Faculty Meeting",
            content: "Faculty meeting will be held on June 1",
            targetAudience: "TEACHERS",
            priority: "MEDIUM",
            createdAt: "2023-01-15T10:30:00.000Z"
        }
    ]
}
```

#### Get Students by Subject

```
Endpoint: http://localhost:3000/api/teacher/students
Method: GET
Header: Authorization: Bearer token
Query Parameters: subjectId=60d0fe4f5311236168a109ca (required)
Output: {
    status: "success",
    message: "Students retrieved successfully",
    data: [
        {
            _id: "60d0fe4f5311236168a109ca",
            studentId: "STU001",
            user: {
                firstName: "John",
                lastName: "Doe",
                email: "student@example.com"
            },
            rollNumber: "CS2021001"
        }
    ]
}
```

#### Mark Attendance

```
Endpoint: http://localhost:3000/api/teacher/attendance
Method: POST
Header: Authorization: Bearer token
Body: {
    subjectId: "60d0fe4f5311236168a109ca", (required)
    date: "2023-01-15", (required)
    attendanceData: [ (required)
        {
            studentId: "60d0fe4f5311236168a109ca", (required)
            status: "PRESENT", (required)
            remarks: "On time" (optional)
        }
    ]
}
Output: {
    status: "success",
    message: "Attendance marked successfully"
}
```

#### Update Attendance

```
Endpoint: http://localhost:3000/api/teacher/attendance/:id
Method: PUT
Header: Authorization: Bearer token
Body: {
    status: "LATE", (required)
    remarks: "Arrived 10 minutes late" (optional)
}
Output: {
    status: "success",
    message: "Attendance updated successfully"
}
```

#### Get Class Attendance

```
Endpoint: http://localhost:3000/api/teacher/attendance/class/:subjectId
Method: GET
Header: Authorization: Bearer token
Query Parameters: startDate=2023-01-01&endDate=2023-01-31 (optional)
Output: {
    status: "success",
    message: "Class attendance retrieved successfully",
    data: [
        {
            date: "2023-01-15T10:30:00.000Z",
            attendanceCount: {
                total: 30,
                present: 25,
                absent: 3,
                late: 2
            },
            attendancePercentage: 83.33
        }
    ]
}
```

### Admin Endpoints

#### Get Admin Profile

```
Endpoint: http://localhost:3000/api/admin/profile
Method: GET
Header: Authorization: Bearer token
Output: {
    status: "success",
    message: "Admin profile retrieved successfully",
    data: {
        _id: "60d0fe4f5311236168a109ca",
        adminId: "ADM001",
        user: {
            firstName: "Admin",
            lastName: "User",
            email: "admin@example.com"
        },
        designation: "System Administrator"
    }
}
```

#### Update Admin Profile

```
Endpoint: http://localhost:3000/api/admin/profile
Method: PUT
Header: Authorization: Bearer token
Body: {
    designation: "Senior System Administrator" (optional)
}
Output: {
    status: "success",
    message: "Profile updated successfully",
    data: {
        _id: "60d0fe4f5311236168a109ca",
        adminId: "ADM001",
        user: {
            firstName: "Admin",
            lastName: "User",
            email: "admin@example.com"
        },
        designation: "Senior System Administrator"
    }
}
```

#### Get All Students

```
Endpoint: http://localhost:3000/api/admin/students
Method: GET
Header: Authorization: Bearer token
Query Parameters: department=Computer Science&semester=3&year=2 (all optional)
Output: {
    status: "success",
    message: "Students retrieved successfully",
    data: [
        {
            _id: "60d0fe4f5311236168a109ca",
            studentId: "STU001",
            user: {
                firstName: "John",
                lastName: "Doe",
                email: "student@example.com"
            },
            department: "Computer Science",
            semester: 3,
            year: 2,
            rollNumber: "CS2021001"
        }
    ]
}
```

#### Create Student

```
Endpoint: http://localhost:3000/api/admin/students
Method: POST
Header: Authorization: Bearer token
Body: {
    email: "newstudent@example.com", (required)
    password: "password123", (required)
    firstName: "New", (required)
    lastName: "Student", (required)
    studentId: "STU002", (required)
    department: "Computer Science", (required)
    semester: 3, (required)
    year: 2, (required)
    rollNumber: "CS2021002", (required)
    dateOfBirth: "2000-01-01", (optional)
    address: "123 Main St", (optional)
    parentContact: "+1234567890" (optional)
}
Output: {
    status: "success",
    message: "Student created successfully",
    data: {
        student: {
            _id: "60d0fe4f5311236168a109ca",
            studentId: "STU002",
            user: {
                firstName: "New",
                lastName: "Student",
                email: "newstudent@example.com"
            },
            department: "Computer Science",
            semester: 3,
            year: 2,
            rollNumber: "CS2021002"
        }
    }
}
```

#### Update Student

```
Endpoint: http://localhost:3000/api/admin/students/:id
Method: PUT
Header: Authorization: Bearer token
Body: {
    firstName: "Updated", (optional)
    lastName: "Name", (optional)
    department: "Computer Science", (optional)
    semester: 4, (optional)
    year: 2, (optional)
    rollNumber: "CS2021002", (optional)
    dateOfBirth: "2000-01-01", (optional)
    address: "123 Main St", (optional)
    parentContact: "+1234567890" (optional)
}
Output: {
    status: "success",
    message: "Student updated successfully",
    data: {
        student: {
            _id: "60d0fe4f5311236168a109ca",
            studentId: "STU002",
            user: {
                firstName: "Updated",
                lastName: "Name",
                email: "newstudent@example.com"
            },
            department: "Computer Science",
            semester: 4,
            year: 2,
            rollNumber: "CS2021002"
        }
    }
}
```

#### Delete Student

```
Endpoint: http://localhost:3000/api/admin/students/:id
Method: DELETE
Header: Authorization: Bearer token
Output: {
    status: "success",
    message: "Student deleted successfully"
}
```

#### Get All Teachers

```
Endpoint: http://localhost:3000/api/admin/teachers
Method: GET
Header: Authorization: Bearer token
Query Parameters: department=Computer Science (optional)
Output: {
    status: "success",
    message: "Teachers retrieved successfully",
    data: [
        {
            _id: "60d0fe4f5311236168a109ca",
            teacherId: "TCH001",
            user: {
                firstName: "Jane",
                lastName: "Smith",
                email: "teacher@example.com"
            },
            department: "Computer Science",
            designation: "Assistant Professor"
        }
    ]
}
```

#### Create Teacher

```
Endpoint: http://localhost:3000/api/admin/teachers
Method: POST
Header: Authorization: Bearer token
Body: {
    email: "newteacher@example.com", (required)
    password: "password123", (required)
    firstName: "New", (required)
    lastName: "Teacher", (required)
    teacherId: "TCH002", (required)
    department: "Computer Science", (required)
    designation: "Assistant Professor", (required)
    qualification: "PhD in Computer Science", (required)
    experience: 5, (required)
    joiningDate: "2022-01-01" (required)
}
Output: {
    status: "success",
    message: "Teacher created successfully",
    data: {
        teacher: {
            _id: "60d0fe4f5311236168a109ca",
            teacherId: "TCH002",
            user: {
                firstName: "New",
                lastName: "Teacher",
                email: "newteacher@example.com"
            },
            department: "Computer Science",
            designation: "Assistant Professor"
        }
    }
}
```

#### Update Teacher

```
Endpoint: http://localhost:3000/api/admin/teachers/:id
Method: PUT
Header: Authorization: Bearer token
Body: {
    firstName: "Updated", (optional)
    lastName: "Name", (optional)
    department: "Computer Science", (optional)
    designation: "Associate Professor", (optional)
    qualification: "PhD in Computer Science", (optional)
    experience: 7 (optional)
}
Output: {
    status: "success",
    message: "Teacher updated successfully",
    data: {
        teacher: {
            _id: "60d0fe4f5311236168a109ca",
            teacherId: "TCH002",
            user: {
                firstName: "Updated",
                lastName: "Name",
                email: "newteacher@example.com"
            },
            department: "Computer Science",
            designation: "Associate Professor"
        }
    }
}
```

#### Delete Teacher

```
Endpoint: http://localhost:3000/api/admin/teachers/:id
Method: DELETE
Header: Authorization: Bearer token
Output: {
    status: "success",
    message: "Teacher deleted successfully"
}
```

#### Get All Notices

```
Endpoint: http://localhost:3000/api/admin/notices
Method: GET
Header: Authorization: Bearer token
Output: {
    status: "success",
    message: "Notices retrieved successfully",
    data: [
        {
            _id: "60d0fe4f5311236168a109ca",
            title: "Important Announcement",
            content: "This is an important announcement for all students.",
            targetAudience: "STUDENTS",
            priority: "HIGH",
            createdBy: {
                firstName: "Admin",
                lastName: "User"
            },
            createdAt: "2023-01-15T10:30:00.000Z"
        }
    ]
}
```

#### Create Notice

```
Endpoint: http://localhost:3000/api/admin/notices
Method: POST
Header: Authorization: Bearer token
Body: {
    title: "Important Announcement", (required)
    content: "This is an important announcement for all students.", (required)
    targetAudience: "STUDENTS", (required)
    priority: "HIGH", (optional)
    department: "Computer Science", (optional, required if targetAudience is DEPARTMENT)
    expiryDate: "2023-12-31" (optional)
}
Output: {
    status: "success",
    message: "Notice created successfully",
    data: {
        notice: {
            _id: "60d0fe4f5311236168a109ca",
            title: "Important Announcement",
            content: "This is an important announcement for all students.",
            targetAudience: "STUDENTS",
            priority: "HIGH",
            createdBy: {
                firstName: "Admin",
                lastName: "User"
            },
            createdAt: "2023-01-15T10:30:00.000Z"
        }
    }
}
```

#### Update Notice

```
Endpoint: http://localhost:3000/api/admin/notices/:id
Method: PUT
Header: Authorization: Bearer token
Body: {
    title: "Updated Announcement", (optional)
    content: "This is an updated announcement.", (optional)
    targetAudience: "ALL", (optional)
    priority: "MEDIUM", (optional)
    department: "Computer Science", (optional)
    isActive: true, (optional)
    expiryDate: "2023-12-31" (optional)
}
Output: {
    status: "success",
    message: "Notice updated successfully",
    data: {
        notice: {
            _id: "60d0fe4f5311236168a109ca",
            title: "Updated Announcement",
            content: "This is an updated announcement.",
            targetAudience: "ALL",
            priority: "MEDIUM",
            isActive: true,
            createdBy: {
                firstName: "Admin",
                lastName: "User"
            },
            updatedAt: "2023-01-16T10:30:00.000Z"
        }
    }
}
```

#### Delete Notice

```
Endpoint: http://localhost:3000/api/admin/notices/:id
Method: DELETE
Header: Authorization: Bearer token
Output: {
    status: "success",
    message: "Notice deleted successfully"
}
```
## Authentication

The system supports two authentication methods:

### 1. Cookie-based Authentication (for Browser Clients)

When using the system in a web browser:

- Upon successful login, the server sets two HTTP-only cookies:
  - `accessToken`: Short-lived token (1 hour) for API access
  - `refreshToken`: Long-lived token (7 days) for obtaining new access tokens
- Subsequent requests automatically include these cookies
- The `/api/auth/refresh-token` endpoint can be used to obtain a new access token using the refresh token cookie
- Logout clears both cookies

### 2. Token-based Authentication (for API Clients)

When using the API directly (e.g., via Postman):

- Include the JWT token in the Authorization header for all protected endpoints:
  ```
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```
- You can obtain tokens by logging in through the `/api/auth/login` endpoint
- Use the returned refresh token with the `/api/auth/refresh-token` endpoint to get a new access token when needed

## Error Responses

All API errors follow a consistent format:

```json
{
  "status": "error",
  "message": "Error message description",
  "error": {
    "statusCode": 400,
    "name": "ValidationError",
    "details": [...] // Optional additional error details
  }
}
```

## Using the Postman Collection

A comprehensive Postman collection is included in the repository to help you test and explore the API:

1. Import the `cms-api-collection.json` file into Postman
2. Set up an environment with the following variables:
   - `base_url`: Your server URL (default: `http://localhost:3000`)
3. Use the collection to test all available endpoints

### Collection Features

- Organized into folders by role (Authentication, Student, Teacher, Admin)
- Detailed request descriptions and documentation
- Pre-request scripts to handle authentication
- Test scripts to automatically extract and store tokens
- Environment variables for easy configuration

### Authentication in Postman

The collection includes two authentication methods:

1. **Token-based Authentication**:
   - Login using the Authentication/Login request
   - The collection automatically extracts and stores the access token
   - Subsequent requests use the stored token in the Authorization header

2. **Cookie-based Authentication**:
   - Enable "Send cookies" in Postman settings
   - Use the Authentication/Login request
   - Cookies will be automatically included in subsequent requests

## Status Codes

- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

## Frontend Implementation

A simple HTML/JavaScript frontend is included to demonstrate cookie-based authentication:

### Files

- `public/index.html`: Basic login form and dashboard UI
- `public/js/auth.js`: JavaScript for handling authentication

### Features

- Login form with error handling
- Automatic token refresh using cookies
- User dashboard displaying profile information
- Logout functionality

### How It Works

1. When a user logs in, the server sets HTTP-only cookies for the access and refresh tokens
2. The frontend stores basic user information in localStorage for convenience
3. On page load, the frontend attempts to refresh the token using the refresh token cookie
4. If successful, the user is automatically logged in
5. All API requests include credentials to send the cookies
6. When the user logs out, both the cookies and localStorage are cleared

### Security Benefits

- HTTP-only cookies protect tokens from XSS attacks
- Automatic token refresh provides better UX without compromising security
- Short-lived access tokens minimize the impact of token theft


## Project Structure

```
src/
├── config/
│   └── database.js
├── controllers/
│   └── user.controller.js
├── middlewares/
│   └── auth.middleware.js
├── models/
│   └── user.model.js
├── routes/
│   └── user.routes.js
├── services/
│   └── user.service.js
├── validators/
│   └── user.validator.js
└── app.js
```

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests

## Error Handling

The API uses consistent error responses:

```json
{
  "status": "error",
  "message": "Error message here"
}
```

## Validation

Input validation is implemented using express-validator. All user inputs are validated before processing.

## Security

- Passwords are hashed using bcrypt
- JWT for authentication
- CORS enabled
- Request data validation
- MongoDB injection prevention
- Secure HTTP headers