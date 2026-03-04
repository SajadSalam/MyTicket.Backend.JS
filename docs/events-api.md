# Events API — Frontend Integration Guide

## Overview

Events are created by admins and go through a defined lifecycle before they become visible and bookable by users.

### Lifecycle

```
Create Event
  (DRAFT)
     │
     ▼
Add Category Pricing (one per template category)
     │
     ▼
Mark Seats for Sale  ──┐
                       │  via Seatsio client-side (uses seatioEventKey)
Mark Tables for Sale ──┘
     │
     ▼
Publish  ──►  PUBLISHED
                 │
          Unpublish (→ DRAFT)
          Cancel   (→ CANCELLED)
```

A newly created event always starts as **DRAFT**. It cannot be published until at least one category pricing is set. Before publishing, the admin must also mark the desired seats and tables as "for sale" in Seatsio using the event's `seatioEventKey`.

---

## Base URL

```
/events
```

All write operations (POST, PUT, PATCH, DELETE) require an admin JWT token in the `Authorization` header:

```
Authorization: Bearer <token>
```

---

## Event Object

```json
{
  "id": "uuid",
  "name": "Summer Music Festival 2025",
  "description": "A short description",
  "content": "Full rich-text or HTML content...",
  "mainImage": "https://example.com/main.jpg",
  "images": ["https://example.com/1.jpg", "https://example.com/2.jpg"],
  "startDate": "2025-07-01T18:00:00.000Z",
  "endDate": "2025-07-03T23:59:59.000Z",
  "bookingStartDate": "2025-06-01T00:00:00.000Z",
  "bookingEndDate": "2025-06-30T23:59:59.000Z",
  "tags": ["music", "festival", "summer"],
  "location": "Central Park, New York",
  "lat": "40.7850910",
  "lng": "-73.9682850",
  "status": "draft",
  "templateId": "uuid",
  "template": { ... },
  "categoryPricings": [ ... ],
  "seatioEventKey": "ev-abc123",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

### Status values

| Value | Meaning |
|-------|---------|
| `draft` | Not visible to the public, still being configured |
| `published` | Live and visible to users, bookings allowed |
| `cancelled` | Terminal state, cannot be changed |

---

## Category Pricing Object

```json
{
  "id": "uuid",
  "eventId": "uuid",
  "categoryKey": "1",
  "categoryLabel": "VIP",
  "price": "75000.00",
  "currency": "IQD",
  "description": "Front-row VIP seats with exclusive lounge access",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z"
}
```

> `categoryKey` must match one of the category keys defined in the event's template (seating chart). You can retrieve the available category keys from the template object returned with the event.

---

## Endpoints

---

### 1. List Events

```
GET /events
```

**Auth:** Public

**Query Parameters**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `page` | number | No | Page number, default `1` |
| `limit` | number | No | Items per page, default `10`, max `100` |
| `status` | string | No | Filter by status: `draft`, `published`, `cancelled` |
| `search` | string | No | Search by event name (case-insensitive) |
| `tags` | string | No | Comma-separated tags to filter by (e.g. `music,festival`) |

**Response `200`**

```json
{
  "data": [ { ...Event } ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 42,
    "totalPages": 5,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

---

### 2. Get Event by ID

```
GET /events/:id
```

**Auth:** Public

Returns the full event object including `template` and `categoryPricings`.

**Response `200`** — Event object

**Response `404`**
```json
{ "message": "Event not found" }
```

---

### 3. Create Event

```
POST /events
```

**Auth:** Admin

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `templateId` | string (UUID) | Yes | ID of the seating template to use |
| `name` | string | Yes | Event name |
| `description` | string | No | Short description |
| `content` | string | No | Full rich-text / HTML content |
| `mainImage` | string (URL) | No | Main cover image URL |
| `images` | string[] | No | Additional image URLs |
| `startDate` | ISO 8601 string | Yes | Event start date/time |
| `endDate` | ISO 8601 string | Yes | Event end date/time |
| `bookingStartDate` | ISO 8601 string | Yes | When booking opens |
| `bookingEndDate` | ISO 8601 string | Yes | When booking closes |
| `tags` | string[] | No | List of tags |
| `location` | string | No | Human-readable location text |
| `lat` | number | No | Latitude (-90 to 90) |
| `lng` | number | No | Longitude (-180 to 180) |

**Example**
```json
{
  "templateId": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Summer Music Festival 2025",
  "description": "A great outdoor festival",
  "startDate": "2025-07-01T18:00:00.000Z",
  "endDate": "2025-07-03T23:59:59.000Z",
  "bookingStartDate": "2025-06-01T00:00:00.000Z",
  "bookingEndDate": "2025-06-30T23:59:59.000Z",
  "tags": ["music", "summer"],
  "location": "Central Park, New York",
  "lat": 40.785091,
  "lng": -73.968285
}
```

**Response `201`**
```json
{
  "event": { ...Event },
  "message": "Event created successfully"
}
```

> The event is created with `status: "draft"`. A Seatsio event is automatically provisioned in the background.

---

### 4. Update Event

```
PUT /events/:id
```

**Auth:** Admin

All fields are optional. Only the fields you send will be updated.

**Request Body** — same fields as Create Event, all optional (except `templateId` which cannot be changed).

**Response `200`**
```json
{ "message": "Event updated successfully" }
```

**Response `404`**
```json
{ "message": "Event not found" }
```

---

### 5. Delete Event

```
DELETE /events/:id
```

**Auth:** Admin

**Response `200`**
```json
{ "message": "Event deleted successfully" }
```

**Response `404`**
```json
{ "message": "Event not found" }
```

---

## Category Pricing Endpoints

These endpoints manage the ticket prices per seating category for a specific event.

---

### 6. List Category Pricings

```
GET /events/:id/categories
```

**Auth:** Public

**Response `200`** — Array of Category Pricing objects
```json
[
  {
    "id": "uuid",
    "eventId": "uuid",
    "categoryKey": "1",
    "categoryLabel": "VIP",
    "price": "75000.00",
    "currency": "IQD",
    "description": "Front-row VIP seats",
    "createdAt": "...",
    "updatedAt": "..."
  },
  {
    "id": "uuid",
    "eventId": "uuid",
    "categoryKey": "2",
    "categoryLabel": "Regular",
    "price": "25000.00",
    "currency": "IQD",
    "description": null,
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

**Response `404`**
```json
{ "message": "Event not found" }
```

---

### 7. Add Category Pricing

```
POST /events/:id/categories
```

**Auth:** Admin

**Request Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `categoryKey` | string | Yes | Must match a category key from the event's template |
| `categoryLabel` | string | Yes | Display name for this category |
| `price` | number | Yes | Price amount (positive number) |
| `currency` | string | No | Currency code, default `IQD` |
| `description` | string | No | Optional extra info shown to buyers |

**Example**
```json
{
  "categoryKey": "1",
  "categoryLabel": "VIP",
  "price": 75000,
  "currency": "IQD",
  "description": "Front-row VIP seats with exclusive lounge access"
}
```

**Response `201`** — Category Pricing object

**Response `400`**
```json
{ "message": "Category key \"1\" does not exist in the event template" }
```

**Response `409`**
```json
{ "message": "Pricing for category \"1\" already exists. Use PUT to update it." }
```

**Response `404`**
```json
{ "message": "Event not found" }
```

> Each category can only have one pricing entry per event. If you need to change a price, use the Update endpoint.

---

### 8. Update Category Pricing

```
PUT /events/:id/categories/:pricingId
```

**Auth:** Admin

All fields are optional.

| Field | Type | Description |
|-------|------|-------------|
| `categoryLabel` | string | Updated display name |
| `price` | number | New price amount |
| `currency` | string | New currency code |
| `description` | string | Updated description |

**Response `200`** — Updated Category Pricing object

**Response `404`**
```json
{ "message": "Category pricing not found" }
```

---

### 9. Delete Category Pricing

```
DELETE /events/:id/categories/:pricingId
```

**Auth:** Admin

**Response `200`**
```json
{ "message": "Category pricing deleted successfully" }
```

**Response `404`**
```json
{ "message": "Category pricing not found" }
```

---

## Status Transition Endpoints

---

### 10. Publish Event

```
PATCH /events/:id/publish
```

**Auth:** Admin

Moves the event from `draft` → `published`.

**Precondition:** At least one category pricing must be added before publishing.

**Response `200`**
```json
{
  "event": { ...Event with status: "published" },
  "message": "Event published successfully"
}
```

**Response `400`** — if no category pricings exist
```json
{
  "message": "Cannot publish event without at least one category pricing. Please add category pricing first."
}
```

**Response `400`** — if already published
```json
{ "message": "Event is already published" }
```

**Response `400`** — if cancelled
```json
{ "message": "Cancelled events cannot be published" }
```

---

### 11. Unpublish Event (Revert to Draft)

```
PATCH /events/:id/unpublish
```

**Auth:** Admin

Moves the event from `published` → `draft`.

**Response `200`**
```json
{
  "event": { ...Event with status: "draft" },
  "message": "Event reverted to draft"
}
```

**Response `400`** — if already draft or cancelled
```json
{ "message": "Event is already in draft state" }
```

---

### 12. Cancel Event

```
PATCH /events/:id/cancel
```

**Auth:** Admin

Moves the event to `cancelled`. This is a **terminal state** — a cancelled event cannot be published or reverted to draft.

**Response `200`**
```json
{
  "event": { ...Event with status: "cancelled" },
  "message": "Event cancelled"
}
```

**Response `400`** — if already cancelled
```json
{ "message": "Event is already cancelled" }
```

---

## Full Admin Flow

### Step 1 — Create the Event

```
POST /events
```

Returns the full event object, including `seatioEventKey` and `template.categories`.  
Event starts with `status: "draft"`.

---

### Step 2 — Upload Images *(if needed)*

```
POST /upload           ← single image
POST /upload/multiple  ← multiple images
```

Returns URL(s) to store in `mainImage` / `images` via `PUT /events/:id`.

---

### Step 3 — Add Category Pricing

```
POST /events/:id/categories   (once per category)
```

Repeat for every category defined in `event.template.categories`.  
Category keys are found in `event.template.categories[].key`.

---

### Step 4 — Mark Seats for Sale *(Seatsio — client-side)*

This step is performed directly against the **Seatsio API** from the admin panel using the `seatioEventKey` returned in Step 1. No call to our backend is needed here.

**Endpoint (Seatsio REST API)**

```
POST https://api-{region}.seatsio.net/events/{seatioEventKey}/actions/mark-as-for-sale
```

**Auth:** Seatsio Workspace Public Key *(safe to use in a secured admin panel)*

**Request Body**

Specify individual seat objects, a full category, or both:

```json
{
  "objects": ["A-1", "A-2", "A-3"],
  "categories": [1, 2]
}
```

| Field        | Type       | Description                                                          |
|--------------|------------|----------------------------------------------------------------------|
| `objects`    | string[]   | Specific seat labels to mark as for sale (e.g. `"A-1"`, `"A-2"`)   |
| `categories` | number[]   | Mark all seats in these category keys as for sale                    |

> To mark everything as **not** for sale (e.g. to block seats), use:
> ```
> POST /events/{seatioEventKey}/actions/mark-as-not-for-sale
> ```
> with the same body format.

**Response `200`** — Empty body on success.

---

### Step 5 — Mark Tables for Sale *(Seatsio — client-side)*

Same endpoint and format as Step 4, but reference table object labels instead of seat labels.

```
POST https://api-{region}.seatsio.net/events/{seatioEventKey}/actions/mark-as-for-sale
```

**Request Body**

```json
{
  "objects": ["T1", "T2", "T3"]
}
```

Table labels follow the naming defined in the seating chart template (e.g. `"T1"`, `"Table-5"`). Check the Seatsio chart designer for exact labels.

**Response `200`** — Empty body on success.

---

### Step 6 — Publish the Event

```
PATCH /events/:id/publish
```

Moves the event to `status: "published"`. The event becomes visible to users and tickets can be booked.

**Preconditions that must be met before calling this:**
- At least one category pricing exists (`POST /events/:id/categories`)
- Desired seats and/or tables have been marked for sale in Seatsio (Steps 4–5)

---

### Flow Summary

```
POST /events
  └─► seatioEventKey, template.categories

POST /events/:id/categories  (×N, once per category)

POST https://api-{region}.seatsio.net/events/{seatioEventKey}/actions/mark-as-for-sale
  └─► Mark individual seats as for sale

POST https://api-{region}.seatsio.net/events/{seatioEventKey}/actions/mark-as-for-sale
  └─► Mark tables as for sale

PATCH /events/:id/publish
  └─► status becomes "published"
```

---

## Error Format

All error responses follow this shape:

```json
{
  "statusCode": 400,
  "message": "Human-readable error message",
  "error": "Bad Request"
}
```

For validation errors, `message` may be an array:

```json
{
  "statusCode": 400,
  "message": ["name must be a string", "startDate must be a valid ISO date"],
  "error": "Bad Request"
}
```
