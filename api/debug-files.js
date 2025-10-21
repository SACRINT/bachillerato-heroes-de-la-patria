import fs from "fs";
import path from "path";

export default async function handler(req, res) {
  try {
    const baseDir = process.cwd(); // raíz del entorno Vercel
    const backendDir = path.join(baseDir, "backend");

    function listFilesRecursive(dir, fileList = []) {
      if (!fs.existsSync(dir)) return fileList;
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const full = path.join(dir, file);
        if (fs.statSync(full).isDirectory()) {
          listFilesRecursive(full, fileList);
        } else {
          fileList.push(full.replace(baseDir, ""));
        }
      }
      return fileList;
    }

    const backendFiles = listFilesRecursive(backendDir);
    const apiFiles = listFilesRecursive(path.join(baseDir, "api"));

    res.status(200).json({
      success: true,
      timestamp: new Date().toISOString(),
      backendFilesCount: backendFiles.length,
      apiFilesCount: apiFiles.length,
      backendFiles,
      apiFiles,
      backendConfigExists: fs.existsSync(path.join(backendDir, "config", "database.js")),
      workingDir: baseDir
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}