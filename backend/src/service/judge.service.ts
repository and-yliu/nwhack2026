/**
 * Multi-Agent LLM Judge Service for IRL Quests
 *
 * Three specialized agents:
 * - Scout (Vision): Analyzes images against riddles
 * - High Council (Judge): Picks winners from all submissions
 * - Bard (Announcer): Generates one-liner announcements
 */

import { OpenRouter } from "@openrouter/sdk";

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
// JSON Schemas for Structured Output
// ============================================================================

const SCOUT_SCHEMA = {
    type: "object",
    properties: {
        description: {
            type: "string",
            description: "A literal description of visual elements in the image",
        },
        reasoning: {
            type: "string",
            description: "Why this image fits or doesn't fit the riddle",
        },
        scores: {
            type: "object",
            properties: {
                match: {
                    type: "integer",
                    description: "Riddle match score 0-10",
                    minimum: 0,
                    maximum: 10,
                },
                creativity: {
                    type: "integer",
                    description: "Creativity score 0-10 (literal=low, lateral/weird=high)",
                    minimum: 0,
                    maximum: 10,
                },
                aesthetic: {
                    type: "integer",
                    description: "Aesthetic score 0-10 (framing, composition, drama)",
                    minimum: 0,
                    maximum: 10,
                },
            },
            required: ["match", "creativity", "aesthetic"],
            additionalProperties: false,
        },
        flags: {
            type: "object",
            properties: {
                is_suspicious: {
                    type: "boolean",
                    description: "True if image appears to be a screenshot, stock photo, or fake",
                },
                is_uncertain: {
                    type: "boolean",
                    description: "True if analysis confidence is low",
                },
            },
            required: ["is_suspicious", "is_uncertain"],
            additionalProperties: false,
        },
        vibe_tag: {
            type: "string",
            description: "A short 2-word tag describing the photo vibe",
        },
    },
    required: ["description", "reasoning", "scores", "flags", "vibe_tag"],
    additionalProperties: false,
};

const COUNCIL_SCHEMA = {
    type: "object",
    properties: {
        grand_winner_id: {
            type: "string",
            description: "Player ID of the grand winner",
        },
        grand_winner_rationale: {
            type: "string",
            description: "Why they won (internal logic)",
        },
        troll_winner_id: {
            type: "string",
            description: "Player ID of the chaos/troll winner",
        },
        troll_winner_rationale: {
            type: "string",
            description: "Why they are the chaos lord",
        },
        scoreboard: {
            type: "array",
            items: {
                type: "object",
                properties: {
                    rank: { type: "integer" },
                    player_id: { type: "string" },
                    score: { type: "integer" },
                },
                required: ["rank", "player_id", "score"],
                additionalProperties: false,
            },
        },
    },
    required: [
        "grand_winner_id",
        "grand_winner_rationale",
        "troll_winner_id",
        "troll_winner_rationale",
        "scoreboard",
    ],
    additionalProperties: false,
};

const BARD_SCHEMA = {
    type: "object",
    properties: {
        one_liner: {
            type: "string",
            description: "A punchy one-liner announcement, max 15 words",
        },
    },
    required: ["one_liner"],
    additionalProperties: false,
};

// ============================================================================
// Agent System Prompts
// ============================================================================

const SCOUT_SYSTEM_PROMPT = `You are **The Scout**, a vision-analysis AI for the game [IRL Quests]. Your job is to analyze a photo submission for a scavenger hunt riddle.

**YOUR OBJECTIVES:**
1. **Identify:** What is strictly in the image?
2. **Verify:** Is this a screen, a stock photo, or a fake? (Anti-Cheat).
3. **Score:** Rate on 0-10 scales based on the Rubric below.

**THE RUBRIC:**
- **Riddle Match (0-10):** Does this object solve the riddle? (Be generous with fuzzy logic).
- **Creativity (0-10):** Is this a literal interpretation (low score) or a lateral/weird/funny interpretation (high score)?
- **Aesthetic (0-10):** Is the framing funny, dramatic, or artistic?

**ANTI-CHEAT PROTOCOL:** If the image looks like a screenshot, a Google Images result, or has obvious UI overlays, flag is_suspicious as TRUE. If the image is blurry but clearly an attempt, do not punish—mark it valid.`;

const COUNCIL_SYSTEM_PROMPT = `You are the **High Council Judge** of [IRL Quests]. You decide the fate of the players.

**YOUR TASK:** Analyze the entries and select winners. You value cleverness and humor just as much as correctness.

**SELECTION CRITERIA:**
1. **The Grand Winner:** The highest total score (Match + Creativity + Aesthetic). However, if a submission is "Suspicious," they are disqualified immediately.
2. **The Troll/Creative Winner:** The entry with the highest "Creativity" score that *technically* fits the riddle but in a weird way. (If the Grand Winner is also the most creative, pick the runner-up for this category).

**TIE-BREAKER LOGIC:**
1. Highest Creativity.
2. Funniest Vibe Tag.
3. Coin flip.`;

const BARD_SYSTEM_PROMPT = `You are the **Voice of the Game** for [IRL Quests]. Your job is to announce the winner with a "One-Liner" that appears on the scoreboard.

**STYLE GUIDE:**
- **Brevity:** Maximum 15 words.
- **Tone:** Punchy, celebratory, slightly sarcastic, or genuinely impressed.
- **Format:** Do not use hashtags.

**EXAMPLES:**
- *Context: Player took a photo of a cloud for a 'cotton candy' riddle.*
  Output: "Forbidden cotton candy tastes the best. +50 points."
- *Context: Player found the exact obscure object requested.*
  Output: "Did you have this in your pocket? Suspiciously perfect."
- *Context: Player took a photo of their cat for a 'monster' riddle.*
  Output: "The cutest apex predator we've ever seen."`;

// ============================================================================
// Judge Service Class
// ============================================================================

export class JudgeService {
    private client: OpenRouter;

    // Model assignments per agent
    private readonly SCOUT_MODEL = "google/gemini-3-flash-preview";
    private readonly COUNCIL_MODEL = "anthropic/claude-sonnet-4.5";
    private readonly BARD_MODEL = "google/gemini-3-pro-preview";

    constructor(apiKey?: string) {
        this.client = new OpenRouter({
            apiKey: apiKey || process.env.OPENROUTER_API_KEY,
        });
    }

    /**
     * Scout Agent: Analyze a single image submission
     */
    async scoutAnalyze(riddle: string, imageBase64: string): Promise<ScoutAnalysis> {
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
                            imageUrl: { url: `data:image/jpeg;base64,${imageBase64}` },
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

        const content = response.choices?.[0]?.message?.content;
        if (!content) {
            throw new Error("Scout agent returned empty response");
        }

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

        const content = response.choices?.[0]?.message?.content;
        if (!content) {
            throw new Error("Council agent returned empty response");
        }

        return JSON.parse(content) as CouncilJudgment;
    }

    /**
     * Bard Agent: Generate a one-liner announcement
     */
    async bardAnnounce(
        riddle: string,
        winnerId: string,
        winnerContext: string
    ): Promise<string> {
        const response = await this.client.chat.send({
            model: this.BARD_MODEL,
            messages: [
                { role: "system", content: BARD_SYSTEM_PROMPT },
                {
                    role: "user",
                    content: `**RIDDLE:** "${riddle}"\n**WINNER:** Player ${winnerId}\n**CONTEXT:** ${winnerContext}\n\nGenerate the one-liner for this winner.`,
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

        const content = response.choices?.[0]?.message?.content;
        if (!content) {
            throw new Error("Bard agent returned empty response");
        }

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
        const [grandAnnouncement, trollAnnouncement] = await Promise.all([
            this.bardAnnounce(riddle, judgment.grand_winner_id, judgment.grand_winner_rationale),
            this.bardAnnounce(riddle, judgment.troll_winner_id, judgment.troll_winner_rationale),
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
