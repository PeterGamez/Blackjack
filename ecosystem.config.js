module.exports = {
	apps: [
		{
			name: "blackjack-backend",
			cwd: "./backend",
			script: "bun",
			args: "run dist/index.js",
		},
		{
			name: "blackjack-frontend",
			cwd: "./frontend",
			script: "bun",
			args: "start",
		},
	],
};
