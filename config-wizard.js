#!/usr/bin/env node

import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Helper variables to handle __dirname with ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runWizard() {
  console.log("‹‹‹‹‹‹‹‹‹‹‹‹‹‹‹‹‹‹‹‹‹‹‹‹‹‹‹");
  console.log("‹ Cypress Auto Config Bot ‹");
  console.log("‹‹‹‹‹‹‹‹‹‹‹‹‹‹‹‹‹‹‹‹‹‹‹‹‹‹‹");

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
      type: 'list',
      name: 'testFramework',
      message: 'Which test framework do you want to use?',
      choices: ['Mocha', 'Jasmine'],
      default: 'Mocha'
    },
    {
      type: 'confirm',
      name: 'installDependencies',
      message: 'Do you want to run npm install after creating the files?',
      default: false
    }
  ]);

  // Ask for bundler only if BDD is chosen
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

  // Ask for reporter choice based on previous answers
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

  const configFileName = answers.configLanguage === 'JavaScript' ? 'cypress.config.js' : 'cypress.config.ts';
  const configFilePath = path.join(process.cwd(), configFileName);
  const packageJsonPath = path.join(process.cwd(), 'package.json');

  const tsConfigFilePath = path.join(process.cwd(), 'tsconfig.json'); // tsconfig.json path directly in cwd

  const reporterConfig = {
    mochawesome: `
        const { defineConfig } = require('cypress');

        module.exports = defineConfig({
            reporter: 'cypress-mochawesome-reporter',
            e2e: {
                baseUrl: '${answers.baseUrl}',
                setupNodeEvents(on, config) {
                    require('cypress-mochawesome-reporter/plugin')(on);
                }
            }
        });
      `,
    allure: `
          const { defineConfig } = require('cypress');
          const { allureCypress } = require("allure-cypress/reporter");

          module.exports = defineConfig({
              e2e: {
                  baseUrl: '${answers.baseUrl}',
                  setupNodeEvents(on, config) {
                      allureCypress(on);
                  }
              }
          });
            `


  }

  const bundlerConfig = {
    browserify: answers.configLanguage === 'JavaScript' ? `
const { defineConfig } = require('cypress');
const preprocessor = require("@badeball/cypress-cucumber-preprocessor");
const browserify = require("@badeball/cypress-cucumber-preprocessor/browserify");

async function setupNodeEvents(on, config) {
  await preprocessor.addCucumberPreprocessorPlugin(on, config);

  on('file:preprocessor', browserify.default(config));

  return config;

}

module.exports = defineConfig({
    e2e: {
        baseUrl: '${answers.baseUrl}',
        specPattern: '**/*.feature',
        setupNodeEvents,
    },
});
        ` : `
import { defineConfig } from 'cypress';
import { addCucumberPreprocessorPlugin } from "@badeball/cypress-cucumber-preprocessor";
import browserify from "@badeball/cypress-cucumber-preprocessor/browserify";

async function setupNodeEvents(
  on: Cypress.PluginEvents,
  config: Cypress.PluginConfigOptions
): Promise<Cypress.PluginConfigOptions> {
  // This is required for the preprocessor to be able to generate JSON reports after each run, and more,
  await addCucumberPreprocessorPlugin(on, config);

  on(
    "file:preprocessor",
    browserify(config, {
      typescript: require.resolve("typescript"),
    })
  );

  // Make sure to return the config object as it might have been modified by the plugin.
  return config;
}

export default defineConfig({
    e2e: {
        baseUrl: 'https://example.cypress.io',
        specPattern: '**/*.feature',
        setupNodeEvents,
    },
});
        
        `,
    esbuild: answers.configLanguage === 'JavaScript' ? `
const { defineConfig } = require("cypress");
const createBundler = require("@bahmutov/cypress-esbuild-preprocessor");
const {
  addCucumberPreprocessorPlugin,
} = require("@badeball/cypress-cucumber-preprocessor");
const {
  createEsbuildPlugin,
} = require("@badeball/cypress-cucumber-preprocessor/esbuild");

async function setupNodeEvents(on, config) {
  // This is required for the preprocessor to be able to generate JSON reports after each run, and more,
  await addCucumberPreprocessorPlugin(on, config);

  on(
    "file:preprocessor",
    createBundler({
      plugins: [createEsbuildPlugin(config)],
    })
  );

  // Make sure to return the config object as it might have been modified by the plugin.
  return config;
}

module.exports = defineConfig({
    e2e: {
        baseUrl: '${answers.baseUrl}',
        specPattern: '**/*.feature',
        setupNodeEvents,
    }
});
        ` : `
import { defineConfig } from "cypress";
import createBundler from "@bahmutov/cypress-esbuild-preprocessor";
import { addCucumberPreprocessorPlugin } from "@badeball/cypress-cucumber-preprocessor";
import { createEsbuildPlugin } from "@badeball/cypress-cucumber-preprocessor/esbuild";

async function setupNodeEvents(
  on: Cypress.PluginEvents,
  config: Cypress.PluginConfigOptions
): Promise<Cypress.PluginConfigOptions> {
  // This is required for the preprocessor to be able to generate JSON reports after each run, and more,
  await addCucumberPreprocessorPlugin(on, config);

  on(
    "file:preprocessor",
    createBundler({
      plugins: [createEsbuildPlugin(config)],
    })
  );

  // Make sure to return the config object as it might have been modified by the plugin.
  return config;
}

export default defineConfig({
    e2e: {
        baseUrl: '${answers.baseUrl}',
        specPattern: '**/*.feature',
        setupNodeEvents,
    },
});
        `,
    webpack: answers.configLanguage === 'JavaScript' ? `
const { defineConfig } = require("cypress");
const webpack = require("@cypress/webpack-preprocessor");
const {
  addCucumberPreprocessorPlugin,
} = require("@badeball/cypress-cucumber-preprocessor");

async function setupNodeEvents(on, config) {
  // This is required for the preprocessor to be able to generate JSON reports after each run, and more,
  await addCucumberPreprocessorPlugin(on, config);

  on(
    "file:preprocessor",
    webpack({
      webpackOptions: {
        resolve: {
          extensions: [".ts", ".js"],
        },
        module: {
          rules: [
            {
              test: /\.feature$/,
              use: [
                {
                  loader: "@badeball/cypress-cucumber-preprocessor/webpack",
                  options: config,
                },
              ],
            },
          ],
        },
      },
    })
  );

  // Make sure to return the config object as it might have been modified by the plugin.
  return config;
}

module.exports = defineConfig({
    e2e: {
        baseUrl: '${answers.baseUrl}',
        specPattern: '**/*.feature',
        setupNodeEvents,
    },
});
        ` : `
import { defineConfig } from "cypress";
import webpack from "@cypress/webpack-preprocessor";
import { addCucumberPreprocessorPlugin } from "@badeball/cypress-cucumber-preprocessor";

async function setupNodeEvents(
  on: Cypress.PluginEvents,
  config: Cypress.PluginConfigOptions
): Promise<Cypress.PluginConfigOptions> {
  // This is required for the preprocessor to be able to generate JSON reports after each run, and more,
  await addCucumberPreprocessorPlugin(on, config);

  on(
    "file:preprocessor",
    webpack({
      webpackOptions: {
        resolve: {
          extensions: [".ts", ".js"],
        },
        module: {
          rules: [
            {
              test: /\.ts$/,
              exclude: [/node_modules/],
              use: [
                {
                  loader: "ts-loader",
                },
              ],
            },
            {
              test: /\.feature$/,
              use: [
                {
                  loader: "@badeball/cypress-cucumber-preprocessor/webpack",
                  options: config,
                },
              ],
            },
          ],
        },
      },
    })
  );

  // Make sure to return the config object as it might have been modified by the plugin.
  return config;
}

export default defineConfig({
    e2e: {
        baseUrl: '${answers.baseUrl}',
        specPattern: '**/*.feature',
        setupNodeEvents,
    }
});
        `
  };

  let configContent;
  if (answers.testDesign) {
    configContent = bundlerConfig[answers.bundler];
  } else if (answers.reportChoice) {
    configContent = reporterConfig[answers.reporter]
  }
  else {
    configContent = answers.configLanguage === 'JavaScript' ? `
const { defineConfig } = require('cypress');

module.exports = defineConfig({
    e2e: {
        baseUrl: '${answers.baseUrl}',
        setupNodeEvents(on, config) {
            // implement node event listeners here
        }
    }
});
        ` : `
import { defineConfig } from 'cypress';

export default defineConfig({
    e2e: {
        baseUrl: '${answers.baseUrl}',
        setupNodeEvents(on, config) {
            // implement node event listeners here
        }
    }
});
        `;
  }

  await fs.writeFile(configFilePath, configContent);

  const packageJsonContent = {
    "name": "cypress-project",
    "version": "1.0.0",
    "description": "A project configured with Cypress",
    "main": "index.js",
    "scripts": {
      "test": "npx cypress run"
    },
    "devDependencies": {
      "cypress": "latest"
    }

  };

  if (answers.testDesign) {
    packageJsonContent.devDependencies["@badeball/cypress-cucumber-preprocessor"] = "latest";

    if (answers.bundler === 'browserify') {
      packageJsonContent.devDependencies["@cypress/browserify-preprocessor"] = "latest";
    } else if (answers.bundler === 'esbuild') {
      packageJsonContent.devDependencies["@bahmutov/cypress-esbuild-preprocessor"] = "latest";
    } else if (answers.bundler === 'webpack') {
      packageJsonContent.devDependencies["@cypress/webpack-preprocessor"] = "latest";
      packageJsonContent.devDependencies["webpack"] = "latest"; // Adding webpack itself as a dependency
    }
  }
  if (answers.testDesign && answers.reportChoice) {
    // let packageJsonObject = JSON.parse(packageJsonContent);
    packageJsonContent["cypress-cucumber-preprocessor"] = {
      "json": {
        "enabled": true,
        "output": "reports/json/results.json"
      }
    };
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJsonContent, null, 2));

    switch (answers.reporter) {
      case 'badeball':
        packageJsonContent["cypress-cucumber-preprocessor"]["html"] = {
          "enabled": true,
          "output": "reports/html/results.html"
        }
        break
      case 'multipleCucumber':
        packageJsonContent.devDependencies["multiple-cucumber-html-reporter"] = "latest";

    }


  } else if (answers.reportChoice) {
    switch (answers.reporter) {
      case 'mochawesome':
        packageJsonContent.devDependencies["cypress-mochawesome-reporter"] = "^3.8.2";
        break
      case 'allure':
        packageJsonContent.devDependencies["allure-commandline"] = "^2.29.0";
        packageJsonContent.devDependencies["allure-cypress"] = "^2.15.1";

    }
  }

  // Add typescript as a dependency if TypeScript is selected
  if (answers.configLanguage === 'TypeScript') {
    packageJsonContent.devDependencies["typescript"] = "latest";
    if (answers.bundler === 'webpack') {
      packageJsonContent.devDependencies["ts-loader"] = "latest";
    }
  }

  // Write package.json
  await fs.writeJson(packageJsonPath, packageJsonContent, { spaces: 2 });

  if (answers.installDependencies) {
    console.log('Running npm install...');
    exec('npm install', { cwd: process.cwd() }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error during npm install: ${error.message}`);
        return;
      }
      console.log(stdout);
      console.error(stderr);
    });
  }

  // Create Cypress folder structure
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
        cy.visit('${answers.baseUrl}');
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
  console.log(`Default Cypress folders and files created in ${process.cwd()}`);
  if (answers.configLanguage === 'TypeScript') {
    console.log(`TypeScript configuration file created at ${tsConfigFilePath}`);
  }
}

runWizard().catch((error) => {
  console.error('Error running wizard:', error);
});
