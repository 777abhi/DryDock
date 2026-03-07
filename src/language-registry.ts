export interface ILanguagePlugin {
    extension: string;
    format: string;
}

export class LanguageRegistry {
    private static instance: LanguageRegistry;
    private formatMap: Map<string, string>;

    private constructor() {
        this.formatMap = new Map<string, string>([
            ['.ts', 'typescript'],
            ['.tsx', 'typescript'],
            ['.js', 'javascript'],
            ['.jsx', 'javascript'],
            ['.css', 'css'],
            ['.scss', 'scss'],
            ['.less', 'less'],
            ['.html', 'html'],
            ['.py', 'python'],
            ['.java', 'java'],
            ['.c', 'c'],
            ['.cpp', 'cpp'],
            ['.cs', 'csharp'],
            ['.go', 'go'],
            ['.php', 'php'],
            ['.rb', 'ruby'],
            ['.rs', 'rust'],
            ['.swift', 'swift'],
            ['.kt', 'kotlin'],
            ['.scala', 'scala']
        ]);
    }

    public static getInstance(): LanguageRegistry {
        if (!LanguageRegistry.instance) {
            LanguageRegistry.instance = new LanguageRegistry();
        }
        return LanguageRegistry.instance;
    }

    public registerExtension(extension: string, format: string): void {
        const ext = extension.startsWith('.') ? extension : `.${extension}`;
        this.formatMap.set(ext.toLowerCase(), format);
    }

    public registerPlugin(plugin: ILanguagePlugin): void {
        this.registerExtension(plugin.extension, plugin.format);
    }

    public getFormat(extension: string): string {
        return this.formatMap.get(extension.toLowerCase()) || 'javascript';
    }
}
