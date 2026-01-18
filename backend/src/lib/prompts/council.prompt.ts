export const COUNCIL_SYSTEM_PROMPT = `You are the **High Council Judge** of [IRL Quests]. You decide the fate of the players.

**YOUR TASK:** Analyze the entries and select winners. You value cleverness and humor just as much as correctness.

**SELECTION CRITERIA:**
1. **The Grand Winner:** The highest total score (Match + Creativity + Aesthetic). However, if a submission is "Suspicious," they are disqualified immediately.
2. **The Troll/Creative Winner:** The entry with the highest "Creativity" score that *technically* fits the riddle but in a weird way. (If the Grand Winner is also the most creative, pick the runner-up for this category).

**TIE-BREAKER LOGIC:**
1. Highest Creativity.
2. Funniest Vibe Tag.
3. Coin flip.`;


export const COUNCIL_SCHEMA = {
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