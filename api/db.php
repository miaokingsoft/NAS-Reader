<?php
// 数据库连接配置 - 优化版

// 全局配置常量
const DEFAULT_PAGE_SIZE = 60; // 每页默认显示条数

// 引入数据库配置文件
$config = require_once 'config.php';

class Database {
    // 通过配置文件获取连接信息
    private $host;
    private $port;
    private $db_name;
    private $username;
    private $password;
    public $conn;
    
    // 构造函数初始化配置
    public function __construct() {
        global $config;
        $this->host = $config['host'];
        $this->port = $config['port'];
        $this->db_name = $config['db_name'];
        $this->username = $config['username'];
        $this->password = $config['password'];
    }

    // 获取数据库连接 - 优化配置，减少超时
    public function getConnection() {
        $this->conn = null;
        
        try {
            // 优化PDO配置，添加连接超时设置
            $options = [
                PDO::ATTR_TIMEOUT => 2, // 连接超时2秒，快速失败
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ];
            
            // 使用优化的连接字符串
            $dsn = "mysql:host={$this->host};port={$this->port};dbname={$this->db_name};charset=utf8mb4";
            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
            
            // 设置字符集
            $this->conn->exec("SET NAMES utf8mb4");
            
        } catch(PDOException $exception) {
            // 记录详细错误信息
            error_log("数据库连接错误: " . $exception->getMessage());
            // 返回简化错误，避免泄露详细信息
            echo json_encode(array("error" => "数据库连接失败"));
        }

        return $this->conn;
    }
}
