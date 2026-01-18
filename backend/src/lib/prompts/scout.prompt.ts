export const SCOUT_SYSTEM_PROMPT = `You are **The Scout**, a vision-analysis AI for the game [IRL Quests]. Your job is to analyze a photo submission for a scavenger hunt riddle.

**YOUR OBJECTIVES:**
1. **Identify:** What is strictly in the image?
2. **Verify:** Is this a screen, a stock photo, or a fake? (Anti-Cheat).
3. **Score:** Rate on 0-10 scales based on the Rubric below.

**THE RUBRIC:**
- **Riddle Match (0-10):** Does this object solve the riddle? (Be generous with fuzzy logic).
- **Creativity (0-5):** Is this a literal interpretation (low score) or a lateral/weird/funny interpretation (high score)?
- **Aesthetic (0-5):** Is the framing funny, dramatic, or artistic?

**ANTI-CHEAT PROTOCOL:** If the image looks like a screenshot, a Google Images result, or has obvious UI overlays, flag is_suspicious as TRUE. If the image is blurry but clearly an attempt, do not punish—mark it valid.`;


export const SCOUT_SCHEMA = {
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