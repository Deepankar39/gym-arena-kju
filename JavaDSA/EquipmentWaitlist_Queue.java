public class EquipmentWaitlist_Queue {
    static class RequestNode {
        String username;
        String equipment;
        RequestNode next;
        RequestNode(String username, String equipment) { this.username = username; this.equipment = equipment; }
    }

    private RequestNode front, rear;

    public void enqueue(String username, String equipment) {
        RequestNode node = new RequestNode(username, equipment);
        if (rear == null) front = rear = node;
        else { rear.next = node; rear = node; }
    }

    public String dequeue() {
        if (front == null) return null;
        String served = front.username + " -> " + front.equipment;
        front = front.next;
        if (front == null) rear = null;
        return served;
    }

    public void display() {
        RequestNode current = front;
        while (current != null) {
            System.out.println(current.username + " waiting for " + current.equipment);
            current = current.next;
        }
    }

    public static void main(String[] args) {
        EquipmentWaitlist_Queue queue = new EquipmentWaitlist_Queue();
        queue.enqueue("26MCAD14", "Treadmill");
        queue.enqueue("26MCAD08", "Treadmill");
        queue.enqueue("26MCAD21", "Treadmill");
        System.out.println("FIFO queue:");
        queue.display();
        System.out.println("\nServe first: " + queue.dequeue());
    }
}
