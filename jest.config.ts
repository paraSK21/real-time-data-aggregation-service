import type { Config } from "jest";

const config: Config = {
	preset: "ts-jest",
	testEnvironment: "node",
	roots: ["<rootDir>/tests"],
	moduleFileExtensions: ["ts", "js"],
	collectCoverageFrom: ["src/**/*.{ts,tsx}"],
	coverageDirectory: "coverage",
	verbose: true,
};

export default config;
