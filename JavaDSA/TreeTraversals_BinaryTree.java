public class TreeTraversals_BinaryTree {
    static class Node {
        int value;
        Node left, right;
        Node(int value) { this.value = value; }
    }

    static void inorder(Node n) {
        if (n == null) return;
        inorder(n.left); System.out.print(n.value + " "); inorder(n.right);
    }
    static void preorder(Node n) {
        if (n == null) return;
        System.out.print(n.value + " "); preorder(n.left); preorder(n.right);
    }
    static void postorder(Node n) {
        if (n == null) return;
        postorder(n.left); postorder(n.right); System.out.print(n.value + " ");
    }

    public static void main(String[] args) {
        Node root = new Node(14);
        root.left = new Node(8);
        root.right = new Node(21);
        root.left.left = new Node(3);
        root.left.right = new Node(11);

        System.out.print("Inorder: "); inorder(root);
        System.out.print("\nPreorder: "); preorder(root);
        System.out.print("\nPostorder: "); postorder(root);
        System.out.println();
    }
}
