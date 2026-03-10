# Manual Ticketing Operational Flow

## Overall System Flow
`User -> Submit Ticket -> System Validation -> Ticket Stored -> Admin Review -> Status Updates -> Resolution`

## User Flow (Manual Ticket Submission)
1. Access Report Page
- User clicks `Report Issue` or opens `Support`.

2. Fill Out Ticket Form
- Required fields:
  - `Full Name`
  - `Email`
  - `Device Model`
  - `OS Version`
  - `Issue Category`
  - `Description`
  - `Upload Image`
- Frontend validation:
  - Required fields are non-empty.
  - Uploaded file must be an image.
  - Maximum file size is 10MB.

3. Submit Ticket
- Frontend sends `POST /api/v1/tickets` (multipart form).
- Backend performs:
  - Input validation.
  - Image upload storage.
  - Ticket number generation (`ALOE-YYYY-####`).
  - Database insert.
  - Default status assignment: `open`.

4. Confirmation Response
- Sample response:
```json
{
  "success": true,
  "ticket_number": "ALOE-2026-0005",
  "status": "Open"
}
```
- User receives:
  - Success message
  - Ticket number
  - Wait-for-admin instruction

## Admin Flow (Ticket Management)
1. Admin Login and Dashboard Access
- Admin opens `Admin Panel -> Support Ticketing`.
- Default view prioritizes `Open` tickets.

2. Open Ticket Review
- Admin reviews:
  - Reporter details
  - Device information
  - Issue category
  - Full description
  - Uploaded image preview
  - Timestamp

3. Evaluation and Triage
- Admin investigates whether issue is:
  - Detection inaccuracy/misclassification
  - Hardware/environment-related
  - User misuse/incorrect workflow
- Admin actions:
  - Move status to `In Progress`
  - Add internal notes
  - Assign owner/admin

4. Resolution Process
- Admin performs checks/fixes (re-test, verify bug, tune threshold, confirm report validity).
- Admin sets status to `Resolved`.
- Admin may add `resolution_notes`.

5. Closure
- After confirmation, admin sets status to `Closed`.
- Closed tickets remain searchable/auditable.

## Ticket Lifecycle State Machine
`Open -> In Progress -> Resolved -> Closed`

Rules:
- Only admin can update ticket status.
- Valid transitions are sequential.
- Users cannot reopen tickets in current version.

## Access Control
| Role | Permissions |
|------|-------------|
| User | Submit ticket, view own ticket list |
| Admin | View all tickets, assign/update status, resolve/close |

## Optional Analytics (Recommended)
- Ticket count per issue category.
- Most frequent concern type.
- Average time-to-resolution.
- Open vs resolved trend over time.

## Implemented API Endpoints
- User:
  - `POST /api/v1/tickets`
  - `GET /api/v1/tickets/me`
- Admin:
  - `GET /api/v1/admin/tickets`
  - `PUT /api/v1/admin/tickets/:id`
