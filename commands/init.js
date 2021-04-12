"use strict";
const exec = require("child_process").exec;
const co = require("co");
const config = require("../template"); // 模板地址
const chalk = require("chalk"); // 颜色
const ora = require("ora");   // loading
const inquirer = require("inquirer"); // 交互式命令行用户界面集合
const tplNames = Object.keys(config.tpl);
const path = require("path");

module.exports = () => {
	co(function* () {
		let promptList = [
			{
				type: "list",
				message: "请选择模版",
				name: "tplName",
				choices: tplNames,
			},
			{
				type: "input",
				message: "请输入项目名字",
				name: "projectName",
				validate(val) {
					if (!val) {
						return "项目名称不能为空";
					}
					return true;
				},
			},
			{
				type: "input",
				message: "是否安装依赖Y/N",
				name: "needInstall",
				validate(val) {
					if (!val || (val != "Y" && val != "N") ) {
						return "请输入Y/N";
					}
					return true;
				},
			},
		];

		inquirer.prompt(promptList).then((answers) => {
			let { tplName, projectName, needInstall} = answers;
			let ind = config.tpl[tplName];
			let gitUrl = `${ind.url}`;
			// git命令，远程拉取项目并自定义项目名
			let cmdStr = `git clone ${gitUrl} ${projectName} && cd ${projectName} && git checkout ${ind.branch}`;
			let spinner = ora("\n Start generating...");
			spinner.start();
			exec(cmdStr, (error, stdout, stderr) => {
				spinner.stop();
				if (error) {
					console.log(error);
					process.exit();
				}
				console.log(chalk.green("\n √ Generation completed!"));
				if( needInstall == "Y") {
					// console.log(`起始的目录: ${process.cwd()}`);
					try {
						process.chdir(projectName);
						// console.log(`新的目录: ${process.cwd()}`);
						let spinner = ora("Start install...");
						spinner.start();
						exec('npm install', (error, stdout, stderr) => {
							spinner.stop();
							if (error) {
								console.log(error);
								process.exit();
							}
							// console.log("stdout",stdout);
							// console.log("stderr",stderr);
							console.log(chalk.green(`\n √ The installation is complete \n`));
							console.log(chalk.green(`\n cd ${projectName} && ...\n`));
							process.exit();
						});
					  } catch (err) {
						console.error(`chdir: ${err}`);
					  }
					return;
				}
				console.log(chalk.blue(`\n cd ${projectName} && npm install \n`));
				process.exit();
			});
		});
	});
};
