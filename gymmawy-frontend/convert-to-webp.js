import fs from "fs";
import path from "path";
import sharp from "sharp";

const inputDir = "./src/assets";
const outputDir = "./src/assets-webp"; // keep a safe copy

function convertPngToWebp(dir) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      convertPngToWebp(fullPath);
    } else if (path.extname(file).toLowerCase() === ".png") {
      const outPath = path
        .join(outputDir, path.relative(inputDir, dir), path.basename(file, ".png") + ".webp");

      fs.mkdirSync(path.dirname(outPath), { recursive: true });

      sharp(fullPath)
        .webp({ quality: 90 })
        .toFile(outPath)
        .then(() => console.log(`✅ Converted: ${file} → ${outPath}`))
        .catch(err => console.error(`❌ Error converting ${file}:`, err));
    }
  });
}

convertPngToWebp(inputDir);
