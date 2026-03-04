# Templates & Events — Frontend Integration Guide

> **Base URL:** `/api` (adjust per environment)
> **Auth:** All Admin-only endpoints require `Authorization: Bearer <token>` header.

---

## Overview

The **Template** feature is a two-layer system:

1. **Templates** — Reusable seating chart layouts. Each template defines seat categories (VIP, Regular, etc.). A template must exist before an event can be created.
2. **Events** — Actual ticketed events that reference a template. Events go through a status lifecycle: `draft → published → cancelled`.
3. **Category Pricing** — Once an event is created, prices are assigned per seat category before the event can be published.

### Full Admin Flow

```
Create Template → Create Event (refs template) → Add Category Pricings → Publish Event
```

---

## 1. Templates

### 1.1 List Templates

```
GET /templates
```

**Query Parameters**

| Parameter | Type   | Required | Description                          |
|-----------|--------|----------|--------------------------------------|
| `page`    | number | No       | Page number, 1-based (default: `1`)  |
| `limit`   | number | No       | Items per page, max 100 (default: `10`) |
| `search`  | string | No       | Filter by template name              |

**Response `200`**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Main Stage Arena",
      "notes": "Standard layout for indoor concerts up to 5,000 seats.",
      "seatioChartKey": "abc123xyz",
      "categories": [
        {
          "key": 1,
          "label": "VIP",
          "color": "#FF5733",
          "accessible": false
        },
        {
          "key": 2,
          "label": "Regular",
          "color": "#3498DB",
          "accessible": false
        }
      ],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrevious": false
  }
}
```

---

### 1.2 Get Template by ID

```
GET /templates/:id
```

**Response `200`** — Same shape as a single item in the list above.

**Response `404`** — Template not found.

---

### 1.3 Create Template *(Admin only)*

```
POST /templates
```

**Request Body**

| Field        | Type                  | Required | Description                                        |
|--------------|-----------------------|----------|----------------------------------------------------|
| `name`       | string                | Yes      | Display name of the template                       |
| `notes`      | string                | No       | Internal notes                                     |
| `categories` | `Category[]`          | Yes      | Seat categories (seeded into the seating chart)    |

**Category object**

| Field        | Type    | Required | Description                               |
|--------------|---------|----------|-------------------------------------------|
| `key`        | number \| string | Yes | Unique category key (used by seating chart) |
| `label`      | string  | Yes      | Human-readable name (e.g. "VIP")          |
| `color`      | string  | Yes      | Hex color (e.g. `#FF5733`)                |
| `accessible` | boolean | No       | Whether seats are wheelchair accessible (default: `false`) |

**Example**

```json
{
  "name": "Main Stage Arena",
  "notes": "Standard layout for indoor concerts.",
  "categories": [
    { "key": 1, "label": "VIP", "color": "#FF5733" },
    { "key": 2, "label": "Regular", "color": "#3498DB" }
  ]
}
```

**Response `201`**

```json
{
  "template": { ...templateObject },
  "message": "Template created successfully"
}
```

---

### 1.4 Update Template *(Admin only)*

```
PUT /templates/:id
```

All fields are optional. `categories` replaces the entire category list when provided.

**Request Body**

| Field        | Type         | Required | Description             |
|--------------|--------------|----------|-------------------------|
| `name`       | string       | No       |                         |
| `notes`      | string       | No       |                         |
| `categories` | `Category[]` | No       | Replaces full list      |

**Response `200`**

```json
{ "message": "Template updated successfully" }
```

**Response `404`** — Template not found.

---

### 1.5 Delete Template *(Admin only)*

```
DELETE /templates/:id
```

> Note: A template cannot be deleted if events are referencing it.

**Response `200`**

```json
{ "message": "Template deleted successfully" }
```

**Response `404`** — Template not found.

---

## 2. Events

### 2.1 List Events

```
GET /events
```

**Query Parameters**

| Parameter | Type   | Required | Description                                      |
|-----------|--------|----------|--------------------------------------------------|
| `page`    | number | No       | Page number, 1-based (default: `1`)              |
| `limit`   | number | No       | Items per page, max 100 (default: `10`)          |
| `search`  | string | No       | Filter by event name                             |
| `status`  | string | No       | Filter by status: `draft`, `published`, `cancelled` |
| `tags`    | string | No       | Comma-separated tags, e.g. `music,festival`      |

**Response `200`**

```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Summer Music Festival 2025",
      "description": "A short description.",
      "content": "Full HTML or markdown content...",
      "mainImage": "https://example.com/main.jpg",
      "images": ["https://example.com/1.jpg"],
      "tags": ["music", "festival"],
      "startDate": "2025-07-01T18:00:00.000Z",
      "endDate": "2025-07-03T23:59:59.000Z",
      "bookingStartDate": "2025-06-01T00:00:00.000Z",
      "bookingEndDate": "2025-06-30T23:59:59.000Z",
      "location": "Central Park, New York",
      "lat": "40.7850910",
      "lng": "-73.9682850",
      "status": "draft",
      "templateId": "550e8400-e29b-41d4-a716-446655440000",
      "template": { ...templateObject },
      "seatioEventKey": "ev-abc123",
      "categoryPricings": [],
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1,
    "hasNext": false,
    "hasPrevious": false
  }
}
```

---

### 2.2 Get Event by ID

```
GET /events/:id
```

Returns the event with its related `template` and `categoryPricings` included.

**Response `200`** — Same shape as a single item in the list above.

**Response `404`** — Event not found.

---

### 2.3 Create Event *(Admin only)*

```
POST /events
```

> Creating an event automatically provisions a seating event in the background using the template's seating chart. The event starts with `status: "draft"`.

**Request Body**

| Field              | Type       | Required | Description                                              |
|--------------------|------------|----------|----------------------------------------------------------|
| `templateId`       | UUID       | Yes      | ID of the template to base this event on                 |
| `name`             | string     | Yes      | Event display name                                       |
| `description`      | string     | No       | Short description                                        |
| `content`          | string     | No       | Full content (HTML or markdown)                          |
| `mainImage`        | URL string | No       | Main cover image URL                                     |
| `images`           | string[]   | No       | Additional image URLs                                    |
| `startDate`        | ISO 8601   | Yes      | Event start datetime                                     |
| `endDate`          | ISO 8601   | Yes      | Event end datetime                                       |
| `bookingStartDate` | ISO 8601   | Yes      | When ticket booking opens                                |
| `bookingEndDate`   | ISO 8601   | Yes      | When ticket booking closes                               |
| `tags`             | string[]   | No       | Tags for filtering (e.g. `["music", "festival"]`)        |
| `location`         | string     | No       | Venue name / address                                     |
| `lat`              | number     | No       | Latitude (-90 to 90)                                     |
| `lng`              | number     | No       | Longitude (-180 to 180)                                  |

**Example**

```json
{
  "templateId": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Summer Music Festival 2025",
  "description": "A short description.",
  "startDate": "2025-07-01T18:00:00.000Z",
  "endDate": "2025-07-03T23:59:59.000Z",
  "bookingStartDate": "2025-06-01T00:00:00.000Z",
  "bookingEndDate": "2025-06-30T23:59:59.000Z",
  "tags": ["music", "festival"],
  "location": "Central Park, New York",
  "lat": 40.785091,
  "lng": -73.968285
}
```

**Response `201`**

```json
{
  "event": { ...eventObject },
  "message": "Event created successfully"
}
```

**Response `404`** — Template not found.

---

### 2.4 Update Event *(Admin only)*

```
PUT /events/:id
```

All fields are optional. Only send the fields you want to change.

**Request Body** — Same fields as Create, all optional (except `templateId` which cannot be changed).

**Response `200`**

```json
{ "message": "Event updated successfully" }
```

**Response `404`** — Event not found.

---

### 2.5 Delete Event *(Admin only)*

```
DELETE /events/:id
```

**Response `200`**

```json
{ "message": "Event deleted successfully" }
```

**Response `404`** — Event not found.

---

## 3. Event Status Transitions *(Admin only)*

Events follow a strict lifecycle. The allowed transitions are:

```
DRAFT ──► PUBLISHED ──► CANCELLED
  ▲             │
  └─────────────┘  (unpublish → back to DRAFT)
```

| Current Status | Can Publish | Can Unpublish | Can Cancel |
|----------------|-------------|---------------|------------|
| `draft`        | Yes (needs at least 1 category pricing) | No | Yes |
| `published`    | No          | Yes           | Yes        |
| `cancelled`    | No          | No            | No         |

---

### 3.1 Publish Event

```
PATCH /events/:id/publish
```

> Requires at least one category pricing to be set before publishing.

**Response `200`**

```json
{
  "event": { ...eventObject, "status": "published" },
  "message": "Event published successfully"
}
```

**Response `400`** — Already published, cancelled, or no category pricings exist.

**Response `404`** — Event not found.

---

### 3.2 Unpublish Event (revert to Draft)

```
PATCH /events/:id/unpublish
```

**Response `200`**

```json
{
  "event": { ...eventObject, "status": "draft" },
  "message": "Event reverted to draft"
}
```

**Response `400`** — Already draft or cancelled.

**Response `404`** — Event not found.

---

### 3.3 Cancel Event

```
PATCH /events/:id/cancel
```

**Response `200`**

```json
{
  "event": { ...eventObject, "status": "cancelled" },
  "message": "Event cancelled"
}
```

**Response `400`** — Already cancelled.

**Response `404`** — Event not found.

---

## 4. Category Pricing

Category pricings assign a ticket price to each seat category defined in the event's template. Each category can only have one pricing entry per event.

> The `categoryKey` must match a key in the event's template categories. You can get these keys from the template object returned with `GET /events/:id`.

---

### 4.1 List Category Pricings

```
GET /events/:id/categories
```

**Response `200`**

```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "eventId": "...",
    "categoryKey": "1",
    "categoryLabel": "VIP",
    "price": "75000.00",
    "currency": "IQD",
    "description": "Front-row VIP seats with exclusive lounge access",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**Response `404`** — Event not found.

---

### 4.2 Add Category Pricing *(Admin only)*

```
POST /events/:id/categories
```

**Request Body**

| Field           | Type   | Required | Description                                                   |
|-----------------|--------|----------|---------------------------------------------------------------|
| `categoryKey`   | string | Yes      | Must match a category `key` from the event's template         |
| `categoryLabel` | string | Yes      | Human-readable label (e.g. "VIP")                             |
| `price`         | number | Yes      | Price amount (e.g. `75000` for 75,000 IQD)                    |
| `currency`      | string | No       | Currency code (default: `"IQD"`)                              |
| `description`   | string | No       | Optional description for this pricing tier                    |

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

**Response `201`** — Returns the created pricing object.

**Response `400`** — Category key does not exist in the template.

**Response `404`** — Event not found.

**Response `409`** — Pricing for this category already exists (use PUT to update).

---

### 4.3 Update Category Pricing *(Admin only)*

```
PUT /events/:id/categories/:pricingId
```

All fields are optional.

**Request Body**

| Field           | Type   | Required | Description                  |
|-----------------|--------|----------|------------------------------|
| `categoryLabel` | string | No       |                              |
| `price`         | number | No       |                              |
| `currency`      | string | No       |                              |
| `description`   | string | No       |                              |

**Response `200`** — Returns the updated pricing object.

**Response `404`** — Event or pricing not found.

---

### 4.4 Delete Category Pricing *(Admin only)*

```
DELETE /events/:id/categories/:pricingId
```

**Response `200`**

```json
{ "message": "Category pricing deleted successfully" }
```

**Response `404`** — Event or pricing not found.

---

## 5. Recommended UI Flows

### Admin: Create & Publish an Event

1. **Fetch templates** — `GET /templates` — populate a dropdown for the admin to pick a seating layout.
2. **Create event** — `POST /events` with the selected `templateId` and event details.
3. **Add pricings** — For each category in the template (`event.template.categories`), call `POST /events/:id/categories`.
4. **Publish** — `PATCH /events/:id/publish` once all pricings are set.

### Public: Browse Events

- `GET /events?status=published` to list only published events.
- `GET /events/:id` to load the full detail page including seating categories and their prices (`categoryPricings`).
- Use `event.seatioEventKey` to initialize the seating chart widget on the frontend.

---

## 6. Error Response Shape

All errors follow this structure:

```json
{
  "statusCode": 400,
  "message": "Descriptive error message",
  "error": "Bad Request"
}
```

For validation errors, `message` may be an array of strings.
