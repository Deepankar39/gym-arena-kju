# Teacher Demo Guide – Gym Arena – KJU

## A. Web Application Demo

Start MySQL, then from `backend` run:

```powershell
npm start
```

Open `http://localhost:3000`.

Suggested demonstration sequence:

1. Show the homepage and separate Member/Admin login portals.
2. Register a college-format member such as `26MCAD14`.
3. Login as admin, search the user, approve the account and credit coins.
4. Login as the member and complete the first-password change.
5. Renew monthly membership and open the generated invoice.
6. Book equipment and show booking dates/member information.
7. Show member connections and workout-partner planning.
8. Display the member QR and demonstrate admin check-in/check-out.
9. Submit and review a diet-plan request.
10. Buy a Gym Store product with coins, open My Orders and view the invoice.
11. Show admin Orders search/details and audit logs.
12. Open the member Workout Planner to demonstrate the integrated 0/1 Knapsack use-case.

## B. DSA Demonstration – Exact Commands

From `JavaDSA`:

```powershell
javac *.java
```

### Phase 1 – Linear Structures

```powershell
java MemberManagement_LinkedList
java Registration_LinkedList
java GymAction_Stack
java EquipmentWaitlist_Queue
java MembershipFeeExpression_Stack
```

### Phase 2 – Trees and Graphs

```powershell
java MemberDirectory_BinaryTree
java TreeTraversals_BinaryTree
java MemberIndex_BST
java GymZones_GraphBFS
```

### Phase 3 – Searching and Sorting

```powershell
java MemberSearch_LinearSearch
java MemberSearch_BinarySearch
java MemberSort_InsertionSort
java MemberSort_QuickSort
java MemberSearchSort_Workflow
java AlgorithmPerformance_Concept
```

`MemberSearchSort_Workflow` is the clearest file to show for the syllabus requirement that sorting and searching are used together in the project workflow.

### Phase 4 – Basic Algorithmic Problem Solving

```powershell
java WorkoutSchedule_Greedy
java WorkoutPlanner_KnapsackDP
java WorkoutCombination_Backtracking
```

The syllabus requires one of these approaches; Gym Arena contains all three. The 0/1 Knapsack DP concept is additionally integrated into the actual member web dashboard.

Every Java file contains its own `main()` method and can be demonstrated independently without Tomcat.
