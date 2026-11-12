# Gym Arena – KJU Final Test Checklist

Use this checklist on the local Windows/MySQL environment before the academic demonstration.

## Authentication and role access
- [ ] Member can login at `/member-login.html`.
- [ ] Admin can login at `/admin-login.html`.
- [ ] Member account is rejected on the Admin Login page.
- [ ] Admin account is rejected on the Member Login page.
- [ ] First-login password change still works.
- [ ] Member cannot access `/admin.html`.
- [ ] Member receives 403 from `/api/admin/*` endpoints.
- [ ] Logout returns to the correct login portal.

## Member features
- [ ] Dashboard cards show live database values.
- [ ] Attendance history is readable on desktop and mobile.
- [ ] Membership renewal deducts coins and creates an invoice.
- [ ] Wallet transaction history remains correct.
- [ ] Equipment listing/booking/cancellation works.
- [ ] Current member does not appear in their own Connections directory.
- [ ] Connection request/accept/reject states display correctly.
- [ ] Workout partner session creation still works.
- [ ] QR code displays and admin scan toggles check-in/check-out.
- [ ] Diet request creation and history work.
- [ ] Store product images display when available.
- [ ] Broken/missing product images show the fallback.
- [ ] Store cart and checkout deduct the correct coins.
- [ ] My Orders is a separate navigation view.
- [ ] My Orders shows only the signed-in member's orders.
- [ ] Member View Details shows products, quantities, unit prices and totals.
- [ ] Invoice view and browser print work.

## Admin features
- [ ] Admin overview counts are database-driven.
- [ ] User approval/status and coin adjustment work.
- [ ] Admin user search works by member ID, college username and member name.
- [ ] Clearing Admin user search restores the full user list.
- [ ] A non-matching Admin user search shows the empty state without errors.
- [ ] QR attendance scanner/manual payload works.
- [ ] Equipment management works.
- [ ] Product management works.
- [ ] Diet request review works.
- [ ] Membership plan pricing works.
- [ ] Operations bookings and attendance tables load.
- [ ] Orders table shows customer, products, coins and statuses.
- [ ] Order search works by ID, name and username.
- [ ] Admin View Details shows full order line items.
- [ ] Audit log loads.

## Presentation and stability
- [ ] No horizontal page overflow on mobile/tablet.
- [ ] Dashboard/admin navigation remains accessible on small screens.
- [ ] Browser console has no unexpected errors.
- [ ] Node server terminal has no unexpected errors.
- [ ] Java DSA programs compile with `javac *.java`.


## DSA syllabus verification
- [ ] `javac *.java` compiles every JavaDSA file.
- [ ] Linked-list insert/delete/traverse demo runs.
- [ ] Linked-list Stack and Queue demos run.
- [ ] Stack expression evaluator runs.
- [ ] Binary Tree, BST and all three traversals run.
- [ ] Adjacency-matrix Graph + BFS demo runs.
- [ ] Linear Search and Binary Search demos run.
- [ ] Insertion Sort and Quick Sort demos run.
- [ ] `MemberSearchSort_Workflow` demonstrates sorting + searching in one workflow.
- [ ] Performance complexity comparison runs.
- [ ] Greedy Activity Selection demo runs.
- [ ] 0/1 Knapsack Dynamic Programming demo runs and the web Workout Planner works.
- [ ] Backtracking workout-combination demo runs.
