public class GymZones_GraphBFS {
    private final String[] zones = {"Entrance", "Cardio", "Strength", "Free Weights", "Cycling", "Stretching"};
    private final int[][] graph = new int[zones.length][zones.length];
    private final boolean[] available = new boolean[zones.length];

    public GymZones_GraphBFS() {
        connect(0,1); connect(0,2); connect(1,4); connect(1,5); connect(2,3); connect(2,5); connect(3,5);
        available[3] = true;
        available[4] = true;
    }

    private void connect(int a, int b) { graph[a][b] = graph[b][a] = 1; }

    public int bfsNearestAvailable(int start) {
        boolean[] visited = new boolean[zones.length];
        int[] queue = new int[zones.length];
        int front = 0, rear = 0;
        queue[rear++] = start;
        visited[start] = true;

        while (front < rear) {
            int current = queue[front++];
            if (available[current]) return current;
            for (int i = 0; i < zones.length; i++) {
                if (graph[current][i] == 1 && !visited[i]) {
                    visited[i] = true;
                    queue[rear++] = i;
                }
            }
        }
        return -1;
    }

    public static void main(String[] args) {
        GymZones_GraphBFS gym = new GymZones_GraphBFS();
        int nearest = gym.bfsNearestAvailable(0);
        System.out.println("Start zone: " + gym.zones[0]);
        System.out.println("Nearest available zone using BFS: " + (nearest >= 0 ? gym.zones[nearest] : "None"));
    }
}
