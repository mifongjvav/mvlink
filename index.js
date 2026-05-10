#!/usr/bin/env node

import fs from "fs-extra";
const args = process.argv.slice(2);
let useMode;
let link;
let target;

function showHelp() {
  console.log(`
Usage: mvlink [-d] <source> <target>

Options:
  -d          Directory symlink (default for directories is junction)
  -h, --help  Show this help
  -?, /?      Also show this help

Examples:
  mvlink file.txt link.txt
  mvlink -d "C:\\Folder" "D:\\Link"
`);
}

function argsInit() {
  if (args.length === 0 || args.length === 1) {
    showHelp();
    process.exit(0);
  }
  if (
    args[0] == "-h" ||
    args[0] == "--help" ||
    args[0] == "/?" ||
    args[0] == "-?"
  ) {
    showHelp();
    process.exit(0);
  }
  if (args[0] == "-d") {
    useMode = "dir";
    link = args[1];
    target = args[2];
  } else {
    link = args[0];
    target = args[1];
  }
}

function isSymbolicLink(path) {
  try {
    const stats = fs.lstatSync(path);
    return stats.isSymbolicLink();
  } catch {
    return false;
  }
}

function isFile(path) {
  try {
    const stats = fs.lstatSync(path);
    if (stats.isSymbolicLink()) {
      const targetStats = fs.statSync(path);
      return targetStats.isFile();
    }
    return stats.isFile();
  } catch {
    return false;
  }
}

function pathExists(path) {
  try {
    fs.accessSync(path, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function mklink(link, target, mode) {
  try {
    await fs.promises.symlink(target, link, mode);
    console.log("Link created successfully");
  } catch (err) {
    console.error("Failed to create link:", err);
  }
}

async function main() {
  argsInit();
  if (pathExists(link)) {
    if (isSymbolicLink(link)) {
      console.warn(`Warning: ${link} is a symbolic link, cannot move`);
      console.warn("Please delete it manually if you want to replace it");
      process.exit(1);
    } else {
      try {
        fs.moveSync(link, target, { overwrite: true });
      } catch (err) {
        console.error(`❌ Move failed: ${err.message}`);
        process.exit(1);
      }
    }
  }
  if (isFile(target)) {
    if (useMode) {
      console.warn(
        "Warning: -d option is for directory symlinks, but target is a file",
      );
      console.warn("Ignoring -d, creating file symlink instead");
    }
    await mklink(link, target, "file");
  } else {
    if (useMode) {
      await mklink(link, target, useMode);
    } else {
      await mklink(link, target, "junction");
    }
  }
}

main();
