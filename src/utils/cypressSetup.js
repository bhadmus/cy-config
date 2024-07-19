#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';

export async function createConfigurationFile(answers, configFilePath) {
    const cypressDirs = [
        path.join(process.cwd(), 'cypress', 'e2e'),
        path.join(process.cwd(), 'cypress', 'fixtures'),
        path.join(process.cwd(), 'cypress', 'support')
    ];

    for (const dir of cypressDirs) {
        await fs.ensureDir(dir);
    }

    // Create example spec file based on BDD selection
    if (!answers.testDesign) {
        const exampleSpecPath = path.join(process.cwd(), 'cypress', 'e2e', 'example.cy.' + (answers.configLanguage === 'JavaScript' ? 'js' : 'ts'));
        const exampleSpecContent = `
    describe('Example Test', () => {
        it('visits the base URL', () => {
            cy.visit('/');
        });
    });
            `;
        await fs.writeFile(exampleSpecPath, exampleSpecContent);
    }

    // Create example fixture file
    const exampleFixturePath = path.join(process.cwd(), 'cypress', 'fixtures', 'example.json');
    const exampleFixtureContent = {
        "exampleKey": "exampleValue"
    };
    await fs.writeJson(exampleFixturePath, exampleFixtureContent, { spaces: 2 });

    // Create support files based on BDD selection
    const configFileName = answers.configLanguage === 'JavaScript' ? 'cypress.config.js' : 'cypress.config.ts';
    configFilePath = path.join(process.cwd(), configFileName);
    const supportDir = path.join(process.cwd(), 'cypress', 'support');
    const supportE2EPath = path.join(supportDir, 'e2e.' + (answers.configLanguage === 'JavaScript' ? 'js' : 'ts'));
    const supportCommandsPath = path.join(supportDir, 'commands.' + (answers.configLanguage === 'JavaScript' ? 'js' : 'ts'));
    let supportE2EContent;

    if (!answers.testDesign && answers.reportChoice) {
        switch (answers.reporter) {
            case 'mochawesome':
                supportE2EContent = `
          // Import commands.js using ES2015 syntax:
          import './commands';
          import 'cypress-mochawesome-reporter/register';
        `
                break
            case 'allure':
                supportE2EContent = `
          // Import commands.js using ES2015 syntax:
          import './commands';
          import 'allure-cypress/commands';
        `
        }
    } else {
        supportE2EContent = `
        // Import commands.js using ES2015 syntax:
        import './commands';
            `;

    }
    const supportCommandsContent = `
    // ***********************************************
    // Visit https://on.cypress.io/custom-commands to
    // learn more about custom commands.
    // ***********************************************
    //
    //
    // -- This is a parent command --
    // Cypress.Commands.add('login', (email, password) => { ... })
    //
    //
    // -- This is a child command --
    // Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
    //
    //
    // -- This is a dual command --
    // Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
    //
    //
    // -- This will overwrite an existing command --
    // Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
        `;
    await fs.writeFile(supportE2EPath, supportE2EContent);
    await fs.writeFile(supportCommandsPath, supportCommandsContent);

    // Create BDD specific files if BDD is selected
    if (answers.testDesign) {
        const bddTestDir = path.join(process.cwd(), 'cypress', 'e2e', 'tests');
        await fs.ensureDir(bddTestDir);

        const stepsSpecPath = path.join(bddTestDir, 'steps.spec.cy.' + (answers.configLanguage === 'JavaScript' ? 'js' : 'ts'));
        const stepsSpecContent = `
    import { Given, When, Then } from '@badeball/cypress-cucumber-preprocessor';
    
    Given(/^I am on the home page$/, () => {
        cy.visit('/');
    });
    
    When(/^I click on doc link$/, () => {
        cy.get('[href="https://docs.cypress.io"]').should('exist').invoke('attr', 'target', '_self').click();
    });
    
    Then(/^I should see cypress doc$/, () => {
        cy.get('h1').should('contain', 'Why Cypress?');
    });
            `;
        await fs.writeFile(stepsSpecPath, stepsSpecContent);

        const featurePath = path.join('cypress', 'e2e', 'tests.feature');
        const featureContent = `
    Feature: Sample Test
    
        Scenario: Check site is available
            Given I am on the home page
            When I click on doc link
            Then I should see cypress doc
            `;
        await fs.writeFile(featurePath, featureContent);
    }
    // Create report generetor based on BDD selected and multiCucumber report selected

    const reportGenDir = path.join(process.cwd(), 'reportGen.js');

    if (answers.reportChoice && answers.reporter === 'multipleCucumber') {
        const multipleCucumberGeneratorConfig = `
      const report = require("multiple-cucumber-html-reporter");
    
      report.generate({
          jsonDir: "./reports/json/",
          reportPath: "./reports/html/cucumber-report/",
      });
        `;

        await fs.writeFile(reportGenDir, multipleCucumberGeneratorConfig);
    }



    // Create tsconfig.json if TypeScript is selected
    if (answers.configLanguage === 'TypeScript') {
        const tsConfigFilePath = path.join(process.cwd(), 'tsconfig.json');
        const tsConfigContent = `
    {
      "compilerOptions": {
        "esModuleInterop": true,
        "module": "nodenext",
        "target": "es5",
        "lib": [
          "es5",
          "dom"
        ],
        "types": [
          "cypress",
          "node"
        ]
      },
      "include": [
        "**/*.ts"
      ]
    }
            `;
        await fs.writeFile(tsConfigFilePath, tsConfigContent);
    }
    console.log(`Configuration file created at ${configFilePath}`);
}
