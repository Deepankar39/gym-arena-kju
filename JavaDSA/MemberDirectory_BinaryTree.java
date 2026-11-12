public class MemberDirectory_BinaryTree {
    static class Node {
        String username;
        String name;
        Node left, right;
        Node(String username, String name) { this.username = username; this.name = name; }
    }

    private Node root;

    public void buildSampleTree() {
        root = new Node("26MCAD14", "Aarav");
        root.left = new Node("26MCAD08", "Diya");
        root.right = new Node("26MCAD21", "Kabir");
        root.left.left = new Node("26MCAD03", "Isha");
        root.left.right = new Node("26MCAD11", "Rohan");
    }

    public void inorder(Node node) {
        if (node == null) return;
        inorder(node.left);
        System.out.println(node.username + " - " + node.name);
        inorder(node.right);
    }

    public void preorder(Node node) {
        if (node == null) return;
        System.out.println(node.username + " - " + node.name);
        preorder(node.left);
        preorder(node.right);
    }

    public void postorder(Node node) {
        if (node == null) return;
        postorder(node.left);
        postorder(node.right);
        System.out.println(node.username + " - " + node.name);
    }

    public static void main(String[] args) {
        MemberDirectory_BinaryTree tree = new MemberDirectory_BinaryTree();
        tree.buildSampleTree();
        System.out.println("Inorder traversal:"); tree.inorder(tree.root);
        System.out.println("\nPreorder traversal:"); tree.preorder(tree.root);
        System.out.println("\nPostorder traversal:"); tree.postorder(tree.root);
    }
}
