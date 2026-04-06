import { execSync } from 'child_process';
import { readdirSync, existsSync, mkdirSync, copyFileSync, rmSync } from 'fs';
import { join, extname } from 'path';

// Usage: node scripts/optimize-glb.js <directory>
// Example: node scripts/optimize-glb.js public/tiles
//
// Strategy:
// - Texture: JPEG compression (universal support: Windows, ThreeJS, all loaders)
// - Geometry: NO decimation/weld (preserve 100% mesh topology)
// - Compression: NO Draco/Meshopt (those break Windows 3D Viewer)
// - Result: ~50-80% smaller, opens everywhere

const targetDir = process.argv[2];

if (!targetDir || !existsSync(targetDir)) {
  console.error("❌ Please provide a valid directory.");
  console.error("   Usage: node scripts/optimize-glb.js public/tiles");
  process.exit(1);
}

const files = readdirSync(targetDir).filter(f => extname(f).toLowerCase() === '.glb');

if (files.length === 0) {
  console.log("No .glb files found in", targetDir);
  process.exit(0);
}

const optimizedDir = join(targetDir, '_optimized_temp');
if (!existsSync(optimizedDir)) {
  mkdirSync(optimizedDir);
}

console.log(`\n🔧 Found ${files.length} .glb files in "${targetDir}". Starting safe optimization...`);

for (const file of files) {
  const inputPath = join(targetDir, file);
  const outputPath = join(optimizedDir, file);

  console.log(`\n[${files.indexOf(file) + 1}/${files.length}] ${file}`);
  try {
    // Step 1: Resize textures to 1024px
    const resizeCmd = `npx -y @gltf-transform/cli@latest resize "${inputPath}" "${outputPath}" --width 1024 --height 1024`;
    execSync(resizeCmd, { stdio: 'inherit' });

    // Step 2: Apply JPEG compression on resized output (in-place on temp file)
    const jpegCmd = `npx -y @gltf-transform/cli@latest jpeg "${outputPath}" "${outputPath}" --quality 80`;
    execSync(jpegCmd, { stdio: 'inherit' });

    // Step 3: Final cleanup pass (dedup, prune - NO geometry changes)
    const pruneCmd = `npx -y @gltf-transform/cli@latest dedup "${outputPath}" "${outputPath}"`;
    execSync(pruneCmd, { stdio: 'inherit' });

    // Copy back to overwrite original
    copyFileSync(outputPath, inputPath);
    console.log(`✅ Done: ${file}`);
  } catch (err) {
    console.error(`❌ Failed: ${file} - ${err.message}`);
  }
}

// Cleanup temp dir
rmSync(optimizedDir, { recursive: true, force: true });
console.log("\n🎉 All files optimized in-place!");
