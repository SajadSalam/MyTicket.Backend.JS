# Admin Bookings API

This document covers all booking management endpoints available to admin users, plus the public booking endpoints used by customers.

All admin endpoints require a valid JWT token belonging to a user with the `admin` role. Include it as:

```
Authorization: Bearer <token>
```

---

## Booking Statuses

| Status | Meaning |
|--------|---------|
| `pending` | Booking created, payment not yet completed |
| `confirmed` | Payment received, seats are booked |
| `failed` | Payment failed or was rejected |
| `cancelled` | Booking was cancelled (by admin or system) |

---

## Admin Endpoints

### List All Bookings

**`GET /api/v1/bookings`** — Admin only

Returns a paginated list of all bookings across all events. Supports rich filtering.

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number, starts at `1` (default: `1`) |
| `limit` | number | Items per page, max `100` (default: `10`) |
| `eventId` | UUID | Filter by a specific event |
| `status` | string | Filter by booking status: `pending`, `confirmed`, `failed`, `cancelled` |
| `search` | string | Search across customer name, email, and phone (partial, case-insensitive) |
| `dateFrom` | date | Show bookings created on or after this date (e.g. `2025-01-01`) |
| `dateTo` | date | Show bookings created on or before this date (e.g. `2025-12-31`) |

#### Response `200`

A paginated list of bookings, each including the linked event and payment details.

```json
{
  "data": [
    {
      "id": "uuid",
      "eventId": "uuid",
      "userId": "uuid or null",
      "seats": ["A-1", "A-2"],
      "totalAmount": "150000.00",
      "currency": "IQD",
      "status": "confirmed",
      "customerName": "John Doe",
      "customerEmail": "john@example.com",
      "customerPhone": "+9647701234567",
      "seatioOrderId": "uuid or null",
      "createdAt": "2025-07-01T10:00:00.000Z",
      "updatedAt": "2025-07-01T10:05:00.000Z",
      "event": { "id": "uuid", "name": "Summer Festival", "..." },
      "payment": {
        "id": "uuid",
        "status": "paid",
        "tranRef": "TST-...",
        "amount": "150000.00",
        "paidAt": "2025-07-01T10:04:00.000Z"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 84,
    "totalPages": 9,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

---

### Get Booking Details

**`GET /api/v1/bookings/:id/details`** — Admin only

Returns the full details of a single booking, including the linked event, event template, and payment record.

#### URL Parameters

| Parameter | Description |
|-----------|-------------|
| `id` | The booking's UUID |

#### Response `200`

Same shape as a single item from the list above, with the addition of `event.template`.

#### Response `404`

```json
{ "message": "Booking not found" }
```

---

### Cancel a Booking

**`PATCH /api/v1/bookings/:id/cancel`** — Admin only

Cancels a booking that is currently `pending` or `confirmed`.

- If the booking is `pending` — releases the held seats back to available in Seatsio.
- If the booking is `confirmed` — releases the booked seats back to available in Seatsio.
- The associated payment is marked as `cancelled`.

#### URL Parameters

| Parameter | Description |
|-----------|-------------|
| `id` | The booking's UUID |

#### Response `200`

The updated booking object with `status: "cancelled"`.

#### Error Responses

| Status | Reason |
|--------|--------|
| `400` | Booking is already `cancelled` or `failed` |
| `404` | Booking not found |

---

### Manually Confirm a Booking

**`PATCH /api/v1/bookings/:id/confirm`** — Admin only

Manually marks a `pending` booking as confirmed. Use this when the Amwal payment webhook was not received but payment was completed on the customer's end.

- Books the customer's seats in Seatsio.
- Sets booking status to `confirmed` and payment status to `paid`.

#### URL Parameters

| Parameter | Description |
|-----------|-------------|
| `id` | The booking's UUID |

#### Response `200`

The updated booking object with `status: "confirmed"`.

#### Error Responses

| Status | Reason |
|--------|--------|
| `400` | Booking is already `confirmed`, `cancelled`, or `failed` |
| `404` | Booking not found |

---

## Public Endpoints

These endpoints do not require authentication.

### Get Booking by ID

**`GET /api/v1/bookings/:id`**

Used by the customer website to check the result after returning from the payment page.

#### Response `200`

Full booking object including event and payment details.

#### Response `404`

```json
{ "message": "Booking not found" }
```

---

### List Bookings (Public, Filtered)

**`GET /api/v1/bookings/filter/public`**

Basic public listing — filter by event ID and/or status.

#### Query Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (default: `1`) |
| `limit` | number | Items per page (default: `10`, max `100`) |
| `eventId` | UUID | Filter by event |
| `status` | string | Filter by status |

---

### Create a Booking

**`POST /api/v1/bookings`**

Creates a new booking and returns a payment redirect URL. See the [Frontend Integration Guide](./frontend-integration.md) for the full customer flow.

---

## Endpoint Summary

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/v1/bookings` | Admin | List all bookings with full filtering |
| `GET` | `/api/v1/bookings/:id/details` | Admin | Full booking details |
| `PATCH` | `/api/v1/bookings/:id/cancel` | Admin | Cancel a booking |
| `PATCH` | `/api/v1/bookings/:id/confirm` | Admin | Manually confirm a booking |
| `GET` | `/api/v1/bookings/:id` | Public | Get booking by ID (customer use) |
| `GET` | `/api/v1/bookings/filter/public` | Public | List bookings by event/status |
| `POST` | `/api/v1/bookings` | Public | Create a booking (customer use) |
