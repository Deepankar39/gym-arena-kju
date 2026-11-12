public class MemberManagement_LinkedList {
    static class Member {
        int id;
        String name;
        boolean membershipActive;
        Member next;

        Member(int id, String name, boolean membershipActive) {
            this.id = id;
            this.name = name;
            this.membershipActive = membershipActive;
        }
    }

    private Member head;

    public void insert(int id, String name, boolean active) {
        Member node = new Member(id, name, active);
        if (head == null) {
            head = node;
            return;
        }
        Member current = head;
        while (current.next != null) current = current.next;
        current.next = node;
    }

    public boolean delete(int id) {
        if (head == null) return false;
        if (head.id == id) {
            head = head.next;
            return true;
        }
        Member current = head;
        while (current.next != null && current.next.id != id) current = current.next;
        if (current.next == null) return false;
        current.next = current.next.next;
        return true;
    }

    public void traverse() {
        Member current = head;
        while (current != null) {
            System.out.printf("ID=%d, Name=%s, Membership=%s%n",
                    current.id, current.name, current.membershipActive ? "ACTIVE" : "INACTIVE");
            current = current.next;
        }
    }

    public static void main(String[] args) {
        MemberManagement_LinkedList list = new MemberManagement_LinkedList();
        list.insert(14, "Aarav", true);
        list.insert(7, "Diya", true);
        list.insert(21, "Kabir", false);

        System.out.println("After insert + traverse:");
        list.traverse();

        System.out.println("\nDelete member ID 7:");
        list.delete(7);
        list.traverse();
    }
}
