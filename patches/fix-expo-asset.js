/**
 * Postinstall patch for expo-asset resolveAssetSource.native.js
 *
 * Problem: expo-asset uses `export * from 'react-native/.../resolveAssetSource'`
 * to re-export setCustomSourceTransformer. But RN 0.81 only has `export default`
 * and assigns setCustomSourceTransformer as a property on the default export.
 * So `export *` re-exports nothing, and the import gets `undefined`.
 *
 * Fix: explicitly re-export setCustomSourceTransformer from the default export.
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(
  __dirname, '..', 'node_modules', 'expo-asset', 'build', 'resolveAssetSource.native.js'
);

const fixed = `import resolveAssetSource from 'react-native/Libraries/Image/resolveAssetSource';
export default resolveAssetSource;
export const setCustomSourceTransformer = resolveAssetSource.setCustomSourceTransformer;
export const addCustomSourceTransformer = resolveAssetSource.addCustomSourceTransformer;
`;

try {
  fs.writeFileSync(filePath, fixed, 'utf8');
  console.log('✓ Patched expo-asset resolveAssetSource.native.js');
} catch (e) {
  console.warn('⚠ Could not patch expo-asset:', e.message);
}
