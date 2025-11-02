# 群晖小文章浏览网站（NAS-Reader）

[English](https://www.zdoc.app/en/miaokingsoft/NAS-Reader)

这是一个基于PHP和MariaDB开发的个人小文章阅读平台，具备响应式设计和主题切换功能，支持文章浏览、搜索、收藏及管理等操作，建议配合n8n定时采集工具实现自动化文章入库，完美适配群晖NAS环境部署，为您打造专属的离线知识库。

## 版本信息

- **当前版本**: v1.0
- **开发状态**: 已发布

## 功能特性

- 📚 **文章列表展示** - 响应式布局，支持分页加载和页码导航
- 🔍 **智能搜索** - 支持文章标题和内容搜索，标题匹配结果优先展示，带关键词高亮
- 📝 **关键词上下文摘要** - 搜索时展示关键词前后的上下文内容，提供更精准的搜索预览
- 💾 **收藏管理** - 一键收藏和取消收藏文章，支持筛选显示收藏内容
- 🗑️ **文章删除** - 支持删除不需要的文章，带确认提示
- 📊 **点击量统计** - 自动记录文章阅读次数
- 🌓 **主题切换** - 支持白天/夜间模式，本地保存主题偏好，自动适配系统设置
- 📱 **响应式设计** - 适配各种屏幕尺寸
- 🎨 **现代化UI** - 简洁美观的界面设计
- 🔢 **分页导航** - 支持页码快速跳转、上一页/下一页导航
- 🔔 **操作通知** - 提供友好的操作反馈提示

## 技术栈

- **后端** - PHP 8.2+, MariaDB/MySQL
- **前端** - HTML5, CSS3, JavaScript (ES6+)
- **数据库** - PDO连接，支持参数化查询防止SQL注入

## 项目结构

```
NAS-Reader/
├── api/            # 后端API接口
│   ├── config.php   # 数据库配置文件
│   ├── db.php      # 数据库连接
│   ├── articles.php # 文章列表接口
│   ├── article.php  # 文章详情接口
│   └── action.php   # 操作接口（收藏、删除等）
├── css/            # 样式文件
│   └── style.css   # 主样式文件，包含主题系统
├── js/             # JavaScript文件
│   └── app.js      # 前端交互逻辑
├── images/         # 图片资源目录
├── index.html      # 主页面
└── README.md       # 项目说明文档
```

## 数据库配置

### 数据库表结构

需要创建一个名为`Books`的数据库，并创建以下表：

```sql
CREATE TABLE `bookhub` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(200) DEFAULT NULL,
  `info` longtext DEFAULT NULL,
  `hits` int(10) DEFAULT NULL,
  `store` int(1) DEFAULT NULL,
  PRIMARY KEY (`id`),
  FULLTEXT KEY `title` (`title`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### 数据库配置文件

项目使用独立的配置文件管理数据库连接信息，以提高安全性。配置文件位置：`api/config.php`。

#### 配置文件说明

1. **创建配置文件**：在`api`目录下创建`config.php`文件（如果不存在）
2. **配置内容**：

```php
<?php
// 数据库配置文件 - 请勿提交到版本控制系统
// 注意：请根据实际环境修改以下配置信息

// 数据库连接信息
return array(
    'host' => '192.168.0.88',       // 数据库主机IP（如群晖NAS的IP）
    'port' => 3307,                 // 数据库端口
    'db_name' => 'Books',         // 数据库名
    'username' => 'phpuser',        // 数据库用户名
    'password' => 'your_password'   // 数据库密码
);
```

3. **参数说明**：
   - `host`：数据库服务器地址
   - `port`：数据库端口（默认3307，MariaDB常用端口）
   - `db_name`：数据库名称
   - `username`：数据库用户名
   - `password`：数据库密码

4. **配置文件使用方法**：
   - 系统会自动从`config.php`加载配置
   - 确保配置文件权限设置正确，避免未授权访问
   - 在生产环境中使用强密码并限制访问权限

## 群晖NAS部署方法

1. **安装必要套件**
   - 在群晖DSM中打开「套件中心」
   - 安装「Web Station」套件
   - 安装「MariaDB」套件（推荐MariaDB 10+版本）
   - 安装「phpMyAdmin」套件（用于数据库管理，可选）

2. **配置Web Station**
   - 打开「Web Station」→「PHP设置」→「创建」
   - 选择PHP 8.2或更高版本
   - 启用必要的扩展（如mysqli、pdo_mysql等）
   - 保存设置
   - 点击「虚拟主机」→「创建」→「基于端口的设置」
   - 设置端口（如7878）和文档根目录（指向NAS-Reader文件夹）
   - 选择刚才创建的PHP配置文件

3. **配置数据库**
   - 打开「phpMyAdmin」（或通过SSH连接使用命令行）
   - 创建名为`Books`的数据库
   - 导入表结构（使用上面提供的SQL语句）
   - 为数据库创建具有适当权限的用户（推荐使用非root用户）

4. **修改项目配置**
   - 编辑`api/config.php`文件
   - 修改数据库连接信息，使用群晖NAS的IP地址、数据库名、用户名和密码

5. **访问网站**
   - 在浏览器中输入 `http://[群晖NAS的IP地址]:[配置的端口]/`
   - 例如：`http://192.168.0.18:7878/`

## MariaDB/MySQL性能优化（非必须）

若遇到数据库访问速度缓慢的问题，可通过修改配置文件解决：

1. 找到MariaDB的配置文件my.cnf（如/volume1/@appstore/MariaDB10/usr/local/mariadb10.11/etc/mysql/my.cnf）
2. 在配置文件的[mysqld]部分添加"skip-name-resolve"配置项
3. 保存修改后重启MariaDB服务（或直接重启NAS设备）

此优化措施通常能显著提升数据库的响应速度。

## 浏览器兼容性

- Chrome 70+
- Firefox 65+
- Safari 13+
- Edge 80+

## 开发说明

### API接口

#### 获取文章列表
```
GET /api/articles.php?page=1&limit=20&search=&sort=newest
```

**搜索功能优化说明**：
- 支持标题和内容搜索
- 标题中包含关键词的结果优先排序
- 搜索结果摘要会显示关键词前后的上下文内容（前20字符，后40字符）
- 最大支持每页60条数据

#### 获取文章详情
```
GET /api/article.php?id=1
```

#### 文章操作
```
POST /api/action.php
Body: {"action": "store", "id": 1}
```

## 安全注意事项

- 已实现参数化查询，防止SQL注入
- 建议在生产环境中移除调试信息
- 建议使用HTTPS协议
- 可根据需要增加用户认证系统（如基于Session的登录）
- 建议限制API接口的访问IP范围，防止未授权访问
- 不建议暴露在公网上的群晖NAS上部署本系统，建议在内部网络部署

## 联系方式
- 邮箱：7740840@qq.com
- 抖音：@闲沐工坊
- QQ：7740840
