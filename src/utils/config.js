#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';

export async function createConfigFile(answers) {
  const configFileName = answers.configLanguage === 'JavaScript' ? 'cypress.config.js' : 'cypress.config.ts';
  const configFilePath = path.join(process.cwd(), configFileName);

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
  };

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
  await addCucumberPreprocessorPlugin(on, config);

  on(
    "file:preprocessor",
    browserify(config, {
      typescript: require.resolve("typescript"),
    })
  );

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
  await addCucumberPreprocessorPlugin(on, config);

  on(
    "file:preprocessor",
    createBundler({
      plugins: [createEsbuildPlugin(config)],
    })
  );

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
  await addCucumberPreprocessorPlugin(on, config);

  on(
    "file:preprocessor",
    createBundler({
      plugins: [createEsbuildPlugin(config)],
    })
  );

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
    configContent = reporterConfig[answers.reporter];
  } else {
    configContent = answers.configLanguage === 'JavaScript' ? `
const { defineConfig } = require('cypress');

module.exports = defineConfig({
    e2e: {
        baseUrl: '${answers.baseUrl}',
        setupNodeEvents(on, config) {
          // implement node event listeners here
        },
    },
});
    ` : `
import { defineConfig } from 'cypress';

export default defineConfig({
    e2e: {
        baseUrl: '${answers.baseUrl}',
        setupNodeEvents(on, config) {
          // implement node event listeners here
        },
    },
});
    `;
  }

  await fs.outputFile(configFilePath, configContent);
  console.log(`Created ${configFileName}`);
}
