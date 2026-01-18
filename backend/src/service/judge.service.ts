/**
 * Multi-Agent LLM Judge Service for IRL Quests
 *
 * Three specialized agents:
 * - Scout (Vision): Analyzes images against riddles
 * - High Council (Judge): Picks winners from all submissions
 * - Bard (Announcer): Generates one-liner announcements
 */

import { OpenRouter } from "@openrouter/sdk";
import * as fs from "fs";
import { SCOUT_SYSTEM_PROMPT, SCOUT_SCHEMA } from "../lib/prompts/scout.prompt";
import { COUNCIL_SYSTEM_PROMPT, COUNCIL_SCHEMA } from "../lib/prompts/council.prompt";
import { BARD_SYSTEM_PROMPT, BARD_SCHEMA } from "../lib/prompts/bard.prompt";

// ============================================================================
// Types & Interfaces
// ============================================================================

/** Scout Agent output: vision analysis of a single submission */
export interface ScoutAnalysis {
    description: string;
    reasoning: string;
    scores: {
        match: number;
        creativity: number;
        aesthetic: number;
    };
    flags: {
        is_suspicious: boolean;
        is_uncertain: boolean;
    };
    vibe_tag: string;
}

/** Player submission with Scout analysis */
export interface PlayerSubmission {
    player_id: string;
    image_base64: string;
    scout_analysis?: ScoutAnalysis;
}

/** High Council Agent output: winner selection */
export interface CouncilJudgment {
    grand_winner_id: string;
    grand_winner_rationale: string;
    troll_winner_id: string;
    troll_winner_rationale: string;
    scoreboard: Array<{
        rank: number;
        player_id: string;
        score: number;
    }>;
}

/** Bard Agent output: one-liner announcement */
export interface BardAnnouncement {
    one_liner: string;
}

/** Final round result combining all agent outputs */
export interface RoundResult {
    riddle: string;
    submissions: Array<PlayerSubmission & { scout_analysis: ScoutAnalysis }>;
    judgment: CouncilJudgment;
    grand_winner_announcement: string;
    troll_winner_announcement: string;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Encode an image file to base64 data URI
 */
async function encodeImageToBase64(imagePath: string): Promise<string> {
    const imageBuffer = await fs.promises.readFile(imagePath);
    const base64Image = imageBuffer.toString("base64");
    return `data:image/jpeg;base64,${base64Image}`;
}

/**
 * Extract string content from OpenRouter response
 * Handles both string and array content types
 */
function extractContentString(
    content: string | Array<any> | null | undefined
): string {
    if (!content) {
        throw new Error("Response content is empty");
    }
    if (typeof content === "string") {
        return content;
    }
    // If it's an array, find the first text item
    const textItem = content.find((item) => item.type === "text");
    if (textItem?.text) {
        return textItem.text;
    }
    throw new Error("Unable to extract text content from response");
}

// ============================================================================
// Judge Service Class
// ============================================================================

export class JudgeService {
    private client: OpenRouter;

    // Model assignments per agent
    private readonly SCOUT_MODEL = "google/gemini-3-flash-preview";
    private readonly COUNCIL_MODEL = "anthropic/claude-sonnet-4.5";
    private readonly BARD_MODEL = "google/gemini-3-flash-preview";

    constructor(apiKey?: string) {
        const key = apiKey || process.env.OPENROUTER_API_KEY;
        if (!key) {
            throw new Error("OpenRouter API key is required. Set OPENROUTER_API_KEY environment variable or pass apiKey to constructor.");
        }
        this.client = new OpenRouter({
            apiKey: key,
        });
    }

    /**
     * Scout Agent: Analyze a single image submission
     */
    async scoutAnalyze(riddle: string, imagePath: string): Promise<ScoutAnalysis> {
        // Read and encode the image
        const base64Image = await encodeImageToBase64(imagePath);

        const response = await this.client.chat.send({
            model: this.SCOUT_MODEL,
            messages: [
                { role: "system", content: SCOUT_SYSTEM_PROMPT },
                {
                    role: "user",
                    content: [
                        { type: "text", text: `**RIDDLE:** "${riddle}"\n\nAnalyze the following photo submission:` },
                        {
                            type: "image_url",
                            imageUrl: { url: base64Image },
                        },
                    ],
                },
            ],
            responseFormat: {
                type: "json_schema",
                jsonSchema: {
                    name: "scout_analysis",
                    strict: true,
                    schema: SCOUT_SCHEMA,
                },
            },
            stream: false,
        });

        const content = extractContentString(response.choices?.[0]?.message?.content);
        return JSON.parse(content) as ScoutAnalysis;
    }

    /**
     * High Council Agent: Judge all submissions and pick winners
     */
    async councilJudge(
        riddle: string,
        submissions: Array<{ player_id: string; scout_analysis: ScoutAnalysis }>
    ): Promise<CouncilJudgment> {
        const submissionsData = submissions.map((s) => ({
            player_id: s.player_id,
            description: s.scout_analysis.description,
            scores: s.scout_analysis.scores,
            flags: s.scout_analysis.flags,
            vibe_tag: s.scout_analysis.vibe_tag,
        }));

        const response = await this.client.chat.send({
            model: this.COUNCIL_MODEL,
            messages: [
                { role: "system", content: COUNCIL_SYSTEM_PROMPT },
                {
                    role: "user",
                    content: `**RIDDLE:** "${riddle}"\n\n**PLAYER SUBMISSIONS:**\n${JSON.stringify(submissionsData, null, 2)}`,
                },
            ],
            responseFormat: {
                type: "json_schema",
                jsonSchema: {
                    name: "council_judgment",
                    strict: true,
                    schema: COUNCIL_SCHEMA,
                },
            },
            stream: false,
        });

        const content = extractContentString(response.choices?.[0]?.message?.content);
        return JSON.parse(content) as CouncilJudgment;
    }

    /**
     * Bard Agent: Generate a one-liner announcement
     */
    async bardAnnounce(
        riddle: string,
        winnerId: string,
        winnerContext: string,
        imagePath: string
    ): Promise<string> {
        // Read and encode the image
        const base64Image = await encodeImageToBase64(imagePath);

        const response = await this.client.chat.send({
            model: this.BARD_MODEL,
            messages: [
                { role: "system", content: BARD_SYSTEM_PROMPT },
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `**RIDDLE:** "${riddle}"\n**WINNER:** Player ${winnerId}\n**CONTEXT:** ${winnerContext}\n\nGenerate the one-liner for this winner.`,
                        },
                        {
                            type: "image_url",
                            imageUrl: { url: base64Image },
                        },
                    ],
                },
            ],
            responseFormat: {
                type: "json_schema",
                jsonSchema: {
                    name: "bard_announcement",
                    strict: true,
                    schema: BARD_SCHEMA,
                },
            },
            stream: false,
        });

        const content = extractContentString(response.choices?.[0]?.message?.content);
        const result = JSON.parse(content) as BardAnnouncement;
        return result.one_liner;
    }

    /**
     * Main orchestrator: Run the full judging pipeline
     */
    async judgeRound(riddle: string, submissions: PlayerSubmission[]): Promise<RoundResult> {
        // Step 1: Scout analyzes all submissions in parallel
        const analyzedSubmissions = await Promise.all(
            submissions.map(async (sub) => {
                const analysis = await this.scoutAnalyze(riddle, sub.image_base64);
                return {
                    ...sub,
                    scout_analysis: analysis,
                };
            })
        );

        // Step 2: High Council judges all submissions
        const judgment = await this.councilJudge(riddle, analyzedSubmissions);

        // Step 3: Bard generates announcements for winners (in parallel)
        // Find the winner submissions to get their image paths
        const grandWinnerSubmission = analyzedSubmissions.find(
            (s) => s.player_id === judgment.grand_winner_id
        );
        const trollWinnerSubmission = analyzedSubmissions.find(
            (s) => s.player_id === judgment.troll_winner_id
        );

        if (!grandWinnerSubmission || !trollWinnerSubmission) {
            throw new Error("Winner submission not found");
        }

        const [grandAnnouncement, trollAnnouncement] = await Promise.all([
            this.bardAnnounce(
                riddle,
                judgment.grand_winner_id,
                judgment.grand_winner_rationale,
                grandWinnerSubmission.image_base64 // This will need to be changed to image_path when you update PlayerSubmission interface
            ),
            this.bardAnnounce(
                riddle,
                judgment.troll_winner_id,
                judgment.troll_winner_rationale,
                trollWinnerSubmission.image_base64 // This will need to be changed to image_path when you update PlayerSubmission interface
            ),
        ]);

        return {
            riddle,
            submissions: analyzedSubmissions,
            judgment,
            grand_winner_announcement: grandAnnouncement,
            troll_winner_announcement: trollAnnouncement,
        };
    }
}

// Export singleton instance
export const judgeService = new JudgeService();
