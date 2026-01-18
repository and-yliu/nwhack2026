/**
 * Test Runner for Judge Service
 * 
 * This script reads all images from the uploads folder and runs
 * a complete judge round to test the multi-agent system.
 */

// IMPORTANT: Load environment variables FIRST before any other imports
// The OpenRouter SDK reads env vars when it's first imported
import dotenv from "dotenv";
dotenv.config();

import { judgeService, PlayerSubmission } from "../src/service/judge.service";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

// ============================================================================
// Configuration
// ============================================================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOADS_DIR = path.join(__dirname, "..", "uploads");
const TEST_RIDDLE = "Find something that can hold water but is not a cup";

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Read all image files from the uploads directory
 */
function getImageFiles(directory: string): string[] {
    const files = fs.readdirSync(directory);
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

    return files
        .filter((file) => {
            const ext = path.extname(file).toLowerCase();
            return imageExtensions.includes(ext);
        })
        .map((file) => path.join(directory, file));
}

/**
 * Create player submissions from image files
 */
function createSubmissions(imagePaths: string[]): PlayerSubmission[] {
    return imagePaths.map((imagePath, index) => ({
        player_id: `player_${index + 1}`,
        image_base64: imagePath, // Note: This will be treated as image_path by the service
    }));
}

/**
 * Pretty print the round results
 */
function printResults(result: any) {
    console.log("\n" + "=".repeat(80));
    console.log("🎮 JUDGE ROUND RESULTS");
    console.log("=".repeat(80) + "\n");

    console.log(`📜 Riddle: "${result.riddle}"\n`);

    console.log("─".repeat(80));
    console.log("🔍 SCOUT ANALYSES");
    console.log("─".repeat(80));
    result.submissions.forEach((sub: any, idx: number) => {
        console.log(`\n[${idx + 1}] Player: ${sub.player_id}`);
        console.log(`    Description: ${sub.scout_analysis.description}`);
        console.log(`    Scores: Match=${sub.scout_analysis.scores.match}/10, ` +
            `Creativity=${sub.scout_analysis.scores.creativity}/10, ` +
            `Aesthetic=${sub.scout_analysis.scores.aesthetic}/10`);
        console.log(`    Vibe: ${sub.scout_analysis.vibe_tag}`);
        console.log(`    Flags: ${sub.scout_analysis.flags.is_suspicious ? "⚠️ Suspicious" : "✅"} ` +
            `${sub.scout_analysis.flags.is_uncertain ? "❓ Uncertain" : ""}`);
    });

    console.log("\n" + "─".repeat(80));
    console.log("⚖️  HIGH COUNCIL JUDGMENT");
    console.log("─".repeat(80));
    console.log(`\n🏆 Grand Winner: ${result.judgment.grand_winner_id}`);
    console.log(`   Rationale: ${result.judgment.grand_winner_rationale}`);
    console.log(`\n🎭 Troll Winner: ${result.judgment.troll_winner_id}`);
    console.log(`   Rationale: ${result.judgment.troll_winner_rationale}`);

    console.log("\n📊 Scoreboard:");
    result.judgment.scoreboard.forEach((entry: any) => {
        const medal = entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : "  ";
        console.log(`   ${medal} #${entry.rank} - ${entry.player_id}: ${entry.score} points`);
    });

    console.log("\n" + "─".repeat(80));
    console.log("📢 BARD ANNOUNCEMENTS");
    console.log("─".repeat(80));
    console.log(`\n🏆 Grand Winner: "${result.grand_winner_announcement}"`);
    console.log(`🎭 Troll Winner: "${result.troll_winner_announcement}"`);

    console.log("\n" + "=".repeat(80) + "\n");
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function runTest() {
    console.log("🚀 Starting Judge Round Test...\n");

    try {
        // Step 1: Get all image files
        console.log(`📁 Reading images from: ${UPLOADS_DIR}`);
        const imagePaths = getImageFiles(UPLOADS_DIR);

        if (imagePaths.length === 0) {
            console.error("❌ No images found in uploads directory!");
            process.exit(1);
        }

        console.log(`✅ Found ${imagePaths.length} image(s):`);
        imagePaths.forEach((path, idx) => {
            console.log(`   ${idx + 1}. ${path.split("/").pop()}`);
        });

        // Step 2: Create player submissions...
        console.log("\n📝 Creating player submissions...");
        const submissions = createSubmissions(imagePaths);

        // Step 3: Run the judge round
        console.log(`\n⚡ Running judge round with riddle: "${TEST_RIDDLE}"`);

        // Debug: Check API key
        if (!process.env.OPENROUTER_API_KEY) {
            console.error("❌ OPENROUTER_API_KEY is not set in environment variables!");
            process.exit(1);
        }
        console.log(`✅ API Key loaded: ${process.env.OPENROUTER_API_KEY.substring(0, 20)}...`);

        // Create a new JudgeService instance with explicit API key
        const { JudgeService } = await import("../src/service/judge.service");
        const judgeServiceInstance = new JudgeService(process.env.OPENROUTER_API_KEY);

        console.log("⏳ This may take a minute...\n");

        const startTime = Date.now();
        const result = await judgeServiceInstance.judgeRound(TEST_RIDDLE, submissions);
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        console.log(`✅ Judge round completed in ${duration}s`);

        // Step 4: Print results
        printResults(result);

        // Step 5: Save results to file
        const outputPath = path.join(__dirname, "judge-results.json");
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
        console.log(`💾 Results saved to: ${outputPath}\n`);

    } catch (error) {
        console.error("\n❌ Error running judge round:");
        console.error(error);
        process.exit(1);
    }
}

// Run the test
runTest();
