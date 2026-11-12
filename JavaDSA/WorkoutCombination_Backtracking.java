import java.util.ArrayList;
import java.util.List;

/**
 * Backtracking example for Gym Arena - KJU.
 *
 * Finds every workout combination whose total duration exactly matches
 * the requested workout time. Each workout can be selected at most once.
 */
public class WorkoutCombination_Backtracking {

    static class Workout {
        String name;
        int duration;

        Workout(String name, int duration) {
            this.name = name;
            this.duration = duration;
        }

        @Override
        public String toString() {
            return name + " (" + duration + " min)";
        }
    }

    static void findCombinations(List<Workout> workouts, int targetMinutes) {
        System.out.println("Target duration: " + targetMinutes + " minutes");
        System.out.println("\nValid workout combinations:");

        int[] solutionCount = {0};
        backtrack(workouts, targetMinutes, 0, 0, new ArrayList<>(), solutionCount);

        if (solutionCount[0] == 0) {
            System.out.println("  No exact workout combination found.");
        } else {
            System.out.println("\nTotal valid combinations: " + solutionCount[0]);
        }
    }

    /**
     * Recursively explores two choices for each workout:
     * 1. Include the workout.
     * 2. Exclude the workout.
     *
     * When a choice exceeds the target or reaches the end without matching it,
     * the recursion returns to the previous decision point. That return is the
     * backtracking step, allowing another choice to be tried.
     */
    static void backtrack(
        List<Workout> workouts,
        int targetMinutes,
        int index,
        int currentMinutes,
        List<Workout> currentCombination,
        int[] solutionCount
    ) {
        if (currentMinutes == targetMinutes) {
            solutionCount[0]++;
            System.out.print("  Combination " + solutionCount[0] + ": ");
            for (int i = 0; i < currentCombination.size(); i++) {
                if (i > 0) System.out.print(" + ");
                System.out.print(currentCombination.get(i));
            }
            System.out.println();
            return;
        }

        if (currentMinutes > targetMinutes || index == workouts.size()) {
            return;
        }

        Workout workout = workouts.get(index);

        // Choice 1: include the current workout.
        currentCombination.add(workout);
        backtrack(
            workouts,
            targetMinutes,
            index + 1,
            currentMinutes + workout.duration,
            currentCombination,
            solutionCount
        );

        // Backtrack: undo the include choice before exploring the exclude choice.
        currentCombination.remove(currentCombination.size() - 1);
        System.out.println("Backtrack: remove " + workout.name
            + " and try the next choice from " + currentMinutes + " minutes.");

        // Choice 2: exclude the current workout.
        backtrack(
            workouts,
            targetMinutes,
            index + 1,
            currentMinutes,
            currentCombination,
            solutionCount
        );
    }

    public static void main(String[] args) {
        // Sample input for a 60-minute workout target.
        List<Workout> workouts = List.of(
            new Workout("Warm-up", 10),
            new Workout("Treadmill", 25),
            new Workout("Strength Training", 35),
            new Workout("Core Workout", 20),
            new Workout("Stretching", 15)
        );
        int targetMinutes = 60;

        System.out.println("Gym Arena - KJU: Backtracking Workout Combinations");
        System.out.println("Available workouts:");
        workouts.forEach(workout -> System.out.println("  " + workout));
        System.out.println();

        findCombinations(workouts, targetMinutes);
    }
}
