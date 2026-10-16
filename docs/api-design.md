```markdown
# QuickNotes API Design Specification

This document details the production REST API specification for the QuickNotes backend service.

## Endpoint Table

| Method | Path | Description | Success Status |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/notes` | Retrieve a paginated list of notes for the authenticated user | `200 OK` |
| **POST** | `/api/v1/notes` | Create a new note | `201 Created` |
| **GET** | `/api/v1/notes/{id}` | Retrieve a specific note by ID | `200 OK` |
| **PUT** | `/api/v1/notes/{id}` | Fully update an existing note | `200 OK` |
| **DELETE** | `/api/v1/notes/{id}` | Delete a specific note | `204 No Content` |
| **GET** | `/api/v1/tags` | Retrieve all user tags for organization | `200 OK` |

---

## Request & Response Examples

### 1. Creating a Note (`POST /api/v1/notes`)
**Request Headers:**
```http
Authorization: Bearer eyJhbGciOiJIUzI1...
Content-Type: application/json

```

**Request Body:**

```json
{
  "title": "System Architecture Review",
  "body": "Ensure read replicas are provisioned before launching the caching layer.",
  "tag_ids": [2, 5]
}

```

**Response Body (`201 Created`):**

```json
{
  "status": "success",
  "code": 201,
  "data": {
    "id": "note_9f83a1b4-7c2d",
    "user_id": "usr_4489c1a0",
    "title": "System Architecture Review",
    "body": "Ensure read replicas are provisioned before launching the caching layer.",
    "created_at": "2026-10-16T10:30:00Z",
    "updated_at": "2026-10-16T10:30:00Z"
  }
}

```

---

### 2. Listing Notes (`GET /api/v1/notes?limit=2&page=1`)

**Response Body (`200 OK`):**

```json
{
  "status": "success",
  "code": 200,
  "pagination": {
    "total": 42,
    "page": 1,
    "limit": 2,
    "total_pages": 21
  },
  "data": [
    {
      "id": "note_9f83a1b4-7c2d",
      "title": "System Architecture Review",
      "body": "Ensure read replicas are provisioned...",
      "created_at": "2026-10-16T10:30:00Z"
    },
    {
      "id": "note_3e21b8c9-1f4a",
      "title": "Grocery List",
      "body": "Milk, eggs, coffee beans, oats.",
      "created_at": "2026-10-15T14:12:00Z"
    }
  ]
}

```

---

## Error Status Codes & Handling

The API uses standard HTTP status codes accompanied by a structured error payload.

* **`400 Bad Request`**: Validation failure (e.g., missing title or title over 100 characters).
* **`401 Unauthorized`**: Missing or expired JWT bearer token.
* **`403 Forbidden`**: Authenticated user attempts to access or modify a note belonging to another user.
* **`404 Not Found`**: The requested note ID or route does not exist.
* **`500 Internal Server Error`**: Unexpected database failure or downstream service crash.

### Example Error Response Body (`400 Bad Request`)

```json
{
  "status": "error",
  "code": 400,
  "error": {
    "message": "Validation failed",
    "details": [
      {
        "field": "title",
        "issue": "Field is required and must not exceed 100 characters."
      }
    ]
  }
}

```

```

```