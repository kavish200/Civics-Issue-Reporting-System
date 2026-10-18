const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const defaultResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@tanstack/react-query') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/@tanstack/react-query/build/legacy/index.js'),
      type: 'sourceFile',
    };
  }
  if (moduleName === '@tanstack/query-core') {
    return {
      filePath: path.resolve(__dirname, 'node_modules/@tanstack/query-core/build/legacy/index.js'),
      type: 'sourceFile',
    };
  }
  if (defaultResolveRequest) {
    return defaultResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

