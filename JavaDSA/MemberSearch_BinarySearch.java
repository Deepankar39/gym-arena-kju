public class MemberSearch_BinarySearch {
    static class Member {
        int id; String username;
        Member(int id, String username) { this.id = id; this.username = username; }
    }

    static Member binarySearchById(Member[] sortedMembers, int targetId) {
        int low = 0, high = sortedMembers.length - 1;
        while (low <= high) {
            int mid = low + (high - low) / 2;
            if (sortedMembers[mid].id == targetId) return sortedMembers[mid];
            if (sortedMembers[mid].id < targetId) low = mid + 1;
            else high = mid - 1;
        }
        return null;
    }

    public static void main(String[] args) {
        Member[] sorted = {
            new Member(3,"26MCAD03"), new Member(8,"26MCAD08"),
            new Member(14,"26MCAD14"), new Member(21,"26MCAD21")
        };
        Member found = binarySearchById(sorted, 14);
        System.out.println(found == null ? "Not found" : "Found: " + found.username);
    }
}
