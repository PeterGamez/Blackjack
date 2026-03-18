const { existsSync, rmdirSync } = require("node:fs");

if (existsSync("./.next")) {
	rmdirSync("./.next", { recursive: true });
}