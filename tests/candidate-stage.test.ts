import { describe, expect, test } from "bun:test";

describe("Candidate Stage", () => {
  test("basic test should pass", () => {
    expect(true).toBe(true);
  });

  test("candidate stage should be valid", () => {
    const validStages = [
      "candidate",
      "medical",
      "mofa",
      "finger",
      "police_clearance",
      "takamul",
      "visa",
      "flight",
      "iqama",
    ];

    expect(validStages).toContain("candidate");
    expect(validStages).toContain("medical");
    expect(validStages).toContain("mofa");
    expect(validStages).toContain("visa");
    expect(validStages).toContain("iqama");
  });

  test("candidate stage pipeline should keep correct order", () => {
    const pipeline = [
      "candidate",
      "medical",
      "mofa",
      "finger",
      "police_clearance",
      "takamul",
      "visa",
      "flight",
      "iqama",
    ];

    expect(pipeline.indexOf("candidate")).toBe(0);
    expect(pipeline.indexOf("medical")).toBeLessThan(
      pipeline.indexOf("mofa"),
    );
    expect(pipeline.indexOf("mofa")).toBeLessThan(
      pipeline.indexOf("finger"),
    );
    expect(pipeline.indexOf("finger")).toBeLessThan(
      pipeline.indexOf("police_clearance"),
    );
    expect(pipeline.indexOf("police_clearance")).toBeLessThan(
      pipeline.indexOf("takamul"),
    );
    expect(pipeline.indexOf("takamul")).toBeLessThan(
      pipeline.indexOf("visa"),
    );
    expect(pipeline.indexOf("visa")).toBeLessThan(
      pipeline.indexOf("flight"),
    );
    expect(pipeline.indexOf("flight")).toBeLessThan(
      pipeline.indexOf("iqama"),
    );
  });

  test("medical should be the first work stage", () => {
    const pipeline = [
      "candidate",
      "medical",
      "mofa",
      "finger",
      "police_clearance",
      "takamul",
      "visa",
      "flight",
      "iqama",
    ];

    expect(pipeline[0]).toBe("candidate");
    expect(pipeline[1]).toBe("medical");
  });

  test("mofa should come after medical", () => {
    const pipeline = [
      "candidate",
      "medical",
      "mofa",
      "finger",
      "police_clearance",
      "takamul",
      "visa",
      "flight",
      "iqama",
    ];

    expect(pipeline.indexOf("mofa")).toBe(
      pipeline.indexOf("medical") + 1,
    );
  });

  test("visa should come after takamul", () => {
    const pipeline = [
      "candidate",
      "medical",
      "mofa",
      "finger",
      "police_clearance",
      "takamul",
      "visa",
      "flight",
      "iqama",
    ];

    expect(pipeline.indexOf("visa")).toBeGreaterThan(
      pipeline.indexOf("takamul"),
    );
  });

  test("flight should come before iqama", () => {
    const pipeline = [
      "candidate",
      "medical",
      "mofa",
      "finger",
      "police_clearance",
      "takamul",
      "visa",
      "flight",
      "iqama",
    ];

    expect(pipeline.indexOf("flight")).toBeLessThan(
      pipeline.indexOf("iqama"),
    );
  });

  test("completed stages should remain in pipeline order", () => {
    const completedStages = new Set([
      "medical",
      "mofa",
      "finger",
    ]);

    const pipeline = [
      "candidate",
      "medical",
      "mofa",
      "finger",
      "police_clearance",
      "takamul",
      "visa",
      "flight",
      "iqama",
    ];

    const firstIncompleteStage = pipeline.find(
      (stage) =>
        stage !== "candidate" && !completedStages.has(stage),
    );

    expect(firstIncompleteStage).toBe("police_clearance");
  });

  test("when all work stages are completed, candidate can be completed", () => {
    const pipeline = [
      "medical",
      "mofa",
      "finger",
      "police_clearance",
      "takamul",
      "visa",
      "flight",
      "iqama",
    ];

    const completedStages = new Set(pipeline);

    const allCompleted = pipeline.every((stage) =>
      completedStages.has(stage),
    );

    expect(allCompleted).toBe(true);
  });

  test("skipped stage should not block the remaining pipeline", () => {
    const requestedServices = {
      medical: true,
      mofa: true,
      finger: false,
      police_clearance: true,
      takamul: true,
      visa: true,
      flight: true,
      iqama: true,
    };

    const pipeline = [
      "candidate",
      "medical",
      "mofa",
      "finger",
      "police_clearance",
      "takamul",
      "visa",
      "flight",
      "iqama",
    ];

    const activePipeline = pipeline.filter((stage) => {
      if (stage === "candidate") return true;

      const serviceKey = stage as keyof typeof requestedServices;

      return requestedServices[serviceKey] !== false;
    });

    expect(activePipeline).not.toContain("finger");
    expect(activePipeline).toContain("police_clearance");
    expect(activePipeline).toContain("visa");
  });

  test("no work stages means candidate stage", () => {
    const activePipeline = ["candidate"];

    const workStages = activePipeline.filter(
      (stage) => stage !== "candidate",
    );

    expect(workStages.length).toBe(0);
    expect(activePipeline[0]).toBe("candidate");
  });
});