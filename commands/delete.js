"use strict";
const co = require("co");
const prompt = require("co-prompt");
const config = require("../template");
const chalk = require("chalk");
const fs = require("fs");
const inquirer = require("inquirer");

const tplNames = Object.keys(config.tpl);

module.exports = () => {
	co(function* () {
		const promptList = [
			{
				type: "list",
				message: "请选择模版",
				name: "tplName",
				choices: tplNames,
			},
		];
		inquirer.prompt(promptList).then((answers) => {
			// 删除对应的模板
			if (config.tpl[answers.tplName]) {
				config.tpl[answers.tplName] = undefined;
			} else {
				console.log(chalk.red("Template does not exist!"));
				process.exit();
			}

			// 写入template.json
			fs.writeFile(
				__dirname + "/../template.json",
				JSON.stringify(config),
				"utf-8",
				(err) => {
					if (err) console.log(err);
					console.log(chalk.green("Template deleted!"));
					console.log(chalk.grey("The last template list is: \n"));
					console.log(config);
					console.log("\n");
					process.exit();
				}
			);
		});
	});
};
