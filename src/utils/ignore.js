#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';

export async function createGitIgnoreFile(answers) {
    const ignorePath = path.join(process.cwd(), '.gitignore');

    // Define the content with no leading whitespace
    const ignoreContent = `# node_modules
node_modules/
# MacOS file
.DS_Store
# Jetbrains generated file
.idea/
# VsCode generated file
.vscode/
# Cypress reports
cypress/videos/
cypress/screenshots/`;

    // Write .gitignore file as plain text
    await fs.writeFile(ignorePath, ignoreContent, 'utf8');

    console.log('Created .gitignore');
}
