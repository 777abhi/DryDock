# Visual Capture Simulation (Screenshots)

## 1. The CLI Output

**Description:**
The terminal window displays a clean, minimalist output after the execution of the scan command.

*   **Command:** `drydock scan ./Project_A ./Project_B`
*   **Output:**
    *   A summary line indicates "Found 2 project roots".
    *   A final success message appears in green: "Dashboard successfully launched at localhost:3000".
    *   The raw JSON data is suppressed, keeping the interface user-friendly.

## 2. The Overview Dashboard

**Description:**
The web dashboard opens to the "Leakage Matrix" view.

*   **Layout:** A grid-based heatmap matrix is visible at the center.
*   **Matrix:** The intersection cell between `Project_A` and `Project_B` is highlighted in a warm color (e.g., orange or red), indicating a non-zero overlap (Cross-Project Leakage).
*   **Treemap/Clusters:** On the side or below, "Barnacles" (duplication clusters) are visualized. The largest cluster corresponds to the 60-line shared function, labeled as "High Priority".
*   **Leaderboard:** A "Refactor Leaderboard" list on the right shows the Cross-Project item ranked #1 with a high RefactorScore (approx 345), distinct from the lower-scoring internal duplication (score ~82).

## 3. The Comparison View

**Description:**
Upon clicking the top-ranked item in the Leaderboard, the view shifts to the "Clone Inspector".

*   **Side-by-Side Diff:** Two code panes are displayed side-by-side.
    *   **Left Pane:** Shows `Project_A/shared.ts` (lines 1-60).
    *   **Right Pane:** Shows `Project_B/shared.ts` (lines 1-60).
*   **Highlighting:** The identical code blocks are highlighted in yellow/red to indicate the match.
*   **Badges:** A prominent "Library Candidate" badge appears above the comparison, triggered by the high Spread (P=2) and RefactorScore.
*   **Metadata:** The header displays the calculated metrics: `Spread: 2 | Frequency: 2 | Lines: 60`.
