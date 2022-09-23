/*
    Runs a post-installation script if the project was installed from source (ex: npm install a git branch).

    Checks if the project contains some directories that are absent from the registry to decide if the workflow is triggered
*/

import { existsSync } from "fs";
import { exec } from "child_process";
import { env } from "process";

if (existsSync("./src/index.ts") && !env.CI) {
    console.debug(`Installed from source, running tsc`);
    exec("yarn run build");
}
