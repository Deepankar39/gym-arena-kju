/**
 * Phase 3 integrated workflow for Gym Arena - KJU.
 *
 * Demonstrates how sorting and searching are used together on the same
 * collection of gym member records:
 * 1. Start with unsorted members.
 * 2. Sort them by member ID using Insertion Sort.
 * 3. Search the sorted records by ID using Binary Search.
 * 4. Search by name using Linear Search.
 */
public class MemberSearchSort_Workflow {

    static class Member {
        int id;
        String username;
        String name;

        Member(int id, String username, String name) {
            this.id = id;
            this.username = username;
            this.name = name;
        }

        @Override
        public String toString() {
            return id + " | " + username + " | " + name;
        }
    }

    static void insertionSortById(Member[] members) {
        for (int i = 1; i < members.length; i++) {
            Member key = members[i];
            int j = i - 1;

            while (j >= 0 && members[j].id > key.id) {
                members[j + 1] = members[j];
                j--;
            }

            members[j + 1] = key;
        }
    }

    static Member binarySearchById(Member[] sortedMembers, int targetId) {
        int low = 0;
        int high = sortedMembers.length - 1;

        while (low <= high) {
            int mid = low + (high - low) / 2;

            if (sortedMembers[mid].id == targetId) {
                return sortedMembers[mid];
            }

            if (sortedMembers[mid].id < targetId) {
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }

        return null;
    }

    static Member linearSearchByName(Member[] members, String targetName) {
        for (Member member : members) {
            if (member.name.equalsIgnoreCase(targetName)) {
                return member;
            }
        }

        return null;
    }

    static void displayMembers(Member[] members) {
        for (Member member : members) {
            System.out.println("  " + member);
        }
    }

    public static void main(String[] args) {
        Member[] members = {
            new Member(21, "26MCAD21", "Kabir"),
            new Member(8, "26MCAD08", "Diya"),
            new Member(14, "26MCAD14", "Aarav"),
            new Member(3, "26MCAD03", "Isha")
        };

        System.out.println("Gym Arena - KJU: Search + Sort Project Workflow");
        System.out.println("\nOriginal member records:");
        displayMembers(members);

        insertionSortById(members);
        System.out.println("\nAfter Insertion Sort by member ID:");
        displayMembers(members);

        int targetId = 14;
        Member byId = binarySearchById(members, targetId);
        System.out.println("\nBinary Search for member ID " + targetId + ":");
        System.out.println(byId == null ? "  Not found" : "  Found -> " + byId);

        String targetName = "Kabir";
        Member byName = linearSearchByName(members, targetName);
        System.out.println("\nLinear Search for member name " + targetName + ":");
        System.out.println(byName == null ? "  Not found" : "  Found -> " + byName);
    }
}
