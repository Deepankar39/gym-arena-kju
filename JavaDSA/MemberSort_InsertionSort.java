public class MemberSort_InsertionSort {
    static class Member {
        int id; String name;
        Member(int id, String name) { this.id=id; this.name=name; }
    }

    static void insertionSort(Member[] members) {
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

    public static void main(String[] args) {
        Member[] members = {new Member(21,"Kabir"),new Member(8,"Diya"),new Member(14,"Aarav"),new Member(3,"Isha")};
        insertionSort(members);
        for (Member m : members) System.out.println(m.id + " - " + m.name);
    }
}
