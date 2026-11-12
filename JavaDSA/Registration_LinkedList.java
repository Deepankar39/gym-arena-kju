public class Registration_LinkedList {
    static class RegistrationNode {
        String username;
        String fullName;
        String status;
        RegistrationNode next;

        RegistrationNode(String username, String fullName, String status) {
            this.username = username;
            this.fullName = fullName;
            this.status = status;
        }
    }

    private RegistrationNode head;

    public void register(String username, String fullName) {
        RegistrationNode node = new RegistrationNode(username, fullName, "PENDING");
        node.next = head;
        head = node;
    }

    public boolean approve(String username) {
        RegistrationNode current = head;
        while (current != null) {
            if (current.username.equalsIgnoreCase(username)) {
                current.status = "ACTIVE";
                return true;
            }
            current = current.next;
        }
        return false;
    }

    public boolean remove(String username) {
        RegistrationNode current = head, previous = null;
        while (current != null) {
            if (current.username.equalsIgnoreCase(username)) {
                if (previous == null) head = current.next;
                else previous.next = current.next;
                return true;
            }
            previous = current;
            current = current.next;
        }
        return false;
    }

    public void display() {
        RegistrationNode current = head;
        while (current != null) {
            System.out.printf("%s | %s | %s%n", current.username, current.fullName, current.status);
            current = current.next;
        }
    }

    public static void main(String[] args) {
        Registration_LinkedList registrations = new Registration_LinkedList();
        registrations.register("26MCAD14", "Student One");
        registrations.register("26MCAD08", "Student Two");
        registrations.approve("26MCAD14");
        registrations.display();
    }
}
