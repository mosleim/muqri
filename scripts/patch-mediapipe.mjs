/**
 * Post-install script for @mediapipe/face_mesh compatibility.
 *
 * The package has issues with Vite/Rollup production builds:
 * 1. "sideEffects": [] causes tree-shaking of globals set by Google Closure Compiler
 * 2. "module" field causes ESM resolution where `this` is undefined
 * 3. face_mesh.js uses `var wa = this || self` (Closure Compiler) to set exports
 *    as globals. In ESM strict mode, `this` is undefined so FaceMesh lands on
 *    `window` instead of module.exports, making the import empty.
 *
 * This script patches both package.json and face_mesh.js to ensure
 * proper CommonJS module exports.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const base = 'node_modules/@mediapipe/face_mesh';

try {
  // 1. Patch package.json
  const pkgPath = `${base}/package.json`;
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
  let patched = false;

  if ('module' in pkg) {
    delete pkg.module;
    patched = true;
  }
  if ('sideEffects' in pkg) {
    delete pkg.sideEffects;
    patched = true;
  }

  if (patched) {
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log('[postinstall] Patched @mediapipe/face_mesh package.json');
  }

  // 2. Patch face_mesh.js: add explicit CJS module.exports
  // The original uses Google Closure Compiler's P() to set globals.
  // In ESM bundles, these end up on `window` not module exports.
  // Adding explicit module.exports makes Rollup CJS plugin wrap it properly.
  const jsPath = `${base}/face_mesh.js`;
  let js = readFileSync(jsPath, 'utf-8');

  if (!js.includes('__patched_cjs__')) {
    // Restore original `this||self` if previously patched
    js = js.replace(
      /var\s+wa\s*=\s*typeof exports\s*!==\s*"undefined"\s*\?\s*exports\s*:\s*self/,
      'var wa=this||self'
    );

    // Add explicit CJS export at end of file
    js += `
// __patched_cjs__
if (typeof module !== "undefined" && module.exports) {
  var _g = typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : {};
  module.exports = {
    FaceMesh: _g.FaceMesh,
    FACEMESH_LIPS: _g.FACEMESH_LIPS,
    FACEMESH_LEFT_EYE: _g.FACEMESH_LEFT_EYE,
    FACEMESH_LEFT_EYEBROW: _g.FACEMESH_LEFT_EYEBROW,
    FACEMESH_LEFT_IRIS: _g.FACEMESH_LEFT_IRIS,
    FACEMESH_RIGHT_EYE: _g.FACEMESH_RIGHT_EYE,
    FACEMESH_RIGHT_EYEBROW: _g.FACEMESH_RIGHT_EYEBROW,
    FACEMESH_RIGHT_IRIS: _g.FACEMESH_RIGHT_IRIS,
    FACEMESH_FACE_OVAL: _g.FACEMESH_FACE_OVAL,
    FACEMESH_CONTOURS: _g.FACEMESH_CONTOURS,
    FACEMESH_TESSELATION: _g.FACEMESH_TESSELATION,
    FACE_GEOMETRY: _g.FACE_GEOMETRY
  };
}
`;
    writeFileSync(jsPath, js);
    console.log('[postinstall] Patched @mediapipe/face_mesh/face_mesh.js');
  }
} catch (e) {
  console.warn('[postinstall] Could not patch @mediapipe/face_mesh:', e.message);
}
