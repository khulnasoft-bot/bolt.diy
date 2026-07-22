const { writeFileSync, existsSync } = require('fs');
const { join } = require('path');

const rootDir = process.cwd();
const targetDir = join(rootDir, 'node_modules/.pnpm/util@0.12.5/node_modules/util');
const typesPath = join(targetDir, 'types');

if (existsSync(targetDir) && !existsSync(typesPath)) {
  writeFileSync(
    typesPath,
    'module.exports = require("node:util/types");\nmodule.exports.default = require("node:util/types");\n',
  );
  console.log('Created util/types shim');
}
