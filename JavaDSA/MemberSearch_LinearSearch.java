public class MemberSearch_LinearSearch {
    static class Member {
        int id; String name;
        Member(int id, String name) { this.id = id; this.name = name; }
    }

    static Member linearSearchByName(Member[] members, String target) {
        for (Member member : members) {
            if (member.name.equalsIgnoreCase(target)) return member;
        }
        return null;
    }

    public static void main(String[] args) {
        Member[] members = {
            new Member(14, "Aarav"), new Member(8, "Diya"), new Member(21, "Kabir")
        };
        Member found = linearSearchByName(members, "Kabir");
        System.out.println(found == null ? "Not found" : "Found member ID " + found.id + ": " + found.name);
    }
}
