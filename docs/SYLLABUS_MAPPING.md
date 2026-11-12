# 26MCC1L211 Syllabus Mapping – Gym Arena – KJU

This mapping follows the college syllabus phase by phase. The Java programs are standalone academic DSA implementations using the same Gym Arena domain, while the web application remains HTML/CSS/JavaScript + Node.js/Express + MySQL.

## Phase 1 – Linear Data Structures

| Syllabus Requirement | Gym Arena Java File | Domain Use | Status |
|---|---|---|---|
| Define project input records | `MemberManagement_LinkedList.java` | Member records | Complete |
| Linked list for data storage | `MemberManagement_LinkedList.java` | Member list | Complete |
| Insert / delete / traverse | `MemberManagement_LinkedList.java` | Member management | Complete |
| Additional linked-list use case | `Registration_LinkedList.java` | Registration/approval records | Complete |
| Stack using linked list | `GymAction_Stack.java` | Check-in/booking action history and undo | Complete |
| Queue using linked list | `EquipmentWaitlist_Queue.java` | Equipment waitlist FIFO | Complete |
| Stack expression handling | `MembershipFeeExpression_Stack.java` | Basic membership coin/fee expression | Complete |

## Phase 2 – Hierarchical and Graph Structures

| Syllabus Requirement | Gym Arena Java File | Domain Use | Status |
|---|---|---|---|
| Binary tree | `MemberDirectory_BinaryTree.java` | Structured member directory | Complete |
| Inorder / preorder / postorder | `MemberDirectory_BinaryTree.java`, `TreeTraversals_BinaryTree.java` | Tree traversal demonstration | Complete |
| Binary Search Tree | `MemberIndex_BST.java` | Member index by numeric member ID | Complete |
| Graph representation | `GymZones_GraphBFS.java` | Gym zones using adjacency matrix | Complete |
| BFS or DFS | `GymZones_GraphBFS.java` | BFS over connected gym zones | Complete |

## Phase 3 – Searching and Sorting

| Syllabus Requirement | Gym Arena Java File | Domain Use | Status |
|---|---|---|---|
| Linear search | `MemberSearch_LinearSearch.java` | Search member by name | Complete |
| Binary search | `MemberSearch_BinarySearch.java` | Search sorted member array by ID | Complete |
| Insertion sort | `MemberSort_InsertionSort.java` | Sort member records by ID | Complete |
| Quick sort | `MemberSort_QuickSort.java` | Second syllabus sorting technique | Complete |
| Basic performance comparison | `AlgorithmPerformance_Concept.java` | Conceptual time-complexity comparison | Complete |
| Sorting + searching in project workflow | `MemberSearchSort_Workflow.java` | Sort member records, then search the same records by ID/name | Complete |

## Phase 4 – Basic Algorithmic Problem Solving

The syllabus wording requires one Greedy / Dynamic Programming / Backtracking problem. Gym Arena now contains all three as academic examples, while Dynamic Programming is the one directly integrated into the web application flow.

| Technique / Requirement | Gym Arena File | Domain Use | Status |
|---|---|---|---|
| Greedy technique | `WorkoutSchedule_Greedy.java` | Activity Selection for maximum non-overlapping workout sessions | Complete |
| Dynamic Programming problem | `WorkoutPlanner_KnapsackDP.java` | 0/1 Knapsack workout planner | Complete |
| Backtracking problem | `WorkoutCombination_Backtracking.java` | Exact-duration workout combinations | Complete |
| Algorithm integrated into application flow | Web dashboard Workout Planner + `/api/member/workout-plan` | 0/1 Knapsack concept runs in the member web workflow | Complete |
| Final testing / different use-cases | `docs/TEACHER_DEMO_GUIDE.md`, `docs/TEST_CHECKLIST.md` | Java and web demonstration checklist | Complete |

## Website vs Java DSA

```text
Gym Arena web application
HTML/CSS/JavaScript -> Node.js/Express -> MySQL

Academic DSA layer
JavaDSA/*.java -> javac/java -> standalone algorithm demonstrations
```

The Java DSA programs do not require Tomcat. They intentionally use Gym Arena records and use-cases so each syllabus algorithm can be opened, compiled and demonstrated independently to the evaluator.
