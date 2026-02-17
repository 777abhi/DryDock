import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { tokenize } from '@jscpd/tokenizer';
import { identifyProject } from './project-identifier';

export interface ScanResult {
    hash: string;
    project: string;
    path: string;
    lines: number;
}

export function scanFile(filePath: string): ScanResult | null {
    const MAX_FILE_SIZE = 500 * 1024; // 500KB
    const stats = fs.statSync(filePath);
    if (stats.size > MAX_FILE_SIZE) {
        console.warn(`Skipping ${filePath}: File too large (${(stats.size / 1024).toFixed(2)}KB)`);
        return null;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split(/\r?\n/).length;

    // Check for minified files (long lines)
    const MAX_LINE_LENGTH = 2000;
    const linesArr = content.split(/\r?\n/);
    if (linesArr.some(line => line.length > MAX_LINE_LENGTH)) {
        console.warn(`Skipping ${filePath}: Minified content detected (line > ${MAX_LINE_LENGTH})`);
        return null;
    }

    // Default to 'unknown' format if detection fails, though jscpd usually handles extensions well.
    // If format is unknown, jscpd might not tokenize correctly.
    const ext = path.extname(filePath).toLowerCase();
    const formatMap: { [key: string]: string } = {
        '.ts': 'typescript',
        '.tsx': 'typescript',
        '.js': 'javascript',
        '.jsx': 'javascript',
        '.css': 'css',
        '.scss': 'scss',
        '.less': 'less',
        '.html': 'html',
        '.py': 'python',
        '.java': 'java',
        '.c': 'c',
        '.cpp': 'cpp',
        '.cs': 'csharp',
        '.go': 'go',
        '.php': 'php',
        '.rb': 'ruby',
        '.rs': 'rust',
        '.swift': 'swift',
        '.kt': 'kotlin',
        '.scala': 'scala',
    };
    const format = formatMap[ext] || 'javascript';

    let tokens: any[];
    try {
        tokens = tokenize(content, format);
    } catch (e) {
        console.warn(`Failed to tokenize ${filePath}, skipping normalization.`);
        return null;
    }

    if (!tokens || tokens.length === 0) {
        return null;
    }

    let normalized = '';

    for (const token of tokens) {
        // Skip whitespace, newlines, and comments to normalize code structure
        if (['empty', 'new_line', 'comment'].includes(token.type)) {
            continue;
        }

        // Mask identifiers to detect structural clones
        // 'default' and 'function' are common types for identifiers and function names in @jscpd/tokenizer
        if (['default', 'function'].includes(token.type)) {
            // Skip empty tokens that are misclassified as default
            if (!token.value) continue;
            normalized += '__ID__';
        } else {
            normalized += token.value;
        }
    }

    if (normalized.length === 0) {
        return null;
    }

    const hash = crypto.createHash('sha256').update(normalized).digest('hex');
    const project = identifyProject(filePath);

    return {
        hash,
        project,
        path: filePath,
        lines
    };
}
