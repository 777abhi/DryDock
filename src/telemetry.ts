import { DryDockReport } from './types';

export class TelemetryExporter {
    exportToPrometheus(report: DryDockReport): string {
        let totalScore = 0;
        let highestScore = 0;

        for (const leak of report.cross_project_leakage) {
            totalScore += leak.score;
            if (leak.score > highestScore) {
                highestScore = leak.score;
            }
        }

        for (const dup of report.internal_duplicates) {
            totalScore += dup.score;
            if (dup.score > highestScore) {
                highestScore = dup.score;
            }
        }

        const metrics = [
            `# HELP drydock_cross_project_leaks Total number of cross-project leaks`,
            `# TYPE drydock_cross_project_leaks gauge`,
            `drydock_cross_project_leaks ${report.cross_project_leakage.length}`,
            ``,
            `# HELP drydock_internal_duplicates Total number of internal duplicates`,
            `# TYPE drydock_internal_duplicates gauge`,
            `drydock_internal_duplicates ${report.internal_duplicates.length}`,
            ``,
            `# HELP drydock_total_refactor_score Sum of all refactor scores`,
            `# TYPE drydock_total_refactor_score gauge`,
            `drydock_total_refactor_score ${totalScore.toFixed(2)}`,
            ``,
            `# HELP drydock_highest_refactor_score The highest refactor score found`,
            `# TYPE drydock_highest_refactor_score gauge`,
            `drydock_highest_refactor_score ${highestScore.toFixed(2)}`,
            ``
        ];

        return metrics.join('\n');
    }
}
