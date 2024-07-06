#!/usr/bin/env node

import fs from 'fs-extra';
import path from 'path';

export async function createPackageJsonFile(answers) {
  const packageJsonPath = path.join(process.cwd(), 'package.json');

  const packageJsonContent = {
    "name": "cypress-project",
    "version": "1.0.0",
    "description": "A Cypress project configured automatically",
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

  console.log('Created package.json');
}
