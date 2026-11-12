public class MemberSort_QuickSort {
    static class Member {
        int id; String name;
        Member(int id, String name) { this.id=id; this.name=name; }
    }

    static void quickSort(Member[] a, int low, int high) {
        if (low < high) {
            int p = partition(a, low, high);
            quickSort(a, low, p - 1);
            quickSort(a, p + 1, high);
        }
    }

    static int partition(Member[] a, int low, int high) {
        int pivot = a[high].id;
        int i = low - 1;
        for (int j = low; j < high; j++) {
            if (a[j].id <= pivot) {
                i++;
                Member temp = a[i]; a[i] = a[j]; a[j] = temp;
            }
        }
        Member temp = a[i + 1]; a[i + 1] = a[high]; a[high] = temp;
        return i + 1;
    }

    public static void main(String[] args) {
        Member[] members = {new Member(21,"Kabir"),new Member(8,"Diya"),new Member(14,"Aarav"),new Member(3,"Isha")};
        quickSort(members, 0, members.length - 1);
        for (Member m : members) System.out.println(m.id + " - " + m.name);
    }
}
