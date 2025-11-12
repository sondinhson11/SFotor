import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";

console.log("Deploying to GitHub Pages...\n");

// Check if dist folder exists
if (!existsSync("dist")) {
  console.error(
    'Error: dist folder not found. Please run "npm run build" first.'
  );
  process.exit(1);
}

try {
  // Change to dist directory
  process.chdir("dist");

  // Initialize git if not already
  try {
    execSync("git init", { stdio: "ignore" });
  } catch (e) {
    // Git already initialized, continue
  }

  // Add all files
  execSync("git add .", { stdio: "inherit" });

  // Commit
  execSync('git commit -m "Deploy to GitHub Pages"', { stdio: "inherit" });

  // Create/switch to gh-pages branch
  execSync("git branch -M gh-pages", { stdio: "ignore" });

  // Add remote (ignore error if already exists)
  try {
    execSync(
      "git remote add origin https://github.com/sondinhson11/SFotor.git",
      { stdio: "ignore" }
    );
  } catch (e) {
    // Remote already exists, update URL
    execSync(
      "git remote set-url origin https://github.com/sondinhson11/SFotor.git",
      { stdio: "ignore" }
    );
  }

  // Push to gh-pages branch
  console.log("\nPushing to gh-pages branch...");
  execSync("git push -f origin gh-pages", { stdio: "inherit" });

  console.log("\n✅ Deployment complete!");
  console.log(
    "🌐 Website will be available at: https://sondinhson11.github.io/SFotor/"
  );
} catch (error) {
  console.error("Error during deployment:", error.message);
  process.exit(1);
}
