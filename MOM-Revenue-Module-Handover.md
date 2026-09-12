# Yoco Stays — Super Admin Revenue Module
# Minutes of Meeting (Handover)

**Date:** 11 Sep 2026  
**Purpose:** Hand over this revenue/subscription prototype to the team. Went through the full flow and some edge cases with registration + room allocation.

---

## What this module is

- This is Super Admin side for hostel SaaS subscriptions, not student fee billing.
- We manage plans, billed seats, modules, invoices, upgrade requests, trial, grace, renewals.
- Warden side we only simulated on demo-subscription page. Actual hostel ops (rooms, registration) sit in other modules.
- Right now its a frontend prototype with mock data, no backend. Hostel master data and revenue data are two separate stores, not fully synced.

## Main screens we showed

- Revenue list of all hostel subscriptions, filters, export.
- Hostel detail: current plan, seats, pending requests, invoices, history, notes.
- Reports / insights: ARR, plan mix, city, modules.
- Settings: GST, invoice prefix, grace days, trial days, plan rates, module catalog.
- Hostel add/edit, room mapping (wing-building-floor-room-bed), amenities, hostel permissions.
- Other sidebar items like users, university, roles are placeholders, not in this module.

## Core billing logic we walked through

- Billing is per seat per month. Premium 50, Advanced 60, Elite 70. Custom is packaged modules plus extra modules at their rates.
- studentCount on subscription = billed seats. activatedStudentCount is start of cycle, addedStudentCount is mid-cycle add.
- Staff is not billed. Separate staff count. Parents also not billed.
- Trial: 0 rupees, all modules open, default 30 days.
- After renewal date there is grace (default 30 days), modules still work. After that expired and modules lock.
- Admin can deactivate, that clears modules.
- Seat increase mid active cycle = prorata invoice for remaining months.
- Seat decrease mid cycle / trial / grace is blocked. Count stays till renewal, we can schedule upcomingStudentCount for next cycle.
- If hostel already expired/deactivated and they change seats, that starts a new billing cycle.
- Extra modules mid cycle push plan to CUSTOM and we bill the module delta prorata.
- Invoice types: annual, mid-cycle student upgrade, mid-cycle plan upgrade, custom module add. GST 18% (CGST+SGST or IGST).
- Only one open upgrade request at a time. Warden submits, admin approve / reject / hold / edit then approve. Warden can only withdraw.
- On new hostel we can start Elite trial. After create, subscription changes should go through revenue, not silently from edit hostel.

## Room mapping / allocation (how it works today in this app)

- Physical beds: Wing → Building → Floor → Room → Bed. Bed status empty / occupied / reserved.
- Adding beds is free in UI right now. No check against billed seats. Reserved status exists but we dont really use it.
- Room allocation as a product module is only a subscription flag (Advanced+). Actual allocation of student to bed is not built here.

## Edge cases we discussed (important)

### 1. Seats already decided on subscription, but registration module approves more students

- Problem: billed seats are pre set. If registration keeps approving extra students, occupancy and billing go out of sync. Hostel is using more than they paid for.
- Agreed: registration approval should only allow up to the set count. Meaning max students you can approve = billed student seats (the count number from revenue). Dont approve beyond that. If they need more students, first raise student_count_update in revenue, get it approved and billed, then registration can take more.

### 2. Bed creation in room allocation not matching seats

- Problem: ops can keep creating beds even if subscription seats are less, or the other way, seats high but beds less. Discrepancy between physical beds and billed capacity.
- Also staff may get a bed. If we cap beds = student seats only, then either staff has no bed or we steal a student seat.

### 3. Staff getting allotted a bed

- Staff should not be billed as a student seat.
- Agreed handling:
  - Keep a **separate staff count, not billed**.
  - **Bed creation allowed = student seats + staff count**.
  - So physical beds can cover students plus staff beds.
  - Registration still only cares about student seats: **approval cap = billed student count only**. Staff allotment does not eat student registration quota and does not generate extra SaaS billing.

## How the three numbers should sit together (agreed)

- Billed seats (revenue) = max students allowed in registration.
- Staff count (hostel, not billed) = extra beds allowed for staff.
- Max beds you can create in room mapping = billed student seats + staff count.
- Occupied student beds should not go above billed seats. Staff beds counted separately.

## Other things team should know

- Hostel list student/staff counts in this prototype are mock, not live-linked to revenue seats.
- Approval queue and renewal alerts screens exist in code but routes currently dump back to revenue home. Real approve flow is on hostel detail.
- Quarterly cycle in code is 4 months, not 3. Confirm with finance before prod.
- Notify WhatsApp / PDF download mostly stub / coming soon.
- Production need API, persist invoices/requests, and actually enforce the seat vs registration vs bed rules across modules. This prototype only shows revenue UX.

## Action / next for the team

- Take this module as source of truth for subscription, invoices, plan/module, seat billing.
- When wiring registration: hard cap approvals on billed student count.
- When wiring room allocation / bed create: allow beds up to student seats + staff count, staff not billed.
- Sync hostel master and revenue on hostel id / code.
- Backend + real payment later, dont treat mock as final.
