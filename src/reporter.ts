import { DryDockReport, InternalDuplicate, CrossProjectLeakage } from './types';

export function exportToCSV(report: DryDockReport): string {
    const headers = ['Type', 'Hash', 'Lines', 'Frequency', 'Score', 'Spread', 'Projects', 'Occurrences'];
    const rows: string[] = [headers.join(',')];

    // Helper to escape CSV fields
    const escape = (field: any) => {
        const str = String(field);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
    };

    report.cross_project_leakage.forEach(item => {
        const occurrences = item.occurrences.map(o => `${o.file}${o.author ? ` (${o.author})` : ''}`).join('; ');
        rows.push([
            'Cross-Project',
            item.hash,
            item.lines,
            item.frequency,
            item.score.toFixed(2),
            item.spread,
            escape(item.projects.join(', ')),
            escape(occurrences)
        ].join(','));
    });

    report.internal_duplicates.forEach(item => {
        const occurrences = item.occurrences.join('; ');
        rows.push([
            'Internal',
            item.hash,
            item.lines,
            item.frequency,
            item.score.toFixed(2),
            1, // Spread is 1
            escape(item.project),
            escape(occurrences)
        ].join(','));
    });

    return rows.join('\n');
}

export function exportToJUnit(report: DryDockReport): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<testsuites>\n';

    // Cross Project Leakage
    xml += `  <testsuite name="Cross Project Leakage" tests="${report.cross_project_leakage.length}" failures="${report.cross_project_leakage.length}">\n`;
    report.cross_project_leakage.forEach(item => {
        xml += `    <testcase name="Hash: ${item.hash.slice(0, 8)}" classname="CrossProjectLeakage">\n`;
        xml += `      <failure message="${item.lines} lines shared across ${item.projects.length} projects">\n`;
        xml += `        Score: ${item.score.toFixed(2)}\n`;
        xml += `        Projects: ${item.projects.join(', ')}\n`;
        xml += `        Occurrences: ${item.occurrences.map(o => o.file).join(', ')}\n`;
        xml += `      </failure>\n`;
        xml += `    </testcase>\n`;
    });
    xml += `  </testsuite>\n`;

    // Internal Duplicates
    xml += `  <testsuite name="Internal Duplicates" tests="${report.internal_duplicates.length}" failures="${report.internal_duplicates.length}">\n`;
    report.internal_duplicates.forEach(item => {
        xml += `    <testcase name="Hash: ${item.hash.slice(0, 8)}" classname="InternalDuplicate.${item.project}">\n`;
        xml += `      <failure message="${item.lines} lines duplicated within ${item.project}">\n`;
        xml += `        Score: ${item.score.toFixed(2)}\n`;
        xml += `        Occurrences: ${item.occurrences.join(', ')}\n`;
        xml += `      </failure>\n`;
        xml += `    </testcase>\n`;
    });
    xml += `  </testsuite>\n`;

    xml += '</testsuites>';
    return xml;
}

export function exportToHTML(report: DryDockReport, template: string): string {
    // Inject the report data into the template
    // We replace the fetch logic with direct data injection
    const replacement = `loadData = async () => {
             reportData = ${JSON.stringify(report)};
             renderStats(reportData);
             renderMatrix(reportData);
             renderLeakage(reportData);
        };`;

    return template.replace(/loadData\s*=\s*async\s*\(\)\s*=>\s*\{[\s\S]*?\};/, replacement);
}
