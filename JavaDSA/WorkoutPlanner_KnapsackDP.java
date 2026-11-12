public class WorkoutPlanner_KnapsackDP {
    static class Workout {
        String name; int minutes; int benefit;
        Workout(String name, int minutes, int benefit) { this.name=name; this.minutes=minutes; this.benefit=benefit; }
    }

    static void buildPlan(Workout[] workouts, int availableMinutes) {
        int n = workouts.length;
        int[][] dp = new int[n + 1][availableMinutes + 1];

        for (int i = 1; i <= n; i++) {
            for (int t = 0; t <= availableMinutes; t++) {
                dp[i][t] = dp[i - 1][t];
                if (workouts[i - 1].minutes <= t) {
                    dp[i][t] = Math.max(dp[i][t], workouts[i - 1].benefit + dp[i - 1][t - workouts[i - 1].minutes]);
                }
            }
        }

        System.out.println("Maximum benefit score: " + dp[n][availableMinutes]);
        System.out.println("Selected workouts:");
        int t = availableMinutes;
        for (int i = n; i > 0; i--) {
            if (dp[i][t] != dp[i - 1][t]) {
                Workout w = workouts[i - 1];
                System.out.println("- " + w.name + " (" + w.minutes + " min, benefit " + w.benefit + ")");
                t -= w.minutes;
            }
        }
    }

    public static void main(String[] args) {
        Workout[] workouts = {
            new Workout("Warm-up",10,12), new Workout("Treadmill",25,30),
            new Workout("Strength",35,45), new Workout("Cycling",30,36),
            new Workout("Core",20,26), new Workout("Stretching",15,18)
        };
        buildPlan(workouts, 60);
    }
}
