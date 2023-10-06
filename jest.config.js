module.exports = {
    preset: "ts-jest",
    testEnvironment: "node",
    testPathIgnorePatterns: ["<rootDir>/cypress/"],
    moduleNameMapper: {
        '^axios$': require.resolve('axios'),
    },
};
