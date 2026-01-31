import * as fs from 'fs';
import * as path from 'path';

export function identifyProject(filePath: string): string {
    let currentDir = path.dirname(path.resolve(filePath));
    const root = path.parse(currentDir).root;

    while (currentDir !== root) {
        if (
            fs.existsSync(path.join(currentDir, 'package.json')) ||
            fs.existsSync(path.join(currentDir, 'go.mod')) ||
            fs.existsSync(path.join(currentDir, '.git'))
        ) {
            return path.basename(currentDir);
        }
        currentDir = path.dirname(currentDir);
    }

    // Check the root directory as well (edge case)
    if (
        fs.existsSync(path.join(currentDir, 'package.json')) ||
        fs.existsSync(path.join(currentDir, 'go.mod')) ||
        fs.existsSync(path.join(currentDir, '.git'))
    ) {
        return path.basename(currentDir);
    }

    // Fallback: Use the immediate parent directory name if no marker found
    // Or return 'unknown'
    return 'unknown';
}
