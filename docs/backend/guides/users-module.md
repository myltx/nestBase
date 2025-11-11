# Users Module API Documentation

## Overview

The Users module provides comprehensive user management functionality with role-based access control (RBAC). It supports creating, reading, updating, and deleting users with multi-role assignment.

## User Model

### Fields

| Field | Type | Required | Unique | Description |
|-------|------|----------|--------|-------------|
| `id` | UUID | Yes | Yes | Auto-generated user ID |
| `email` | String | Yes | Yes | User email address |
| `userName` | String | Yes | Yes | Username (3-20 characters) |
| `password` | String | Yes | No | Hashed password (min 6 characters) |
| `nickName` | String | No | No | User nickname/display name |
| `firstName` | String | No | No | User's first name |
| `lastName` | String | No | No | User's last name |
| `phone` | String | No | Yes | Phone number (unique when provided) |
| `gender` | Enum | No | No | Gender: MALE, FEMALE, or OTHER |
| `avatar` | String | No | No | Avatar URL |
| `isActive` | Boolean | Yes | No | Account active status (default: true) |
| `createdAt` | DateTime | Yes | No | Creation timestamp |
| `updatedAt` | DateTime | Yes | No | Last update timestamp |
| `roles` | Role[] | Yes | No | User roles (minimum 1 role) |

### Gender Enum

```typescript
enum Gender {
  MALE   // 男性
  FEMALE // 女性
  OTHER  // 其他
}
```

## API Endpoints

### 1. Create User

**Endpoint**: `POST /api/users`

**Access**: Admin only

**Description**: Create a new user with optional role assignment.

**Request Body**:
```json
{
  "email": "user@example.com",
  "userName": "johndoe",
  "password": "Password123!",
  "nickName": "John",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "13800138000",
  "gender": "MALE",
  "avatar": "https://avatar.example.com/user.jpg",
  "roleIds": ["role-uuid-1", "role-uuid-2"]
}
```

**Required Fields**: `email`, `userName`, `password`

**Optional Fields**: `nickName`, `firstName`, `lastName`, `phone`, `gender`, `avatar`, `roleIds`

**Default Behavior**: If `roleIds` is not provided or empty, the user is automatically assigned the `USER` role.

**Validation**:
- Email must be a valid email format and unique
- Username must be 3-20 characters and unique
- Password must be at least 6 characters
- Phone must be unique (if provided)
- Gender must be one of: MALE, FEMALE, OTHER
- Avatar must be a valid URL

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "userName": "johndoe",
    "nickName": "John",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "13800138000",
    "gender": "MALE",
    "avatar": "https://avatar.example.com/user.jpg",
    "isActive": true,
    "createdAt": "2025-10-15T12:00:00Z",
    "updatedAt": "2025-10-15T12:00:00Z",
    "roles": [
      {
        "id": "role-uuid-1",
        "code": "USER",
        "name": "普通用户"
      }
    ]
  }
}
```

**Error Responses**:
- `409 Conflict` - Email already exists (code: `EMAIL_ALREADY_EXISTS`)
- `409 Conflict` - Username already exists (code: `USERNAME_ALREADY_EXISTS`)
- `409 Conflict` - Phone already exists (code: `VALIDATION_ERROR`)
- `400 Bad Request` - Invalid role IDs (code: `NOT_FOUND`)
- `400 Bad Request` - System roles not initialized (code: `SYSTEM_ERROR`)

---

### 2. Get All Users (Paginated)

**Endpoint**: `GET /api/users`

**Access**: Authenticated users

**Description**: Retrieve a paginated list of users with optional search and role filtering.

**Query Parameters**:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `current` | Number | No | 1 | Current page number (min: 1) |
| `size` | Number | No | 10 | Items per page (min: 1) |
| `search` | String | No | - | Search by username, email, firstName, or lastName |
| `role` | String | No | - | Filter by role code (e.g., "ADMIN", "USER") |

**Example Request**:
```
GET /api/users?current=1&size=10&search=john&role=USER
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "uuid",
        "email": "user@example.com",
        "userName": "johndoe",
        "nickName": "John",
        "firstName": "John",
        "lastName": "Doe",
        "phone": "13800138000",
        "gender": "MALE",
        "avatar": "https://avatar.example.com/user.jpg",
        "isActive": true,
        "createdAt": "2025-10-15T12:00:00Z",
        "updatedAt": "2025-10-15T12:00:00Z",
        "roles": [
          {
            "id": "role-uuid",
            "code": "USER",
            "name": "普通用户"
          }
        ]
      }
    ],
    "current": 1,
    "size": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

**Error Responses**:
- `400 Bad Request` - Invalid page or size (code: `VALIDATION_ERROR`)

---

### 3. Get User by ID

**Endpoint**: `GET /api/users/:id`

**Access**: Authenticated users

**Description**: Retrieve a single user by their ID.

**Path Parameters**:
- `id` (UUID) - User ID

**Example Request**:
```
GET /api/users/550e8400-e29b-41d4-a716-446655440000
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "userName": "johndoe",
    "nickName": "John",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "13800138000",
    "gender": "MALE",
    "avatar": "https://avatar.example.com/user.jpg",
    "isActive": true,
    "createdAt": "2025-10-15T12:00:00Z",
    "updatedAt": "2025-10-15T12:00:00Z",
    "roles": [
      {
        "id": "role-uuid",
        "code": "USER",
        "name": "普通用户"
      }
    ]
  }
}
```

**Error Responses**:
- `404 Not Found` - User not found (code: `USER_NOT_FOUND`)

---

### 4. Update User

**Endpoint**: `PATCH /api/users/:id`

**Access**: Admin only

**Description**: Update user information including roles.

**Path Parameters**:
- `id` (UUID) - User ID

**Request Body** (all fields optional):
```json
{
  "nickName": "Johnny",
  "firstName": "Jonathan",
  "lastName": "Doe",
  "phone": "13900139000",
  "gender": "MALE",
  "avatar": "https://avatar.example.com/new-avatar.jpg",
  "password": "NewPassword123!",
  "roleIds": ["role-uuid-1", "role-uuid-2"],
  "isActive": false
}
```

**Updatable Fields**:
- Profile: `nickName`, `firstName`, `lastName`
- Contact: `phone` (must be unique)
- Demographics: `gender`
- Other: `avatar`, `password`, `isActive`
- Roles: `roleIds` (replaces all existing roles)

**Special Notes**:
- Password will be automatically hashed before storage
- Phone number uniqueness is checked (excluding current user)
- Role IDs must exist in the database
- Updating `isActive` to `false` will disable the account

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "userName": "johndoe",
    "nickName": "Johnny",
    "firstName": "Jonathan",
    "lastName": "Doe",
    "phone": "13900139000",
    "gender": "MALE",
    "avatar": "https://avatar.example.com/new-avatar.jpg",
    "isActive": false,
    "createdAt": "2025-10-15T12:00:00Z",
    "updatedAt": "2025-10-15T13:00:00Z",
    "roles": [
      {
        "id": "role-uuid-1",
        "code": "ADMIN",
        "name": "管理员"
      }
    ]
  }
}
```

**Error Responses**:
- `404 Not Found` - User not found (code: `USER_NOT_FOUND`)
- `409 Conflict` - Phone already in use (code: `VALIDATION_ERROR`)
- `400 Bad Request` - Invalid role IDs (code: `NOT_FOUND`)

---

### 5. Delete User

**Endpoint**: `DELETE /api/users/:id`

**Access**: Admin only

**Description**: Permanently delete a user and their role associations.

**Path Parameters**:
- `id` (UUID) - User ID

**Example Request**:
```
DELETE /api/users/550e8400-e29b-41d4-a716-446655440000
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "message": "用户删除成功"
  }
}
```

**Error Responses**:
- `404 Not Found` - User not found (code: `USER_NOT_FOUND`)

**Important**: This operation cascades and will also delete:
- All `userRoles` associations for this user

---

## Business Codes

The following business codes are used in error responses:

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `EMAIL_ALREADY_EXISTS` | 409 | Email address is already registered |
| `USERNAME_ALREADY_EXISTS` | 409 | Username is already taken |
| `USER_NOT_FOUND` | 404 | User with specified ID does not exist |
| `VALIDATION_ERROR` | 400 | Request validation failed (e.g., phone already exists, invalid page number) |
| `NOT_FOUND` | 400 | Specified role IDs do not exist |
| `SYSTEM_ERROR` | 400 | System roles not initialized |

---

## Examples

### Creating an Admin User

```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "email": "admin@example.com",
    "userName": "adminuser",
    "password": "Admin123!",
    "nickName": "系统管理员",
    "firstName": "Admin",
    "lastName": "User",
    "phone": "13800138001",
    "gender": "MALE",
    "roleIds": ["ADMIN_ROLE_UUID"]
  }'
```

### Searching Users

```bash
# Search for users containing "john" in any searchable field
curl -X GET "http://localhost:3000/api/users?search=john&current=1&size=20" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Filter users by role
curl -X GET "http://localhost:3000/api/users?role=ADMIN&current=1&size=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Updating User Profile

```bash
curl -X PATCH http://localhost:3000/api/users/USER_UUID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "nickName": "新昵称",
    "phone": "13900139000",
    "gender": "FEMALE"
  }'
```

### Deactivating a User

```bash
curl -X PATCH http://localhost:3000/api/users/USER_UUID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "isActive": false
  }'
```

---

## Notes

1. **Password Security**: Passwords are automatically hashed using bcrypt with 10 salt rounds before storage. Never store or transmit plain-text passwords.

2. **Role Management**: Users must have at least one role. When creating a user without specifying `roleIds`, the system automatically assigns the `USER` role.

3. **Unique Constraints**: The following fields must be unique:
   - `email` (always required)
   - `userName` (always required)
   - `phone` (when provided)

4. **Case-Insensitive Search**: The search parameter performs case-insensitive matching across `userName`, `email`, `firstName`, and `lastName`.

5. **Cascading Deletes**: Deleting a user will automatically remove all associated `userRoles` entries due to Prisma's cascade configuration.

6. **Field Naming**: All API fields use camelCase (e.g., `userName`, `nickName`), but are stored in the database using snake_case (e.g., `username`, `nickname`) via Prisma's `@map()` directive.

7. **Gender Field**: The `gender` field uses an enum with three values: `MALE`, `FEMALE`, `OTHER`. This field is optional and can be `null`.

8. **Phone Validation**: While the DTO includes phone validation decorators, the current implementation uses `@IsString()`. For production, consider using `@IsMobilePhone()` with appropriate locale settings.
