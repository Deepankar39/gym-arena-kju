import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Greedy Activity Selection example for Gym Arena - KJU.
 *
 * Goal: select the maximum number of non-overlapping workout sessions.
 * Greedy choice: always choose the compatible session that finishes earliest.
 */
public class WorkoutSchedule_Greedy {

    static class WorkoutSession {
        String name;
        int startTime;
        int finishTime;

        WorkoutSession(String name, int startTime, int finishTime) {
            this.name = name;
            this.startTime = startTime;
            this.finishTime = finishTime;
        }

        @Override
        public String toString() {
            return name + " (" + startTime + " - " + finishTime + ")";
        }
    }

    /**
     * Activity Selection using a greedy strategy.
     *
     * After sorting by finish time, choosing the earliest-finishing compatible
     * session leaves the largest possible remaining time for later sessions.
     */
    static List<WorkoutSession> selectMaximumSessions(List<WorkoutSession> sessions) {
        List<WorkoutSession> sorted = new ArrayList<>(sessions);
        sorted.sort(Comparator.comparingInt(session -> session.finishTime));

        List<WorkoutSession> selected = new ArrayList<>();
        int lastFinishTime = Integer.MIN_VALUE;

        for (WorkoutSession session : sorted) {
            if (session.startTime >= lastFinishTime) {
                selected.add(session);
                lastFinishTime = session.finishTime;
            }
        }

        return selected;
    }

    public static void main(String[] args) {
        // Sample gym workout sessions: name, start time, finish time.
        List<WorkoutSession> sessions = List.of(
            new WorkoutSession("Warm-up", 6, 7),
            new WorkoutSession("Cardio", 6, 9),
            new WorkoutSession("Strength Training", 7, 8),
            new WorkoutSession("Cycling", 8, 10),
            new WorkoutSession("Core Workout", 9, 11),
            new WorkoutSession("Stretching", 10, 11)
        );

        System.out.println("Gym Arena - KJU: Greedy Workout Scheduling");
        System.out.println("Available sessions:");
        sessions.forEach(session -> System.out.println("  " + session));

        List<WorkoutSession> selected = selectMaximumSessions(sessions);

        System.out.println("\nSelected maximum non-overlapping sessions:");
        selected.forEach(session -> System.out.println("  " + session));
        System.out.println("Total selected sessions: " + selected.size());
    }
}
