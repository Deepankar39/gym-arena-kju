public class MemberIndex_BST {
    static class Node {
        int memberId;
        String username;
        Node left, right;
        Node(int memberId, String username) { this.memberId = memberId; this.username = username; }
    }

    private Node root;

    public void insert(int memberId, String username) { root = insert(root, memberId, username); }
    private Node insert(Node node, int id, String username) {
        if (node == null) return new Node(id, username);
        if (id < node.memberId) node.left = insert(node.left, id, username);
        else if (id > node.memberId) node.right = insert(node.right, id, username);
        return node;
    }

    public Node search(int memberId) {
        Node current = root;
        while (current != null) {
            if (memberId == current.memberId) return current;
            current = memberId < current.memberId ? current.left : current.right;
        }
        return null;
    }

    public void inorder(Node node) {
        if (node == null) return;
        inorder(node.left);
        System.out.println(node.memberId + " -> " + node.username);
        inorder(node.right);
    }

    public static void main(String[] args) {
        MemberIndex_BST bst = new MemberIndex_BST();
        bst.insert(14, "26MCAD14");
        bst.insert(8, "26MCAD08");
        bst.insert(21, "26MCAD21");
        bst.insert(3, "26MCAD03");

        System.out.println("BST inorder (sorted by member ID):");
        bst.inorder(bst.root);
        Node found = bst.search(21);
        System.out.println("\nSearch ID 21: " + (found == null ? "Not found" : found.username));
    }
}
