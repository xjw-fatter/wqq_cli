"use strict";
const chalk = require("chalk");
const config = require("../template");

module.exports = () => {
	let tpl = config.tpl;

	if (JSON.stringify(tpl) === "{}") {
		console.log(chalk.yellow("未找到模版:请添加后在查看 lc-cli add"));
		process.exit();
	}

	for (const key in tpl) {
		if (Object.hasOwnProperty.call(tpl, key)) {
			const element = tpl[key];
			console.log(
				chalk.blue(`${key}`) +
					": " +
					chalk.green(`${element.url}`) +
					" " +
					chalk.green(`${element.branch}`)
			);
		}
	}
	process.exit();
};
