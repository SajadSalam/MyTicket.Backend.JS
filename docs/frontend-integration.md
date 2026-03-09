# Frontend Integration Guide — Customer Website

This guide explains how to fetch events and initiate payments from the customer-facing website. No authentication token is required for any of the flows described here.

---

## Base URL

All API calls are made to:

```
/api/v1/
```

---

## 1. Get All Events

To display the events listing page, fetch published events:

**`GET /api/v1/events?status=published`**

### Optional Filters

| Parameter | What it does |
|-----------|--------------|
| `page` | Page number (starts at `1`) |
| `limit` | Number of events per page (default `10`, max `100`) |
| `search` | Search events by name |
| `tags` | Filter by one or more tags, comma-separated (e.g. `music,festival`) |

### What you get back

A paginated list of events. Each event includes its name, description, main image, dates, location, and status. The response also includes pagination info (`total`, `totalPages`, `hasNext`, `hasPrevious`) so you can build paging controls.

---

## 2. Get a Single Event by ID

To display the event detail page, fetch the full event by its ID:

**`GET /api/v1/events/:id`**

Replace `:id` with the event's UUID.

### What you get back

The full event object, including:

- All the same fields as the list (name, images, dates, location, etc.)
- **`seatioEventKey`** — you need this to initialize the interactive seat map widget so customers can pick their seats.
- **`categoryPricings`** — the price for each seating category (e.g. VIP, General Admission), so you can display pricing information on the page before the customer selects seats.

If the event does not exist, the API returns a `404` response.

---

## 3. Initiate Payment (Create a Booking)

Payment is started by submitting a booking. There is no separate payment-initiation step.

**`POST /api/v1/bookings`**

### What to send

| Field | Required | Description |
|-------|----------|-------------|
| `eventId` | Yes | The ID of the event being booked |
| `seats` | Yes | The list of seat labels the customer selected in the seat map widget |
| `holdToken` | Yes | The hold token provided by the seat map widget (it temporarily reserves the selected seats during checkout) |
| `customerName` | No | Customer's full name |
| `customerEmail` | No | Customer's email address |
| `customerPhone` | No | Customer's phone number |
| `userId` | No | The logged-in user's ID, if the customer is signed in |

### What you get back

A `redirectUrl` — send the customer to this URL to complete payment on the secure Amwal payment page. The total amount is calculated automatically by the backend based on the selected seats and their category prices.

After the customer finishes (or cancels) on the payment page, they return to your site. At that point, check the booking status to show a success or failure screen.

---

## 4. Check Booking Status

After the customer returns from the payment page, check whether payment succeeded:

**`GET /api/v1/bookings/:id`**

Replace `:id` with the `bookingId` returned when the booking was created.

### Possible statuses

| Status | Meaning |
|--------|---------|
| `pending` | Payment has not completed yet |
| `confirmed` | Payment was successful — booking is confirmed |
| `failed` | Payment failed |
| `cancelled` | Booking was cancelled |

The response also includes the total amount paid, the customer's details, and the full event info.

---

## Full Flow Summary

```
1. Show event list
   GET /api/v1/events?status=published

2. Customer opens an event
   GET /api/v1/events/:id
   → Use seatioEventKey to render the seat map widget
   → Display categoryPricings for pricing info

3. Customer selects seats in the widget
   → Widget gives you: seats[] and holdToken

4. Customer submits — create the booking
   POST /api/v1/bookings
   → Redirect customer to the redirectUrl returned

5. Customer returns from payment page
   GET /api/v1/bookings/:bookingId
   → Show success or failure based on status
```

---

## Notes

- All endpoints are **public** — no login or API token is required.
- The seat map widget is powered by **Seatsio**. The `seatioEventKey` from the event connects your widget to the correct venue layout.
- Seat prices are determined server-side — you only need to display `categoryPricings` for informational purposes.
- The payment page is hosted by **Amwal** (external). Your site only needs to redirect to it and handle the return.
