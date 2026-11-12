public class MembershipFeeExpression_Stack {
    static class NumberNode { double value; NumberNode next; NumberNode(double value) { this.value = value; } }
    static class OperatorNode { char value; OperatorNode next; OperatorNode(char value) { this.value = value; } }

    static class NumberStack {
        NumberNode top;
        void push(double value) { NumberNode n = new NumberNode(value); n.next = top; top = n; }
        double pop() { if (top == null) throw new IllegalArgumentException("Invalid expression"); double v = top.value; top = top.next; return v; }
        int size() { int n=0; for(NumberNode c=top;c!=null;c=c.next)n++; return n; }
    }

    static class OperatorStack {
        OperatorNode top;
        void push(char value) { OperatorNode n = new OperatorNode(value); n.next = top; top = n; }
        char pop() { if (top == null) throw new IllegalArgumentException("Invalid expression"); char v = top.value; top = top.next; return v; }
        char peek() { return top == null ? '\0' : top.value; }
        boolean isEmpty() { return top == null; }
    }

    static int precedence(char op) {
        return (op == '+' || op == '-') ? 1 : (op == '*' || op == '/') ? 2 : 0;
    }

    static void apply(NumberStack numbers, char op) {
        double right = numbers.pop();
        double left = numbers.pop();
        switch (op) {
            case '+': numbers.push(left + right); break;
            case '-': numbers.push(left - right); break;
            case '*': numbers.push(left * right); break;
            case '/': if (right == 0) throw new ArithmeticException("Division by zero"); numbers.push(left / right); break;
            default: throw new IllegalArgumentException("Unknown operator");
        }
    }

    public static double evaluate(String expression) {
        NumberStack numbers = new NumberStack();
        OperatorStack operators = new OperatorStack();

        for (int i = 0; i < expression.length();) {
            char ch = expression.charAt(i);
            if (Character.isWhitespace(ch)) { i++; continue; }
            if (Character.isDigit(ch) || ch == '.') {
                int start = i;
                while (i < expression.length() && (Character.isDigit(expression.charAt(i)) || expression.charAt(i) == '.')) i++;
                numbers.push(Double.parseDouble(expression.substring(start, i)));
                continue;
            }
            if (ch == '(') operators.push(ch);
            else if (ch == ')') {
                while (!operators.isEmpty() && operators.peek() != '(') apply(numbers, operators.pop());
                if (operators.isEmpty()) throw new IllegalArgumentException("Mismatched parentheses");
                operators.pop();
            } else if ("+-*/".indexOf(ch) >= 0) {
                while (!operators.isEmpty() && operators.peek() != '(' && precedence(operators.peek()) >= precedence(ch))
                    apply(numbers, operators.pop());
                operators.push(ch);
            } else throw new IllegalArgumentException("Invalid character: " + ch);
            i++;
        }
        while (!operators.isEmpty()) {
            if (operators.peek() == '(') throw new IllegalArgumentException("Mismatched parentheses");
            apply(numbers, operators.pop());
        }
        if (numbers.size() != 1) throw new IllegalArgumentException("Invalid expression");
        return numbers.pop();
    }

    public static void main(String[] args) {
        String expression = "100 + 25 * 2";
        System.out.println("Membership coin expression: " + expression);
        System.out.println("Result: " + evaluate(expression) + " coins");
    }
}
