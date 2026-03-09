import * as assert from 'assert';
import { DryDockReport, CrossProjectLeakage, InternalDuplicate } from '../src/types';
import { TelemetryExporter } from '../src/telemetry';

function testTelemetryGeneration() {
    console.log("Testing TelemetryExporter...");

    const mockReport: DryDockReport = {
        cross_project_leakage: [
            {
                hash: 'hash1',
                lines: 50,
                complexity: 5,
                frequency: 2,
                spread: 2,
                score: 282.84,
                projects: ['projA', 'projB'],
                occurrences: []
            },
            {
                hash: 'hash2',
                lines: 100,
                complexity: 10,
                frequency: 3,
                spread: 3,
                score: 1558.85,
                projects: ['projA', 'projB', 'projC'],
                occurrences: []
            }
        ],
        internal_duplicates: [
            {
                hash: 'hash3',
                lines: 20,
                complexity: 2,
                frequency: 2,
                score: 40,
                project: 'projA',
                occurrences: []
            }
        ]
    };

    const exporter = new TelemetryExporter();
    const metrics = exporter.exportToPrometheus(mockReport);

    // Validate metrics output
    assert.ok(metrics.includes('drydock_cross_project_leaks 2'), 'Should contain correct cross project leaks count');
    assert.ok(metrics.includes('drydock_internal_duplicates 1'), 'Should contain correct internal duplicates count');
    assert.ok(metrics.includes('drydock_total_refactor_score 1881.69'), 'Should contain correct total score (282.84 + 1558.85 + 40)');
    assert.ok(metrics.includes('drydock_highest_refactor_score 1558.85'), 'Should contain correct highest score');

    console.log("PASS: TelemetryExporter generated valid Prometheus metrics.");
}

try {
    testTelemetryGeneration();
} catch (e) {
    console.error("FAIL: Telemetry test failed", e);
    process.exit(1);
}
