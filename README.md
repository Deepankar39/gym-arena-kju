# Gym Arena – KJU

A functional MCA Semester 1 mini-project for **26MCC1L211 – Data Structures and Algorithms Practical**.

## Technology

- Frontend: HTML, CSS, Vanilla JavaScript
- Backend: Node.js + Express
- Database: MySQL
- DSA practical programs: Java (standalone; no Tomcat required)

## Main Application Features

- College-format registration and login (`26MCAD14` style)
- Initial password = username; forced password change after first login
- Admin approval of new users
- Admin-managed Gym Arena coin wallet
- Monthly membership renewal using coins
- Equipment list and date-based booking visibility
- Member connections and workout-session planning
- QR-based admin check-in/check-out
- Diet-plan request workflow
- Integrated 0/1 Knapsack workout planner
- Product shop paid with internal coins
- Membership and purchase invoices
- Admin dashboards for users, coins, equipment, products, diet requests, membership plans, attendance, bookings, orders and audit logs
- Animated responsive homepage

## 1. MySQL Setup

Open MySQL Workbench and run:

1. `backend/database/schema.sql`
2. `backend/database/seed.sql`

This creates the database `gym_arena_kju`.

## 2. Backend Setup

From `backend`:

```powershell
copy .env.example .env
```

Edit `.env` and set your MySQL password plus a long random `JWT_SECRET`.

Then install packages:

```powershell
npm install
```

Create the first administrator:

```powershell
npm run seed-admin
```

Default admin credential created by the seed script:

- Username: `26MCAD00`
- Initial password: `26MCAD00`

The admin must change the password after first login.

Start the web application:

```powershell
npm start
```

Open:

```text
http://localhost:3000
```

## 3. Normal User Flow

1. Register using a college-format username such as `26MCAD14`.
2. Admin logs in and approves the user.
3. User logs in with username as the initial password.
4. User is forced to change the password.
5. Admin credits coins to the user.
6. User can renew membership, book equipment, connect with members, display a QR code, request a diet plan, buy products and view invoices.

## 4. Java DSA Programs

The `JavaDSA` folder is intentionally independent from Node/MySQL.

Compile all programs:

```powershell
cd JavaDSA
javac *.java
```

Run any program individually, for example:

```powershell
java MemberManagement_LinkedList
java EquipmentWaitlist_Queue
java MemberIndex_BST
java GymZones_GraphBFS
java MemberSearchSort_Workflow
java WorkoutSchedule_Greedy
java WorkoutPlanner_KnapsackDP
java WorkoutCombination_Backtracking
```

See `docs/SYLLABUS_MAPPING.md` for the exact syllabus-to-file mapping.

## Important Scope Notes

- Gym Arena coins are an **internal application credit system**, not real currency or a payment gateway.
- College identity is represented by the required username pattern plus admin approval. Real KJU SSO can be integrated later if an official identity API is available.
- Diet-plan requests are intended for general fitness planning. Medical nutrition requirements should be handled by a qualified professional.
- This project is deliberately kept within MCA mini-project scope: no microservices, React, payment gateway, AI diagnosis or enterprise infrastructure.
