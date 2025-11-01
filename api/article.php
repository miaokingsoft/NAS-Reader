<?php
// 文章详情接口 - 添加错误处理和编码支持
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

// 确保PHP输出不包含BOM
ob_start();

// 包含数据库连接
require_once 'db.php';

// 检查是否提供了文章ID
if (!isset($_GET['id']) || empty($_GET['id'])) {
    $response = array(
        "error" => "缺少文章ID参数"
    );
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    ob_end_flush();
    exit;
}

$article_id = (int)$_GET['id'];

// 创建数据库连接
$database = new Database();
try {
    $db = $database->getConnection();
} catch (PDOException $e) {
    $response = array(
        "error" => "数据库连接失败: " . $e->getMessage()
    );
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    ob_end_flush();
    exit;
}

try {
    // 记录数据库查询开始时间
    $db_start_time = microtime(true);
    
    // 开始事务
    $db->beginTransaction();
    
    // 更新点击量
    $update_query = "UPDATE bookhub SET hits = hits + 1 WHERE id = :id";
    $update_stmt = $db->prepare($update_query);
    $update_stmt->bindParam(':id', $article_id, PDO::PARAM_INT);
    $update_stmt->execute();
    
    // 查询文章详情 - 确保从SexBooks数据源中读取完整数据
    $query = "SELECT id, title, info, hits, store FROM bookhub WHERE id = :id";
    $stmt = $db->prepare($query);
    $stmt->bindParam(':id', $article_id, PDO::PARAM_INT);
    $stmt->execute();
    
    // 检查查询是否有结果
    if ($stmt->rowCount() === 0) {
        $db->rollBack();
        $response = array(
            "error" => "文章不存在: ID {$article_id}"
        );
        echo json_encode($response, JSON_UNESCAPED_UNICODE);
        ob_end_flush();
        exit;
    }
    
    // 计算数据库查询耗时（毫秒）
    $db_execution_time = round((microtime(true) - $db_start_time) * 1000, 3);
    
    if ($stmt->rowCount() > 0) {
        $article = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // 提交事务
        $db->commit();
        
        // 直接使用数据，因为数据库已经使用utf8mb4编码
        $response = array(
            "id" => $article['id'],
            "title" => $article['title'],
            "content" => $article['info'],
            "hits" => $article['hits'] + 1, // 显示更新后的点击量
            "store" => $article['store']
        );
        
        // 清理内容中的潜在安全风险，但保留换行符
        $response['title'] = filter_var($response['title'], FILTER_SANITIZE_STRING);
        // 不使用FILTER_SANITIZE_STRING，而是手动进行安全处理
        $response['content'] = htmlspecialchars($response['content'], ENT_QUOTES, 'UTF-8');
        // 确保换行符被保留
        $response['content'] = str_replace(array("\r\n", "\r", "\n"), "\n", $response['content']);
        
        // 添加数据库查询耗时
        $response["dbTime"] = $db_execution_time;
        
        // 使用JSON_UNESCAPED_UNICODE确保中文正确编码
        echo json_encode($response, JSON_UNESCAPED_UNICODE);
    } else {
        // 回滚事务
        $db->rollBack();
        $response = array(
            "error" => "文章不存在"
        );
        echo json_encode($response, JSON_UNESCAPED_UNICODE);
    }
    
} catch(PDOException $e) {
    // 发生错误时回滚
    if (isset($db)) {
        $db->rollBack();
    }
    $response = array(
        "error" => "查询失败: " . $e->getMessage()
    );
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    // 捕获其他所有异常
    $response = array(
        "error" => "系统错误: " . $e->getMessage()
    );
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
}

// 确保输出缓冲区刷新
ob_end_flush();