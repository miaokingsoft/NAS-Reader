# 小文章浏览网站

这是一个基于PHP和MariaDB开发的个人文章浏览网站，支持文章浏览、搜索、收藏、删除等功能，具有响应式设计和主题切换功能。

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

- **后端** - PHP 7.4+, MariaDB/MySQL
- **前端** - HTML5, CSS3, JavaScript (ES6+)
- **数据库** - PDO连接，支持参数化查询防止SQL注入

## 项目结构

```
BooksWeb/
├── api/            # 后端API接口
│   ├── db.php      # 数据库连接配置
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

### 数据库连接配置

修改 `api/db.php` 文件中的数据库连接信息：

```php
private $host = 'localhost';       // 数据库主机IP（如群晖NAS的IP）
private $db_name = 'Books';        // 数据库名
private $username = 'admin';       // 数据库用户名
private $password = 'password';    // 数据库密码
```

## 群晖NAS部署方法

1. **安装必要套件**
   - 在群晖DSM中打开「套件中心」
   - 安装「Web Station」套件
   - 安装「MariaDB」套件（推荐MariaDB 10+版本）
   - 安装「phpMyAdmin」套件（用于数据库管理，可选）

2. **配置Web Station**
   - 打开「Web Station」→「PHP设置」→「创建」
   - 选择PHP 7.4或更高版本
   - 启用必要的扩展（如mysqli、pdo_mysql等）
   - 保存设置
   - 点击「虚拟主机」→「创建」→「基于端口的设置」
   - 设置端口（如7878）和文档根目录（指向BooksWeb文件夹）
   - 选择刚才创建的PHP配置文件

3. **配置数据库**
   - 打开「phpMyAdmin」（或通过SSH连接使用命令行）
   - 创建名为`Books`的数据库
   - 导入表结构（使用上面提供的SQL语句）
   - 为数据库创建具有适当权限的用户（推荐使用非root用户）

4. **修改项目配置**
   - 编辑`api/db.php`文件
   - 修改数据库连接信息，使用群晖NAS的IP地址、数据库名、用户名和密码

5. **访问网站**
   - 在浏览器中输入 `http://[群晖NAS的IP地址]:[配置的端口]/`
   - 例如：`http://192.168.0.18:7878/`

## MariaDB/MySQL性能优化

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
- 最大支持每页50条数据

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
- 可根据需要增加用户认证系统