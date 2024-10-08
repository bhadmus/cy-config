#!/usr/bin/env node

import { collectInfo } from "./src/templates/prompter.js";
import { createConfigFile } from "./src/utils/config.js";
import { createPackageJsonFile } from "./src/utils/npmDependencies.js";
import { createConfigurationFile } from "./src/utils/cypressSetup.js";
import { createGitIgnoreFile } from "./src/utils/ignore.js";
import { createPipelineFile } from "./src/utils/pipeline.js";
import { exec } from "child_process";

async function main() {
  const answers = await collectInfo();
  await createConfigFile(answers);
  await createGitIgnoreFile(answers);
  await createPackageJsonFile(answers);
  await createConfigurationFile(answers);
  await createPipelineFile(answers);

  if (answers.installDependencies) {
    console.log("Running npm install...");
    exec("npm install", (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
      console.error(`stderr: ${stderr}`);
    });
  }
}

main();
