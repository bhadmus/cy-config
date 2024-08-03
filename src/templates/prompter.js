#!/usr/bin/env node

import inquirer from "inquirer";

export async function collectInfo() {

  const version = "1.0.8"; 

  // Check command-line arguments for --version or --help
  const args = process.argv.slice(2);

  if (args.includes("--version") || args.includes("-V")) {
    console.log(version);
    process.exit(0);
  }

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Usage: cye2e-cli 

Options:
  -V, --version          output the current version
  -h, --help             display help for command
  `);
    process.exit(0);
  }

  console.log(
    "\u{1F31F} \u{1F31F} \u{1F31F} \u{1F31F} \u{1F31F} \u{1F31F} \u{1F31F} \u{1F31F} \u{1F31F} \u{1F31F}"
  );
  console.log("\n");
  console.log("\u{1F31F} Cypress E2E Helper Bot  \u{1F31F}");
  console.log("\n");
  console.log(
    "\u{1F31F} \u{1F31F} \u{1F31F} \u{1F31F} \u{1F31F} \u{1F31F} \u{1F31F} \u{1F31F} \u{1F31F} \u{1F31F}"
  );

  const answers = await inquirer.prompt([
    {
      type: "list",
      name: "configLanguage",
      message: "Which configuration language do you want to use?",
      choices: ["JavaScript", "TypeScript"],
      default: "JavaScript",
    },
    {
      type: "input",
      name: "baseUrl",
      message: "What is the base URL for your tests?",
      default: "https://example.cypress.io",
    },
    {
      type: "confirm",
      name: "testDesign",
      message: "Do you want to setup BDD?",
      default: false,
    },
    {
      type: "confirm",
      name: "reportChoice",
      message: "Do you want to setup a reporter?",
      default: false,
    },
    {
      type: "confirm",
      name: "pipelineConfig",
      message: "Do you want to setup a pipeline?",
      default: false,
    },
    {
      type: "confirm",
      name: "ignoreFile",
      message: "Do you want to a .gitignore file?",
      default: false,
    },
    {
      type: "confirm",
      name: "installDependencies",
      message: "Do you want to run npm install after creating the files?",
      default: false,
    },
  ]);

  if (answers.testDesign) {
    const bundlerAnswer = await inquirer.prompt([
      {
        type: "list",
        name: "bundler",
        message: "Which bundler do you prefer?",
        choices: ["browserify", "esbuild", "webpack"],
        default: "browserify",
      },
    ]);
    answers.bundler = bundlerAnswer.bundler;
  }

  if (answers.reportChoice) {
    const reporterAnswer = await inquirer.prompt([
      {
        type: "list",
        name: "reporter",
        message: "Which reporter do you prefer?",
        choices: answers.testDesign
          ? ["badeball", "multipleCucumber"]
          : ["mochawesome", "allure"],
        default: answers.testDesign ? "badeball" : "mochawesome",
      },
    ]);
    answers.reporter = reporterAnswer.reporter;
  }

  if (answers.pipelineConfig) {
    const pipelineAnswer = await inquirer.prompt([
      {
        type: "list",
        name: "versionControl",
        message: "Which version control tool do you prefer?",
        choices: ["gitlab", "github", "bitbucket"],
        default: "gitlab",
      },
    ]);
    answers.versionControl = pipelineAnswer.versionControl;
  }
  return answers;
}
