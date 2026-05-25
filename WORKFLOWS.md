# CARSATION DMS — Business Workflows

**Owner:** Duane Berkey — Carsation LLC, Bridgeport CT
**Repo:** https://github.com/dberkey103/AUTODMSV2
**Purpose:** This document describes the real-world dealership workflows that the CARSATION DMS must support. It is the source of truth for what the system needs to do. Each workflow lists the steps, the data captured at each step, and the modules/pages involved.

> **Note for Claude Code / developers:** Build features to match these workflows. When a workflow step is unclear or missing data fields, flag it for Duane before implementing.

---

## Workflow Index

1. Vehicle Acquisition → Listing
2. Customer Inquiry → CRM → Appointment
3. Customer Arrival → Deal Creation
4. Financing → Credit App → Lender Submission
5. Document Generation & E-Signature
6. Deal Status: Pending Funding → Sold
7. Dashboard, Reporting & Accounting
8. _Service / Repair Orders_ (TBD — separate workflow)

---

## Workflow 1 — Vehicle Acquisition → Listing

This is the **front-end of inventory**: how a car gets from "we want to buy it" to "live on our website and 3rd-party marketplaces."

### Step 1.1 — Acquire Vehicle

The dealership sources vehicles from three channels:

| Source | Notes |
|---|---|
| **Auction** | Manheim, ADESA, online auctions, etc. Capture auction name, buyer fee, lane fee. |
| **Dealer trade / wholesale** | Buying from another dealer. Capture selling dealer name, contact. |
| **Private party** | Direct from consumer. Capture seller name, address, license, title status. |

**Data captured at acquisition:**
- Source type + source details
- Acquisition date
- Purchase price
- Buyer/representative who acquired it
- VIN (decoded immediately to populate year/make/model/trim/engine)
- Odometer at acquisition
- Title status (clean, salvage, in-hand, pending)

### Step 1.2 — Stock Into System

Vehicle is entered into the DMS, which **auto-generates a stock number**.

- Stock number format: _TBD — Duane to specify_
- VIN decode runs automatically and pre-fills vehicle specs
- Vehicle status set to: **`Acquired – In Transit`**

**Initial costs entered:** purchase price, auction/buyer fees, deposit/wire fees.

### Step 1.3 — Arrange Transport

Transport booked from acquisition location to the dealership lot.

**Data captured:** transporter/hauler name, pickup location + date, ETA, transport cost, transport status (booked / picked up / in transit / delivered).

### Step 1.4 — Vehicle Arrives — Inspection & Write-Up

When the vehicle physically arrives:

1. **Visual inspection** — exterior/interior condition, dents, scratches, wheels, tires, glass, interior wear.
2. **Mechanical inspection** — engine, transmission, brakes, suspension, electronics, fluids, codes scanned.
3. **Write-up** — recon/repair list identifying everything that needs to be addressed before retail-ready.

**Data captured:** inspection date + inspector, visual notes, mechanical notes, DTCs, recommended recon items (description, estimated cost, parts needed, in-house vs outsource).

### Step 1.5 — Recon Strategy & Execution

A reconditioning plan is decided based on the write-up.

**Possible paths (often combined):**
- **In-house service** — assign to internal technician(s); creates an internal RO.
- **Body shop / outsource** — send to external vendor (paint, body, glass, upholstery).
- **Parts ordering** — track PO #, vendor, cost, ETA.
- **Detail** — interior/exterior detail before photos. Assigned to a user with the **Detailer** role; creates a detail work order line on the recon record.

**Data captured for each recon line:** description, vendor/technician assigned, status (pending / in progress / complete), cost (parts + labor), date completed.

All recon costs roll up into the vehicle's **total cost basis** alongside acquisition + transport.

### Step 1.6 — Vehicle is Frontline-Ready

When all recon is complete and final QC passes, status flips to **`Frontline Ready`** / **`Ready for Photos`**.

Detail work order (assigned to Detailer role) must be marked **complete** before status can advance to Frontline Ready.

### Step 1.7 — Photograph Vehicle

Photos are taken (typically 20–40+ images per vehicle).

**Photo handling in DMS:**
- Photos uploaded to the **Vehicle Details page**
- Drag-and-drop reordering (first photo = hero)
- Bulk upload supported
- Stored in Supabase storage (or designated CDN)
- Metadata: filename, sequence order, upload timestamp, uploaded-by user

### Step 1.8 — Publish to Website + 3rd-Party Marketplaces

Once photos are uploaded and vehicle is marked **`Active / For Sale`**, the DMS exports the listing to:

| Destination | Method | Status |
|---|---|---|
| **Carsation website** | Direct API / feed | TBD |
| **Cars.com** | Standard inventory feed (typically nightly XML/CSV) | TBD |
| **CarGurus** | Standard inventory feed | TBD |
| **Facebook Marketplace** | Feed or manual cross-post | TBD |
| **Other** (AutoTrader, TrueCar) | TBD | TBD |

**What gets exported:** stock #, VIN, year/make/model/trim, mileage, price, full description (auto-generated + editable), all photos in order, features/options, dealership contact.

**Pricing:** Retail asking price set before publishing. UI should show cost basis vs. asking price so margin is visible.

---

## Workflow 2 — Customer Inquiry → CRM → Appointment

Once a vehicle is live, leads start coming in. This workflow covers how every inquiry is captured, responded to, and converted into an appointment.

### Step 2.1 — Inquiry Sources

Leads arrive from multiple channels, all of which must funnel into the CRM:

| Channel | Delivery method |
|---|---|
| **Cars.com** | ADF/XML lead email or API feed |
| **CarGurus** | ADF/XML lead email |
| **Facebook Marketplace** | Messenger / email |
| **Carsation website** | Form submission → direct to CRM |
| **Phone call** | Manual entry by employee (capture caller ID where possible) |
| **Walk-in** | Manual entry by salesperson |
| **Text/SMS** | Inbound text to dealership line |

### Step 2.2 — Lead Lands in CRM

Every inquiry creates a **Lead record** with:

- Source (which channel)
- Vehicle of interest (stock # — linked)
- Customer name + phone + email
- Original message / question
- Date/time received
- Status: **`New`**
- Assigned salesperson (auto-assigned by round-robin or manager rule — TBD)

### Step 2.3 — Auto-Responder / AI Agent Engagement

Immediately on lead creation, an automated response is triggered.

**Option A — Auto-responder (template-based):**
- Sends pre-written email + SMS thanking customer
- Confirms vehicle availability
- Provides salesperson contact info
- Offers appointment link / scheduling page

**Option B — AI agent (conversational):**
- AI bot replies to customer questions via email/SMS/Messenger
- Answers FAQs: price, mileage, financing options, trade-in process, hours, location
- Qualifies the lead (budget, timeline, financing vs cash, trade-in)
- Attempts to **book an appointment** on the dealer's calendar
- Hands off to live salesperson when:
  - Customer requests human contact
  - Appointment is scheduled
  - AI confidence drops / question is out of scope
  - Lead becomes "hot" (ready-to-buy signals)

**Data captured:** all AI/auto-responder messages logged in lead conversation thread; appointment date/time if scheduled; lead status updates (`New` → `AI Engaged` → `Appointment Set` or `Needs Human`).

### Step 2.4 — Employee Alerts

When a lead requires human attention, alerts go to dealership employees:

| Trigger | Alert type | Recipient |
|---|---|---|
| New lead created | Email + SMS | Assigned salesperson |
| Appointment scheduled | Email + SMS | Assigned salesperson + Manager |
| AI hands off to human | Email + SMS | Assigned salesperson |
| Hot lead / urgent | SMS (priority) | Assigned salesperson + Manager |
| No response in X hours | Email | Manager (escalation) |

**Alert channels:** Email (SendGrid/Mailgun/SES) + SMS (Twilio).

### Step 2.5 — Appointment Confirmation & Reminders

Once an appointment is set:
- Customer receives confirmation (email + SMS)
- Reminder sent 24 hours before + 1 hour before
- Salesperson sees it on their dashboard / calendar view
- Lead status updates to **`Appointment Set`**

---

## Workflow 3 — Customer Arrival → Deal Creation

Customer shows up. This workflow turns a lead into an active deal.

### Step 3.1 — Customer Arrives

- Salesperson marks lead as **`Showed`** (or `No-Show`)
- Customer record created/updated:
  - Full name, address, phone, email, DOB, driver's license #
  - Co-buyer info if applicable
- Customer linked to the existing Lead record

### Step 3.2 — Test Drive & Selection

- Customer test-drives vehicle(s) — log which stock #s test-driven
- If trade-in: appraisal happens here (separate sub-workflow — TBD)
- Customer commits to a specific vehicle (or walks)

### Step 3.3 — Create Deal

A **Deal record** is created, linking:

- Customer (+ co-buyer if any)
- Vehicle (by stock #)
- Trade-in vehicle (if any)
- Salesperson
- Manager
- Date created

**Deal type set at creation:**
- **Cash**
- **Finance**
- **Lease** (if offered)
- **Wholesale**

### Step 3.4 — Desk the Deal

Manager "desks" the deal — works the numbers:

- Vehicle sale price
- Trade-in allowance + payoff
- Down payment / cash down
- Fees (doc fee, registration, title, sales tax)
- Aftermarket / F&I products (warranty, GAP, etc.) — optional
- For finance: term, rate, monthly payment
- Total: front-end gross + back-end gross + total deal gross

Deal status: **`Working`** or **`Desked`**.

---

## Workflow 4 — Financing → Credit App → Lender Submission

If the deal type is **Finance**, this workflow handles credit application and lender approval.

### Step 4.1 — Customer Completes Credit Application

Customer fills out a credit app — **on the Carsation website** (self-serve, before or during visit) or in-store on a tablet.

**Data captured on credit app:**
- Personal: full name, DOB, SSN, address (current + prior if <2 yrs), phone, email, driver's license
- Co-applicant info (same fields) if joint app
- Housing: own/rent, monthly payment, time at address
- Employment: employer, position, time on job, gross monthly income
- Prior employment if <2 yrs
- References (some lenders require)
- Vehicle being purchased + sale price + down payment

**Security:** Credit apps contain SSN — must be encrypted at rest in Supabase, transmitted over HTTPS only, and access logged. PCI/PII compliance applies.

### Step 4.2 — Submit to Lenders

Credit app is submitted to one or more lenders. Integration paths:

| Integration | How |
|---|---|
| **DealerTrack** | Industry-standard credit aggregator — single submission to many lenders |
| **RouteOne** | Similar to DealerTrack |
| **Direct lender portals** | Manual or per-lender API (Capital One Auto, Westlake, Credit Acceptance) |
| **CARSATION DMS direct submission** | TBD — likely DealerTrack/RouteOne API integration |

**Data captured per submission:**
- Lender name
- Submission timestamp
- Submission status (submitted / approved / declined / counter-offer / pending)
- Approval terms (amount approved, rate, term, stipulations)
- Decision date
- Notes from lender (stips: pay stubs, proof of residence)

### Step 4.3 — Lender Decision Handling

- **Approved** → move forward with selected lender's terms; update deal financing details
- **Declined** → resubmit to other lenders or work with customer on alternatives
- **Conditional / counter-offer** → discuss with customer, accept or negotiate
- **Stipulations** → collect required documents from customer and upload to deal jacket

### Step 4.4 — Finalize Lender & Terms

Once a lender is selected and customer accepts:
- Deal financing fields locked: lender, APR, term, monthly payment, total finance charge, amount financed
- Deal moves to document generation (Workflow 5)

---

## Workflow 5 — Document Generation & E-Signature

All paperwork is generated from the deal data and sent for electronic signature.

### Step 5.1 — Generate Documents

The DMS generates a full document packet based on deal type and state (CT in our case):

**Standard documents (all retail deals):**
- Buyer's Order / Bill of Sale
- Odometer Disclosure
- Title application (CT DMV forms)
- Registration application
- Sales tax form
- Privacy notice (Gramm-Leach-Bliley)
- Risk-based pricing notice (finance deals)

**Finance-specific:**
- Retail Installment Sales Contract (RISC) — lender-specific format
- Truth in Lending disclosure (TILA)
- Credit insurance / GAP forms if purchased
- Lender stipulation acknowledgments

**Trade-in (if applicable):**
- Trade-in title assignment
- Payoff authorization (if trade has a lien)
- Power of attorney for title transfer

**Aftermarket / F&I:**
- Extended warranty / service contract
- GAP insurance contract
- Other add-on product contracts

All docs are pre-filled from deal + customer + vehicle data — **no manual re-keying**.

### Step 5.2 — Send for E-Signature

- **Method:** E-signature service (DocuSign / Dropbox Sign / native — TBD)
- Customer signs from phone/tablet in-store OR remotely
- Co-buyer signs separately if applicable
- Salesperson / manager / F&I signs dealer-side
- All signed documents stored in the **Deal Jacket** (file storage tied to deal record)

**Audit trail:** who signed what, when, IP, geolocation; all signed PDFs archived permanently (Supabase storage + backup).

---

## Workflow 6 — Deal Status: Pending Funding → Sold

After signing, deal moves through final status changes.

### Step 6.1 — Status Logic

| Deal Type | After signing | Next status |
|---|---|---|
| **Cash** | Customer pays in full | **`Sold`** immediately |
| **Wholesale** | Dealer-to-dealer payment received | **`Sold`** immediately |
| **Finance** | Awaiting lender funding | **`Pending Funding`** |

### Step 6.2 — Pending Funding (Finance Deals Only)

- Lender reviews signed contract + stip docs
- Lender funds the deal (wires money to dealership) — typically 1–7 business days
- Once funds received and verified → status flips to **`Funded` / `Sold`**

**Data captured:** funding date, funded amount, reserve / dealer participation earned (spread paid to dealer), any chargebacks / adjustments.

### Step 6.3 — Vehicle Status Update

Concurrent with deal status:
- Vehicle status moves to **`Sold / Delivered`**
- Vehicle is removed from active inventory feeds (Cars.com, CarGurus) — should auto-remove on next sync
- Vehicle hand-off: keys, plates, paperwork delivered to customer

### Step 6.4 — Post-Sale

- Title work submitted to CT DMV
- Customer welcome email + first service appointment reminder
- Lead status finalized as **`Sold`** in CRM
- Salesperson commission calculated (per dealership's pay plan)

---

## Workflow 7 — Dashboard, Reporting & Accounting

All deal activity rolls up into management dashboards and accounting reports.

### Step 7.1 — Dashboard Visibility

The Sales Dashboard shows real-time:

**Top-line metrics:**
- Deals sold MTD / YTD (count)
- Total gross profit MTD / YTD ($)
- Front-end gross (vehicle margin)
- Back-end gross (F&I products + finance reserve)
- Average gross per deal
- Pending Funding count + dollar value
- Inventory: total units, total cost basis, average days in stock

**Breakdowns:**
- By salesperson (units, gross, avg gross)
- By deal type (cash / finance / wholesale)
- By vehicle source (auction / dealer / private)
- By lender (volume, avg rate, reserve earned)
- By lead source (which marketing channels produce sales)

**Visuals:** monthly trend charts, salesperson leaderboard, gross by deal type, filters by date range/salesperson/status.

### Step 7.2 — Accounting Reports

Reports exportable to PDF / Excel / CSV for the bookkeeper or accountant:

| Report | Purpose |
|---|---|
| **Sales Journal** | Every deal sold in period — gross sale, cost, gross profit, commission, fees |
| **Inventory Report** | All active vehicles with cost basis, days in stock, asking price |
| **Cost of Sales** | Total vehicle cost + recon + transport, per deal |
| **Commission Report** | By salesperson — units, gross, commission earned |
| **F&I Report** | Back-end products sold, reserve income, chargebacks |
| **Funded vs Pending** | Cashflow visibility — what's expected to fund and when |
| **Tax / DMV Report** | Sales tax collected, registrations filed |
| **Floorplan Report** | (If using floorplan financing) — units, payoffs, interest |
| **Profit & Loss Summary** | Period income vs expenses (rolls into accounting system) |

**Future integration:** Sync deal data to QuickBooks / Xero so the bookkeeper doesn't re-key anything.

### Step 7.3 — Role-Based Access to Reports

Per the RBAC system already in progress:

| Role | Sees |
|---|---|
| **Owner / Admin** | Everything |
| **Manager** | Everything except Owner-only financial summaries |
| **Salesperson** | Own deals, own commissions, own leads |
| **Service Advisor / Technician** | Service-side only |
| **Accounting** | All financial reports, no deal-editing rights |
| **Read Only** | View-only access to assigned modules |

---

## Cross-Cutting: Vehicle Status Lifecycle
