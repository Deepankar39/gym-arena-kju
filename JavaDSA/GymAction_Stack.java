public class GymAction_Stack {
    static class ActionNode {
        String action;
        ActionNode next;
        ActionNode(String action) { this.action = action; }
    }

    private ActionNode top;

    public void push(String action) {
        ActionNode node = new ActionNode(action);
        node.next = top;
        top = node;
    }

    public String pop() {
        if (top == null) return null;
        String action = top.action;
        top = top.next;
        return action;
    }

    public String peek() {
        return top == null ? null : top.action;
    }

    public void display() {
        ActionNode current = top;
        while (current != null) {
            System.out.println(current.action);
            current = current.next;
        }
    }

    public static void main(String[] args) {
        GymAction_Stack stack = new GymAction_Stack();
        stack.push("26MCAD14 CHECK-IN");
        stack.push("26MCAD14 BOOKED TREADMILL");
        stack.push("26MCAD08 CHECK-IN");

        System.out.println("Stack from TOP:");
        stack.display();
        System.out.println("\nUndo last action: " + stack.pop());
        System.out.println("Now on top: " + stack.peek());
    }
}
