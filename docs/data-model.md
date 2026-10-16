# QuickNotes Data Model & Database Schema

## Entities & Relationships

The QuickNotes database consists of four core relational entities:
1. **`users`**: Stores user profile details and authentication credentials.
2. **`notes`**: Stores individual user notes (titles, bodies, timestamps).
3. **`tags`**: Stores categorization tags created by users.
4. **`note_tags`**: A junction table resolving the many-to-many relationship between notes and tags.

### Relationship Summary:
* **`users` to `notes`**: One-to-Many (One user can author multiple notes; each note belongs to exactly one user).
* **`notes` to `tags`**: Many-to-Many (A note can have multiple tags, and a tag can be applied to multiple notes via `note_tags`).

---

## `CREATE TABLE` Statements

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    body TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(30) NOT NULL,
    CONSTRAINT unique_user_tag UNIQUE (user_id, name)
);

CREATE TABLE note_tags (
    note_id UUID NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (note_id, tag_id)
);

```

---

## Example SQL Queries

### 1. Fetch all notes for a specific user ordered by creation date

```sql
SELECT id, title, body, created_at 
FROM notes 
WHERE user_id = '4489c1a0-4a11-447c-9b11-92b0c3f01102' 
ORDER BY created_at DESC;

```

### 2. JOIN query: Retrieve all notes associated with a specific tag name for a user

```sql
SELECT n.id, n.title, n.body 
FROM notes n
JOIN note_tags nt ON n.id = nt.note_id
JOIN tags t ON nt.tag_id = t.id
WHERE n.user_id = '4489c1a0-4a11-447c-9b11-92b0c3f01102' 
  AND t.name = 'Work'
ORDER BY n.created_at DESC;

```

### 3. Aggregate query: Count total notes created per user

```sql
SELECT u.username, COUNT(n.id) AS total_notes
FROM users u
LEFT JOIN notes n ON u.id = n.user_id
GROUP BY u.id, u.username;

```

---

## Database Indexing Strategy

To maintain sub-millisecond query performance at scale, the following index is introduced:

```sql
CREATE INDEX idx_notes_user_id_created ON notes(user_id, created_at DESC);

```

**Justification:** Since users frequently load paginated lists of their own notes sorted by newest first, indexing `user_id` alongside `created_at DESC` allows the database engine to locate and return sorted records instantly without performing expensive sequential table scans.

---

## Database Architecture Justification: SQL vs. NoSQL

We chose a **Relational SQL Database (PostgreSQL)** for QuickNotes over NoSQL document stores. Notes and tags form tightly coupled relational schemas with strict foreign key constraints (e.g., cascading deletes when a user account is removed) and require complex JOIN operations across tags and notes. PostgreSQL provides robust transactional integrity (ACID compliance) and exceptional indexing capabilities suited for structured user data and relational integrity.