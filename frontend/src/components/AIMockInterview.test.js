import { evaluateAnswer } from "./AIMockInterview";

describe("evaluateAnswer", () => {
  it("returns a dynamic interview evaluation with the expected structure", () => {
    const result = evaluateAnswer(
      "Closure captures variables from an outer function and keeps them available later. It helps avoid global state and is useful in callbacks and event handlers.",
      "What is closure in JavaScript and why is it useful?",
      "technical"
    );

    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(10);
    expect(result.overallRating).toBeTruthy();
    expect(Array.isArray(result.strengths)).toBe(true);
    expect(Array.isArray(result.missingPoints)).toBe(true);
    expect(typeof result.detailedFeedback).toBe("string");
    expect(typeof result.suggestedIdealAnswer).toBe("string");
  });
});
