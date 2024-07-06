#!/usr/bin/env node

import inquirer from 'inquirer';

export async function collectInfo() {
    console.log("\u{1F31F} \u{1F31F} \u{1F31F} \u{1F31F} \u{1F31F} \u{1F31F} \u{1F31F} \u{1F31F} \u{1F31F} \u{1F31F}");
    console.log("\n");
    console.log("\u{1F31F} Cypress E2E Helper Bot  \u{1F31F}");
    console.log("\n");
    console.log("\u{1F31F} \u{1F31F} \u{1F31F} \u{1F31F} \u{1F31F} \u{1F31F} \u{1F31F} \u{1F31F} \u{1F31F} \u{1F31F}");

    
    const answers = await inquirer.prompt([
        {
            type: 'list',
            name: 'configLanguage',
            message: 'Which configuration language do you want to use?',
            choices: ['JavaScript', 'TypeScript'],
            default: 'JavaScript'
        },
        {
            type: 'input',
            name: 'baseUrl',
            message: 'What is the base URL for your tests?',
            default: 'https://example.cypress.io'
        },
        {
            type: 'confirm',
            name: 'testDesign',
            message: 'Do you want to setup BDD?',
            default: false
        },
        {
            type: 'confirm',
            name: 'reportChoice',
            message: 'Do you want to setup a reporter?',
            default: false
        },
        {
            type: 'confirm',
            name: 'installDependencies',
            message: 'Do you want to run npm install after creating the files?',
            default: false
        }
    ]);

    if (answers.testDesign) {
        const bundlerAnswer = await inquirer.prompt([
            {
                type: 'list',
                name: 'bundler',
                message: 'Which bundler do you prefer?',
                choices: ['browserify', 'esbuild', 'webpack'],
                default: 'browserify'
            }
        ]);
        answers.bundler = bundlerAnswer.bundler;
    }

    if (answers.reportChoice) {
        const reporterAnswer = await inquirer.prompt([
            {
                type: 'list',
                name: 'reporter',
                message: 'Which reporter do you prefer?',
                choices: answers.testDesign ? ['badeball', 'multipleCucumber'] : ['mochawesome', 'allure'],
                default: answers.testDesign ? 'badeball' : 'mochawesome'
            }
        ]);
        answers.reporter = reporterAnswer.reporter;
    }
    return answers;
}
