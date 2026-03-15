const { existsSync, rmdirSync } = require("node:fs");

if (existsSync("./dist")) {
	rmdirSync("./dist", { recursive: true });
}