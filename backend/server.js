import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file from backend directory - MUST be done before any other imports
const envResult = dotenv.config({ path: join(__dirname, ".env") });

if (envResult.error) {
  console.warn("⚠️  Warning: .env file not found or couldn't be loaded");
  console.warn("   Make sure .env file exists in the backend directory");
  console.warn(`   Error: ${envResult.error.message}`);
} else {
  console.log("✅ Environment variables loaded");
  if (envResult.parsed) {
    console.log(`   Loaded ${Object.keys(envResult.parsed).length} variables`);
  }
}

// Now import app and connectDB after env is loaded
import app from "./src/app.js";
import connectDB from "./src/config/db.js";

// Connect to database and start server
const startServer = async () => {
  try {
    await connectDB();
    
    const PORT = process.env.PORT || 5000;
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
