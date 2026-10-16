```markdown
# QuickNotes System Architecture & Scaling Document

## 1. Requirements

### Functional Requirements
* Users can register, log in, and authenticate via JWT.
* Users can create, read, update, and delete (CRUD) notes securely.
* Users can organize notes using custom tags.

### Non-Functional Requirements
* **High Availability:** 99.9% uptime SLA.
* **Low Latency:** API response times under 200ms for read operations globally.
* **Scalability:** Support 1,000,000 active users with smooth traffic spikes.

---

## 2. Back-of-the-Envelope Load Estimates (1 Million Users)

* **Active User Base:** 1,000,000 DAU (Daily Active Users).
* **Read Requests:** Assuming an average user reads 20 notes per day:
  * Total Daily Reads = $1,000,000 \times 20 = 20,000,000$ reads/day.
  * Queries Per Second (QPS) Average = $\frac{20,000,000}{86,400 \text{ seconds}} \approx 231 \text{ QPS}$.
  * Peak Read QPS (3x multiplier) $\approx 694 \text{ QPS}$.
* **Write Requests:** Assuming an average user creates/updates 3 notes per day:
  * Total Daily Writes = $1,000,000 \times 3 = 3,000,000$ writes/day.
  * Write QPS Average = $\frac{3,000,000}{86,400} \approx 35 \text{ QPS}$.
* **Storage Estimation:**
  * Average note size = 2 KB (including metadata and tag references).
  * Daily Storage = $3,000,000 \text{ writes/day} \times 2 \text{ KB} = 6,000,000 \text{ KB/day} \approx 6 \text{ GB/day}$.
  * Yearly Storage = $6 \text{ GB/day} \times 365 = 2,190 \text{ GB/year} \approx 2.2 \text{ TB/year}$.

---

## 3. High-Level Architecture Diagram

```text
[ Clients (Web / Mobile) ]
           │
           ▼
        [ DNS ] (Cloudflare / Route 53)
           │
           ▼
    [ CDN & Load Balancer ] (Nginx / ALB)
           │
     ┌─────┴─────┐
     ▼           ▼
[ App Server 1 ] [ App Server 2 ] (Node.js / NestJS cluster)
     │           │
     ├───────────┼───────────┐
     ▼           ▼           ▼
[ Redis Cache ] [ Primary DB ] [ Read Replica DB ] (PostgreSQL)
                 │
           [ Message Queue ] (RabbitMQ / SQS)
                 │
           [ Background Worker ]

```

---

## 4. Component Breakdown & Problem Solved

1. **DNS (Domain Name Service):** Resolves human-readable domain names to optimized server IP addresses globally.
2. **CDN (Content Delivery Network):** Caches static assets (HTML, CSS, JS) at edge locations closer to users to reduce latency and origin server load.
3. **Load Balancer:** Distributes incoming traffic evenly across multiple application servers to prevent server overload and single-instance bottlenecks.
4. **App Servers (Cluster):** Execute business logic, request validation, authentication, and API controllers.
5. **Redis Cache:** Stores hot session data and frequently accessed user note lists in-memory to reduce database round-trips.
6. **Primary Database & Read Replica:** Handles persistent relational storage; writes go to the primary node, while reads are offloaded to read replicas to scale query throughput.
7. **Message Queue & Worker:** Asynchronously processes heavy background tasks like email notifications, search index synchronization, and analytics logging.

---

## 5. Step-by-Step Request Flows

### Flow A: `GET /notes` (Reading Notes)

1. Client sends `GET /api/v1/notes` request through the Load Balancer.
2. Application server checks **Redis Cache** for cached notes corresponding to the authenticated user ID.
3. If cache hit, data is returned immediately ($\sim 5\text{ms}$).
4. If cache miss, the server queries the **PostgreSQL Read Replica** using indexed lookup (`user_id` and `created_at`).
5. Results are populated back into Redis cache and returned to the client with a `200 OK` status.

### Flow B: `POST /notes` (Creating a Note)

1. Client sends `POST /api/v1/notes` with a JSON payload containing the title and body.
2. Application server validates JWT authentication and checks that title length $\le 100$ characters.
3. Validated note transaction is written directly to the **Primary Database**.
4. The database triggers an asynchronous event published to the **Message Queue** to update search indexes and cache invalidation keys.
5. Server responds to the client with `201 Created` and the newly minted note object.

---

## 6. Architectural Trade-Offs & SPOF Mitigations

* **Trade-Off 1: Consistency vs. Performance (Caching)**
* *Trade-off:* Implementing Redis caching introduces a risk of eventual consistency (where a newly updated note might take a few milliseconds to reflect if read from cache).
* *Mitigation:* Write-through cache invalidation ensures that any `PUT`, `POST`, or `DELETE` request explicitly clears or updates the corresponding cache key instantly.


* **Trade-Off 2: Complexity vs. Scale (Read Replicas)**
* *Trade-off:* Adding read replicas increases infrastructure complexity and database replication lag.
* *Mitigation:* Managed database services (like AWS RDS PostgreSQL) handle replication monitoring automatically, keeping replication lag under 100 milliseconds.


* **Single Points of Failure (SPOF) Mitigations:**
* **App Servers:** Multi-instance deployment behind a Load Balancer ensures if one server crashes, traffic routes to healthy instances.
* **Database:** Primary database failure triggers automatic failover to a standby synchronized Read Replica promoted to primary within seconds.



```

```