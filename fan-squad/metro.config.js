// metro.config.js
// Force Metro to use the CommonJS build of fast-xml-parser.
//
// Root cause: Metro resolves the "import" condition in fast-xml-parser's
// package.json exports map first, landing on src/fxp.js (ESM). That file
// uses bare relative imports without extensions (e.g. "./node2json.js") that
// Metro cannot follow. The pre-built CJS file at lib/fxp.cjs has no such
// issues. We bypass the exports map entirely by pointing Metro at the
// absolute filesystem path.

const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Absolute path to the CJS build — avoids Node 22's strict exports-map check
const FXP_CJS = path.join(
  __dirname,
  'node_modules',
  'fast-xml-parser',
  'lib',
  'fxp.cjs',
);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'fast-xml-parser') {
    return { filePath: FXP_CJS, type: 'sourceFile' };
  }
  // Delegate everything else to Metro's default resolver
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
