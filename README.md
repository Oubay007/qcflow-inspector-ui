# QC Flow Dashboard

Build the frontend for a premium Factory Quality Control Automation SaaS called "QC Flow".

IMPORTANT:

This is GENERATION #1 of the project.

Build a polished, production-quality FRONTEND ONLY.

Do NOT build a backend.

Do NOT create a database.

Do NOT use Supabase yet.

Use realistic mock data.

The real backend will later be built separately in Python (FastAPI) and connected to a Supabase database.

Design the frontend architecture so replacing mock data with REST API calls later is easy.

==================================================

PRODUCT

==================================================

QC Flow digitizes a factory's manual quality-control process.

Every machine is checked every 2 hours.

Current manual process:

- Worker checks the machine.

- They check multiple quality criteria.

- Each criterion receives C (Conforme) or NC (Non Conforme).

- They check article-specific measurements.

- Measurements have minimum/maximum tolerances.

- They record production information.

- They record machine problems and waste.

- Information is currently written manually and later entered into Excel.

- Reports and charts are then created manually.

Our application replaces this workflow.

Core workflow:

LOGIN

→ DASHBOARD

→ MACHINE / QR

→ ACTIVE OF (Ordre de Fabrication)

→ ARTICLE

→ CURRENT 2-HOUR INSPECTION

→ QC C/NC CHECKS

→ MEASUREMENTS + TOLERANCES

→ PRODUCTION DATA

→ SUBMIT

→ INSPECTION HISTORY

→ REPORTS / ANALYTICS

==================================================

DESIGN

==================================================

Make this look like a premium modern B2B SaaS / unicorn startup.

Visual inspiration:

Linear

Stripe

Vercel

modern enterprise SaaS

It must NOT look like:

- an old factory ERP

- Excel

- a generic admin dashboard

- a government application

Style:

- premium

- minimal

- clean

- professional

- highly readable

- excellent spacing

- subtle animations

- strong typography

- modern cards

- polished tables

- beautiful charts

- responsive

Use a restrained professional palette.

Status colors:

GREEN = Conforme

RED = Non Conforme

AMBER = Warning / Pending

GRAY = Upcoming / inactive

Do not overuse colors.

==================================================

APP LAYOUT

==================================================

Desktop:

- fixed left sidebar

- top header

- main content area

Sidebar:

QC Flow logo

Dashboard

Inspections

Ordres de Fabrication

Machines

Articles

Reports

Analytics

Administration

Users

Settings

Bottom:

Current user

Role

Logout

Header:

- page title

- search

- notifications

- user avatar/profile

Responsive:

- collapsible sidebar

- tablet friendly

- mobile friendly

- large touch targets

==================================================

1. LOGIN

==================================================

Create a beautiful professional login screen.

Include:

QC Flow logo

"Quality control, simplified."

Email

Password

Show/hide password

Remember me

Forgot password

Login button

Use mock authentication.

Create roles:

- Admin

- Quality Engineer

- Operator

- Supervisor

After login → Dashboard.

Keep authentication behind a clean service abstraction so it can later connect to our Python backend.

==================================================

2. DASHBOARD

==================================================

Create a premium factory QC dashboard.

Header:

"Good morning, Ahmed"

Show:

Today's date

Current machine

Current OF

Current inspection period

KPI cards:

Inspections Today

Conformity Rate

Non-Conformities

Total Waste

Production Quantity

Active OFs

Main section:

"Today's Inspection Timeline"

Display:

08:00 → 10:00    Completed

10:00 → 12:00    Completed

12:00 → 14:00    Current

14:00 → 16:00    Upcoming

16:00 → 18:00    Upcoming

Make this visually excellent.

Dashboard charts:

- Conformity vs Non-Conformity

- Waste trend

- Production trend

- Top defect types

Use realistic mock data.

==================================================

3. ORDRES DE FABRICATION / OF

==================================================

Create an OF page.

OF = Ordre de Fabrication.

An OF contains:

OF Number

Article

Machine

Starting Product / Matière

Planned Quantity

Produced Quantity

Remaining Quantity

Start Date

Status

Operator

Régleur

Mock examples:

OF-2026-001

OF-2026-002

OF-2026-003

Create:

- searchable table

- filters

- status badges

- Create OF button

- Edit

- View details

OF detail page:

- production information

- machine

- article

- quantities

- progress

- QC history

- defects

- inspections

==================================================

4. MACHINES

==================================================

Create Machines page.

Machines:

Machine 01

Machine 02

Machine 03

Show:

Machine

Status

Current OF

Current Article

Current Operator

Last Inspection

Next Inspection

QC Status

Statuses:

Running

Stopped

Maintenance

Warning

Machine detail:

- current OF

- production

- inspection timeline

- machine problems

- downtime

- QC history

==================================================

5. QR MACHINE WORKFLOW

==================================================

Create a prominent "Scan Machine" action.

The intended workflow:

Scan QR

↓

Machine identified

↓

Show machine

↓

Show active OF

↓

Show article

↓

Show current inspection period

↓

Start Inspection

Create a beautiful QR scanner UI placeholder.

Include:

- camera scanner frame

- scanning animation

- successful scan state

- invalid QR state

- manual machine code option

Use mock behavior for now.

==================================================

6. ARTICLES

==================================================

Create Articles page.

Each article has:

Article Code

Article Name

Description

Status

Quality Checks

Measurements

Tolerances

Examples:

ART-001 — Product Alpha

ART-002 — Product Beta

ART-003 — Product Gamma

Create:

- searchable table

- filters

- create article

- edit article

- article detail page

==================================================

7. ARTICLE QUALITY SPECIFICATIONS

==================================================

This is very important.

Different articles can have completely different measurements and tolerances.

Example Article:

ART-001

Product Alpha

Measurements:

Hauteur

49.5 – 50.5 mm

Largeur

24.5 – 25.0 mm

Longueur

99.0 – 101.0 mm

Épaisseur

2.0 – 2.3 mm

The UI must allow users to:

Add measurement

Edit measurement

Delete measurement

Set unit

Set minimum

Set maximum

Also show the article's QC checks.

Default checks:

Aspect

Couleur

Propreté

Planéité

Résistance / Tenue

Barasivité

Adaptation

Étiquette traçabilité

Étiquette code à barre

Users should be able to:

- add

- edit

- delete

- reorder

IMPORTANT:

Never assume all articles have the same measurements or checks.

==================================================

8. CURRENT INSPECTION

==================================================

THIS IS THE MOST IMPORTANT SCREEN.

Make it exceptionally easy for a factory employee.

At the top:

CURRENT INSPECTION

OF-2026-001

Machine 01

ART-001 — Product Alpha

Inspection period:

10:00 → 12:00

Show progress:

7 / 13 completed

==================================================

QC CHECKS

==================================================

Display each criterion as a large clean card.

Example:

ASPECT

[ ✓ CONFORME ] [ ✕ NON CONFORME ]

Optional comment.

Repeat for:

Aspect

Couleur

Propreté

Planéité

Résistance / Tenue

Barasivité

Adaptation

Étiquette traçabilité

Étiquette code à barre

When NC is selected:

- show red state

- reveal comment

- optionally select defect type

Make C and NC extremely obvious.

==================================================

MEASUREMENTS

==================================================

Display article-specific measurements.

Example:

DIMENSIONS

Hauteur

Allowed: 49.5 – 50.5 mm

Actual:

[ 50.1 ]

Status:

✓ Conforme

Largeur

Allowed: 24.5 – 25.0 mm

Actual:

[ 24.8 ]

Status:

✓ Conforme

Important:

The user enters the actual measurement.

The backend will eventually calculate C/NC using the tolerance.

For now use mock calculation.

Example:

Actual = 25.4

Allowed = 24.5–25.0

→ NON CONFORME

Make the tolerance visually obvious.

==================================================

PRODUCTION / MACHINE DATA

==================================================

Create clean sections for:

Machine information:

Panne machine

Nettoyage

Manque de matière

Manque personnel

Production information:

Ouvrier

Régleur

Compteur machine

Quantité déchets

Nature déchets

Cycle

Poids

Do NOT make this look like an Excel sheet.

Use logical cards and sections.

==================================================

SUBMIT INSPECTION

==================================================

Bottom of inspection:

Progress indicator

Buttons:

Save Draft

Submit Inspection

Before submission show confirmation modal:

"Submit inspection for 10:00–12:00?"

Summary:

- QC checks completed

- measurements completed

- production data

- waste data

After submit:

✓ Inspection Completed

10:00–12:00

OF-2026-001

Machine 01

Buttons:

Back to Dashboard

View Inspection

Start Next Inspection

==================================================

9. INSPECTION HISTORY

==================================================

Create Inspection History.

Columns:

Date

Time Slot

OF

Machine

Article

Inspector

Conformity

NC Count

Waste

Status

Filters:

Date

OF

Machine

Article

Inspector

Status

Click inspection → detailed inspection page.

==================================================

10. INSPECTION DETAIL

==================================================

Show:

OF

Machine

Article

Date

Time slot

Inspector

QC results:

Aspect → C

Couleur → C

Propreté → C

etc.

Measurements:

Hauteur

Allowed

Actual

Result

Largeur

Allowed

Actual

Result

Production:

Operator

Régleur

Machine counter

Cycle

Waste

Waste type

Weight

==================================================

11. REPORTS

==================================================

Create Reports page.

Filters:

Date

Date range

OF

Machine

Article

Report types:

Daily

Weekly

Monthly

Show:

Production

Waste

Conformity

NC count

Defects

Machine problems

Measurement deviations

Inspection completion

Add buttons:

Export PDF

Export Excel

These can be UI placeholders for now.

==================================================

12. ANALYTICS

==================================================

Create premium analytics dashboard.

Charts:

Conformity rate

NC trend

Waste trend

Production trend

Defect categories

Most frequent NC checks

Measurement deviations

Inspection completion rate

Filters:

Date

Machine

Article

OF

Use realistic mock data.

==================================================

13. USERS

==================================================

Admin Users page.

Show:

Name

Email

Role

Status

Last Login

Roles:

Admin

Quality Engineer

Operator

Supervisor

Create/edit user UI.

==================================================

14. SETTINGS

==================================================

Create settings page with:

Profile

Company

Notifications

Users

QC settings

System settings

==================================================

15. FRONTEND ARCHITECTURE

==================================================

This is extremely important.

Do NOT put mock data directly inside UI components.

Create a clean architecture similar to:

src/

  components/

  pages/

  layouts/

  services/

    api/

    auth/

  data/

    mock/

  types/

  hooks/

  utils/

Create TypeScript types for:

User

Machine

Article

ArticleMeasurement

ArticleCheck

OF

Inspection

InspectionCheck

InspectionMeasurement

ProductionData

Create service abstractions:

authService

ofService

machineService

articleService

inspectionService

reportService

analyticsService

For now they use mock data.

Later we will replace the service implementations with calls to our Python FastAPI backend.

The UI components must NOT care where the data comes from.

==================================================

16. API-READY

==================================================

Prepare the frontend for future endpoints such as:

POST /auth/login

GET /users/me

GET /ofs

POST /ofs

GET /ofs/:id

PUT /ofs/:id

GET /machines

GET /machines/:id

GET /articles

GET /articles/:id

GET /articles/:id/checks

GET /articles/:id/measurements

POST /inspections

GET /inspections

GET /inspections/:id

POST /inspections/:id/checks

POST /inspections/:id/measurements

GET /reports/daily

GET /reports/weekly

GET /reports/monthly

GET /analytics

Do NOT implement these backend endpoints.

Only prepare the frontend architecture for them.

==================================================

17. MOCK DATA

==================================================

Use realistic factory data.

OFs:

OF-2026-001

OF-2026-002

OF-2026-003

Machines:

Machine 01

Machine 02

Machine 03

Articles:

ART-001

ART-002

ART-003

Create realistic:

- quantities

- operators

- régleurs

- cycles

- weights

- waste

- C/NC results

- tolerances

- inspection periods

Include both C and NC examples.

==================================================

18. RESPONSIVENESS

==================================================

The Current Inspection screen must work exceptionally well on:

Desktop

Laptop

Tablet

Mobile

Factory workers may use tablets.

Use large touch-friendly controls.

==================================================

19. UX

==================================================

The application should always make these things obvious:

Where am I?

What machine?

Which OF?

Which article?

Which 2-hour period?

What must I check?

What is completed?

What remains?

Is anything NC?

Minimize clicks.

The QC inspection workflow should be extremely fast.

==================================================

20. FINAL QUALITY BAR

==================================================

The final result should feel like a real commercial SaaS product.

A factory manager should immediately understand it.

A quality engineer should be able to use it without training.

The UI should be impressive enough to show during an internship presentation or job interview.

Prioritize:

1. Current Inspection experience

2. Dashboard

3. OF management

4. Article/tolerance management

5. Inspection history

6. Reports/analytics

7. Everything else

Build the complete frontend now using mock data, with clean reusable components and an API-ready architecture.

Do not build backend/database functionality yet.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3be684dd-b7f2-446c-8a36-bfa47072fa3d).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
