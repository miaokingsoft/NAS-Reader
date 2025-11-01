# 将项目发布到 GitHub 的详细指南

## 1. 安装 Git

1. 访问 [Git 官网](https://git-scm.com/downloads) 下载适合您操作系统的 Git 安装包
2. 安装 Git 时，保持默认选项即可
3. 安装完成后，打开命令提示符或 PowerShell，输入 `git --version` 验证是否安装成功

## 2. 配置 Git

安装完成后，需要配置您的用户名和邮箱（这些信息会显示在您的提交记录中）：

```bash
git config --global user.name "您的GitHub用户名"
git config --global user.email "您的GitHub邮箱"
```

## 3. 在 GitHub 上创建新项目

1. 登录您的 GitHub 账号
2. 点击右上角的 "+" 图标，选择 "New repository"
3. 填写项目名称（建议使用 "BooksWeb" 或 "NAS-Reader"）
4. 选择项目可见性（公开或私有）
5. 点击 "Create repository"
6. 创建成功后，复制显示的远程仓库 URL（HTTPS 或 SSH 格式）

## 4. 初始化本地仓库并关联远程仓库

如果 Git 已安装但无法直接使用 `git` 命令（环境变量未配置），您可以使用完整路径运行 Git。在项目根目录（x:\BooksWeb）中执行以下命令：

```bash
# 使用完整路径初始化 Git 仓库（如果直接使用 git init 失败）
"C:\Program Files\Git\bin\git.exe" init

# 使用完整路径添加项目文件到暂存区
"C:\Program Files\Git\bin\git.exe" add .

# 使用完整路径创建初始提交
"C:\Program Files\Git\bin\git.exe" commit -m "初始提交：群晖小文章浏览网站（NAS Reader）"

# 使用完整路径关联远程仓库（将下面的 URL 替换为您在 GitHub 上创建的仓库 URL）
"C:\Program Files\Git\bin\git.exe" remote add origin https://github.com/您的用户名/您的仓库名.git

# 使用完整路径推送到远程仓库
"C:\Program Files\Git\bin\git.exe" push -u origin master

# 如果环境变量已配置，可以直接使用
# git init
# git add .
# git commit -m "初始提交：群晖小文章浏览网站（NAS Reader）"
# git remote add origin https://github.com/您的用户名/您的仓库名.git
# git push -u origin master
```

## 5. 创建 .gitignore 文件（推荐）

在项目根目录创建一个 `.gitignore` 文件，用于忽略不需要提交到仓库的文件：

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
# 添加更改的文件
git add .

# 提交更改
git commit -m "描述您的更改"

# 推送到 GitHub
git push
```

## 7. 其他建议

1. **更新 README.md**：确保 README.md 包含项目的详细说明、安装步骤和使用方法
2. **添加 LICENSE 文件**：选择合适的开源许可证并添加到项目中
3. **使用分支管理**：对于新功能或修复，可以创建分支进行开发

## 提示

如果您在使用 SSH 方式连接 GitHub，需要设置 SSH 密钥。详细步骤可参考 [GitHub SSH 密钥设置指南](https://docs.github.com/cn/authentication/connecting-to-github-with-ssh)。