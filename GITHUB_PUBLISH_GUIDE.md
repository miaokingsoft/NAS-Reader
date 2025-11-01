# 将项目发布到 GitHub 的详细指南

## 1. 安装 Git

1. 访问 [Git 官网](https://git-scm.com/downloads) 下载适合您操作系统的 Git 安装包
2. 安装 Git 时，保持默认选项即可
3. 安装完成后，打开命令提示符或 PowerShell，输入 `git --version` 验证是否安装成功

## 2. 配置 Git

安装完成后，需要配置您的用户名和邮箱（这些信息会显示在您的提交记录中）：

```bash
# 已为您设置的邮箱
git config --global user.email "bjonline@qq.com"

# 设置用户名（使用您的GitHub用户名）
git config --global user.name "miaokingsoft"

### 解决作者身份问题

如果在提交时遇到 `Author identity unknown` 错误，您可以：

1. 确保上述配置命令已成功执行
2. 或者，在提交命令中直接指定作者信息：

```bash
"C:\Program Files\Git\bin\git.exe" commit -m "初始提交" --author="miaokingsoft <bjonline@qq.com>"
```

## 3. 在 GitHub 上创建新项目

1. 登录您的 GitHub 账号
2. 点击右上角的 "+" 图标，选择 "New repository"
3. 填写项目名称（建议使用 "BooksWeb" 或 "NAS-Reader"）
4. 选择项目可见性（公开或私有）
5. **不要**勾选 "Add a README file"、"Add .gitignore" 或 "Choose a license"，因为我们已经在本地创建了这些文件
6. 点击 "Create repository"
7. 创建成功后，复制显示的远程仓库 URL（HTTPS 或 SSH 格式）

### GitHub 创建仓库后的步骤

创建仓库后，GitHub 会显示几个选项。选择 "…or push an existing repository from the command line"，然后复制显示的命令。这些命令通常是：

```bash
git remote add origin https://github.com/miaokingsoft/BooksWeb.git
git branch -M main
git push -u origin main
```

## 4. 初始化本地仓库并关联远程仓库

> **重要提示**：我们已经为您在项目中执行了以下步骤：
> 1. 初始化了 Git 仓库
> 2. 创建了 .gitignore 文件
> 3. 添加了所有文件到暂存区
> 
> 您现在只需要完成最后的提交和推送到 GitHub 的步骤。

如果 Git 已安装但无法直接使用 `git` 命令（环境变量未配置），您可以使用完整路径运行 Git。在项目根目录（x:\BooksWeb）中执行以下命令：

```bash
# 1. 创建初始提交（如果之前未完成）
"C:\Program Files\Git\bin\git.exe" commit -m "初始提交：群晖小文章浏览网站（NAS Reader）" --author="您的GitHub用户名 <bjonline@qq.com>"

# 2. 关联远程仓库（将下面的 URL 替换为您在 GitHub 上创建的仓库 URL）
"C:\Program Files\Git\bin\git.exe" remote add origin https://github.com/miaokingsoft/BooksWeb.git

# 3. 设置主分支名称（GitHub 默认使用 main 分支）
"C:\Program Files\Git\bin\git.exe" branch -M main

# 4. 推送到远程仓库
"C:\Program Files\Git\bin\git.exe" push -u origin main

# 如果环境变量已配置，可以直接使用
# git commit -m "初始提交：群晖小文章浏览网站（NAS Reader）"
# git remote add origin https://github.com/miaokingsoft/BooksWeb.git
# git branch -M main
# git push -u origin main
```

## 5. .gitignore 文件说明（已创建）

我们已经为您创建了 `.gitignore` 文件，用于忽略不需要提交到仓库的文件。如果您需要修改，可以编辑这个文件。当前内容包括：

```
# 忽略 IDE 相关文件
.idea/
.vscode/
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# 忽略操作系统生成的文件
Thumbs.db
.DS_Store

# 忽略数据库文件
*.db
*.sqlite

# 忽略日志文件
*.log
logs/

# 忽略临时文件
tmp/
temp/

# 忽略环境变量文件
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# 忽略 Composer 依赖
/vendor/
composer.lock

# 忽略 Node.js 依赖
/node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
```

## 6. 后续维护

之后，当您对项目进行修改后，可以使用以下命令更新 GitHub 仓库：

```bash
# 使用完整路径添加更改的文件
"C:\Program Files\Git\bin\git.exe" add .

# 使用完整路径提交更改
"C:\Program Files\Git\bin\git.exe" commit -m "描述您的更改" --author="您的GitHub用户名 <bjonline@qq.com>"

# 使用完整路径推送到 GitHub
"C:\Program Files\Git\bin\git.exe" push

# 如果环境变量已配置，可以直接使用
# git add .
# git commit -m "描述您的更改"
# git push
```

## 7. 其他建议

1. **更新 README.md**：确保 README.md 包含项目的详细说明、安装步骤和使用方法
2. **添加 LICENSE 文件**：选择合适的开源许可证并添加到项目中
3. **使用分支管理**：对于新功能或修复，可以创建分支进行开发

## 8. 提示与故障排除

### 网络路径安全问题

如果在使用网络路径（如 NAS 共享）时遇到 Git 安全警告，可以使用以下命令添加安全例外：

```bash
"C:\Program Files\Git\bin\git.exe" config --global --add safe.directory '%(prefix)///网络路径'
```

### SSH 连接设置

如果您在使用 SSH 方式连接 GitHub，需要设置 SSH 密钥。详细步骤可参考 [GitHub SSH 密钥设置指南](https://docs.github.com/cn/authentication/connecting-to-github-with-ssh)。

### 常见错误解决

1. **作者身份错误**：使用 `--author` 参数在提交时指定作者信息
2. **权限不足**：确保您有 GitHub 仓库的写入权限
3. **网络问题**：检查网络连接，考虑使用 HTTPS 而非 SSH（如果 SSH 连接失败）