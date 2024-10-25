"use strict";
const exec = require("child_process").exec;
const co = require("co");
const config = require("../template"); // 模板地址
const chalk = require("chalk"); // 颜色
const ora = require("ora"); // loading
const inquirer = require("inquirer"); // 交互式命令行用户界面集合
const tplNames = Object.keys(config.tpl);
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const fs = require("fs");
const path = require("path");

const LOCKS = {
	"package-lock.json": "npm",
	"pnpm-lock.yaml": "pnpm",
	"yarn.lock": "yarn",
};

const gitPathTestReg = () => {
	return new RegExp(
		"^(?:git|ssh|https?|ftps?)://(?:[\\w\\-.]+@)?(?:[\\w-]+(?:\\.[\\w-]+)+)(?::\\d+)?(?:\\/[^\\s]*)*\\/?[\\w-]+(?:\\.git)?$"
	);
};

/**
 * 根据不同的操作系统平台，生成删除.git目录的命令字符串。
 * @returns {string} 返回特定平台的删除.git目录命令，若平台不支持则返回空字符串。
 */
const delGitStr = function () {
	const platform = process.platform;
	let str = ""; // 删除文件命令
	switch (platform) {
		case "aix":
			console.log("IBM AIX platform");
			break;
		case "darwin":
			console.log("Darwin platfrom(MacOS, IOS etc)");
			str = "&& rm -r .git";
			break;
		case "freebsd":
			console.log("FreeBSD Platform");
			break;
		case "linux":
			console.log("Linux Platform");
			str = "&& rm -rf .git";
			break;
		case "openbsd":
			console.log("OpenBSD platform");
			break;
		case "sunos":
			console.log("SunOS platform");
			break;
		case "win32":
			console.log("windows platform");
			str = "&& rd /s /q .git";
			break;
		default:
			console.log("unknown platform");
	}
	return str;
};

/**
 * 克隆项目并切换分支，根据需要安装依赖
 * @param {Object} options - 选项对象
 * @param {string} options.gitUrl - Git仓库URL
 * @param {string} options.projectName - 项目名称
 * @param {string} options.branch - 分支名称
 * @param {string} [options.needInstall='N'] - 是否需要安装依赖，默认为'N'
 * @param {string} [options.origin] - 远程仓库地址
 */
const cloneProject = async (options) => {
	const { gitUrl, projectName, branch, needInstall, origin } = options;
	let cmdStr = `git clone ${gitUrl} ${projectName} && cd ${projectName} && git checkout ${branch} ${delGitStr()} && git init`;
	if (origin) {
		cmdStr += `&& git remote add origin ${origin}`;
	}
	const spinner = ora("\n Start generating...");
	exec(cmdStr, (error, stdout, stderr) => {
		spinner.stop();
		if (error) {
			console.log(error);
			process.exit();
		}
		console.log(chalk.green("\n √ Generation completed!"));
		if (needInstall == "Y" || needInstall == "y") {
			installDependencies(projectName);
			return;
		}
		console.log(
			chalk.blue(`\n cd ${projectName} && run npm/pnpm/yarn install && git remote add origin \n`)
		);
		process.exit();
	});
};

/**
 * 安装项目依赖
 * @param {string} projectName - 项目名称
 * @returns {Promise<void>}
 * 该函数会切换到指定项目目录，使用指定的包管理器安装项目依赖，并在安装完成后退出进程。
 * 如果安装过程中出现错误，会打印错误信息并退出进程。
 */
const installDependencies = async (projectName) => {
	try {
		process.chdir(projectName);
		// console.log(`新的目录: ${process.cwd()}`);
		const agent = await detect();
		let spinner = ora("Start install...");
		spinner.start();
		exec(`${agent} install`, (error, stdout, stderr) => {
			spinner.stop();
			if (error) {
				console.log(error);
				process.exit();
			}
			console.log(chalk.green(`\n √ The installation is complete \n`));
			console.log(
				chalk.green(`\n cd ${projectName} && git remote add origin && ...\n`)
			);
			console.log(
				chalk.green(
					`\n 切换到 ${projectName} 目录 && 运行git remote add origin <origin>关联远程仓库 && ...\n`
				)
			);
			process.exit();
		});
	} catch (err) {
		console.error(`chdir: ${err}`);
	}
};

/**
 * 检测并返回当前项目中使用的包管理工具。
 * 首先检查`package.json`中的配置，然后查找锁文件，最后通过用户手动选择确定。
 * @returns {Promise<string>} 返回一个包含包管理工具名称的Promise对象。
 */
const detect = () => {
	return new Promise((resolve, reject) => {
		let agent = "";

		const packageJsonPath = path.join(process.cwd(), "package.json");
		// package.json中配置了
		if (fs.existsSync(packageJsonPath)) {
			const packageJson = require(packageJsonPath);
			const packageManager = packageJson.packageManager || "";
			packageManager && (agent = packageManager.split("@")[0]);
		}
		if (agent) {
			resolve(agent);
			return;
		}

		// 有lock文件
		const lockFilePath = findUp(Object.keys(LOCKS));
		if (fs.existsSync(lockFilePath)) {
			const lockFileType = path.basename(lockFilePath);
			agent = LOCKS[lockFileType];
		}
		if (agent) {
			resolve(agent);
			return;
		}

		// 手动选择
		inquirer
			.prompt([
				{
					type: "list",
					message: "请选择包管理工具",
					name: "packageManager",
					choices: ["npm", "pnpm", "yarn"],
				},
			])
			.then((answers) => {
				resolve(answers.packageManager);
			});
	});
};

/**
 * 在当前工作目录及其父目录中查找指定的文件列表中的第一个存在的文件，并返回其完整路径。
 * 如果找不到任何文件，则返回空字符串。
 * @param {string[]} files - 要查找的文件名列表
 * @returns {string} - 找到的文件的完整路径，或空字符串（如果未找到）
 */
const findUp = (files) => {
	const fs = require("fs");
	const path = require("path");
	const cwd = process.cwd();
	let foundLockFile = "";

	for (let index = 0; index < files.length; index++) {
		const file = files[index];
		const filePath = path.join(cwd, file);
		if (fs.existsSync(filePath)) {
			foundLockFile = filePath;
			break;
		}
	}

	return foundLockFile;
};

module.exports =
	/**
	 * 该函数用于处理创建项目的命令行参数，并根据参数执行相应的操作。
	 * 如果提供了远程仓库URL和分支，则直接下载项目。
	 * 如果没有提供URL，则会检查模版列表，如果没有可用的模版，则提示用户先添加模版。
	 * 如果有可用的模版，则会通过对话询问用户选择模版、输入项目名称、关联的远程仓库以及是否安装依赖。
	 * 根据用户的回答，调用cloneProject函数克隆项目。
	 */
	() => {
		co(function* () {
			// 获取参数
			const argv = yargs(hideBin(process.argv)).argv;
			// -或--指定的参数
			const {
				_: _default,
				n,
				name: _name,
				u,
				url: _url,
				b,
				branch: _branch,
				o,
				origin: _origin,
			} = argv;
			// 直接输入的参数 直接输入需按照指定顺序输入 command url name branch origin
			const [command, url, name, branch, origin] = _default;
			// 指定的链接和分支下载项目
			if (url) {
				if (!gitPathTestReg().test(url)) {
					console.log(chalk.yellow("url:模版链接格式不正确,请重新输入"));
					return;
				}
				if (origin && !gitPathTestReg().test(origin)) {
					console.log(
						chalk.yellow("origin:待关联远程仓库链接格式不正确,请重新输入")
					);
					return;
				}
				cloneProject({
					gitUrl: url,
					projectName: name || "my-project",
					branch: branch || "master",
					needInstall: false,
					origin,
				});
				return;
			}
			const __u = u || _url;
			if (__u) {
				if (!gitPathTestReg().test(__u)) {
					console.log(chalk.yellow("url:模版链接格式不正确,请重新输入"));
					return;
				}
				const __o = o || _origin;
				if (__o && !gitPathTestReg().test(__o)) {
					console.log(
						chalk.yellow("origin:待关联远程仓库链接格式不正确,请重新输入")
					);
					return;
				}

				cloneProject({
					gitUrl: __u,
					projectName: n || _name || "my-project",
					branch: b || _branch || "master",
					needInstall: false,
					origin: __o,
				});
				return;
			}

			// 如果模版列表也是空的直接退出
			if (JSON.stringify(config.tpl) === "{}") {
				console.log(chalk.yellow("未找到模版:请先添加模版"));
				return;
			}

			// 否则使用开始对话询问
			const promptList = [
				{
					type: "list",
					message: "请选择模版",
					name: "tplName",
					choices: tplNames,
				},
				{
					type: "input",
					message: "请输入项目名称",
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
					message: "请输入要关联的远程仓库(可不填)",
					name: "origin",
					validate(val) {
						if (!val) return true;
						if (!gitPathTestReg().test(val)) {
							return true;
						}
						return "请检查仓库地址格式是否正确";
					},
				},
				{
					type: "input",
					message: "是否安装依赖Y/N",
					name: "needInstall",
					validate(val) {
						if (!val || !["Y", "y", "N", "n"].includes(val)) {
							return "请输入Y/N";
						}
						return true;
					},
				},
			];

			inquirer.prompt(promptList).then((answers) => {
				const { tplName, projectName, needInstall, origin } = answers;
				const ind = config.tpl[tplName];
				cloneProject({
					gitUrl: `${ind.url}`,
					projectName,
					branch: ind.branch,
					needInstall,
					origin,
				});
			});
		});
	};
