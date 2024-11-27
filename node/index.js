const NODE_CONNECTOR_ID = "ext_main_shell";
const extnNodeConnector = global.createNodeConnector(NODE_CONNECTOR_ID, exports);

const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

let currentDirectory = process.cwd();

function execute(command) {
  return new Promise((resolve, reject) => {
    if (command.input.startsWith("cd")) {
      const targetDir = command.input.slice(3).trim();
      if (targetDir) {
        const newDir = path.resolve(currentDirectory, targetDir);
        fs.access(newDir, fs.constants.F_OK, (err) => {
          if (err) {
            reject(new Error(`Invalid directory: ${targetDir}`));
          } else {
            currentDirectory = newDir;
            resolve(
              JSON.stringify({
                msg: `Changed directory to: ${currentDirectory}`,
                dir: currentDirectory
              })
            );
          }
        });
      } else {
        currentDirectory = process.cwd();
        resolve(
          JSON.stringify({
            msg: `Changed directory to root: ${currentDirectory}`,
            dir: currentDirectory
          })
        );
      }
      return;
    }

    const shellCommand = process.platform === "win32" ? "powershell.exe" : "bash";
    const args = process.platform === "win32" ? ["-NoProfile", "-Command", command.input] : ["-c", command.input];

    const child = spawn(shellCommand, args, { cwd: currentDirectory, shell: true });

    let output = "";
    let error = "";

    child.stdout.on("data", (data) => {
      output += data.toString();
    });

    child.stderr.on("data", (data) => {
      error += data.toString();
    });

    child.on("close", (code) => {
      if (code !== 0 || error) {
        reject(error.trim());
      } else {
        resolve(
          JSON.stringify({
            msg: output.trim(),
            dir: currentDirectory
          })
        );
      }
    });
  });
}

exports.execute = execute;
