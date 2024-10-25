# wqq_cli
A project template tool

# Installation

```
npm install wqq_cli -g
```

# Usage
Open your terminal and type `wqq` or `wqq -h` :


```
Usage: cli <command>[options]

Options:
  -V, --version   output the version number
  -h, --help      display help for command

Commands:
  list|l          查看所有模板
  create|c [options]     使用模版创建项目
  add|a           添加新模板
  delete|d        删除模板
  help [command]  display help for command
```

```
create [options]:
  -n|--name       新项目名称
  -u|--url        远程模版地址
  -b|--branch     远程模版地址分支
  -o|--origin     要关联的远程仓库地址
```

### 例如
```
wqq c 根据命令提示从模版列表创建 或 wqq c [options] 指定参数创建
以https://xxx.git主干拉取创建新项目my-projet-name并关联远程仓库https://xxx2.git
wqq c -n my-projet-name -u https://xxx.git -b master -o https://xxx2.git
```
或
```
wqq c url name branch origin 需按顺序指定
```
# Local
```
node bin/cli list
node bin/cli create
node bin/cli add
node bin/cli help
```