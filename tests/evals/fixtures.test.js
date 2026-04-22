import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildStructuredResume } from "@/lib/services/resume-parser";
import { runTailoringSession } from "@/lib/services/tailoring-engine";

const fixturesDirectory = path.join(process.cwd(), "tests", "fixtures");
const fixtureFiles = fs.readdirSync(fixturesDirectory).filter((file) => file.endsWith(".json"));

describe("fixture-based evals", () => {
  for (const fileName of fixtureFiles) {
    it(`keeps trust guarantees for ${fileName}`, async () => {
      const fixture = JSON.parse(fs.readFileSync(path.join(fixturesDirectory, fileName), "utf-8"));
      const structuredResume = buildStructuredResume(fixture.resumeText);
      const session = await runTailoringSession({
        structuredResume,
        jobDescriptionText: fixture.jobDescriptionText,
        company: "Fixture Co",
        role: fixture.role
      });

      expect(session.suggestions.every((item) => item.safe)).toBe(true);
      expect(session.gaps.map((gap) => gap.name.toLowerCase())).toEqual(
        expect.arrayContaining(fixture.expectedGaps.map((item) => item.toLowerCase()))
      );
      expect(session.scores.find((score) => score.id === "readability").score).toBeGreaterThan(70);
      expect(session.scores.find((score) => score.id === "ats").score).toBeGreaterThan(60);
    });
  }
});
