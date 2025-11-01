<?php
// 操作接口（收藏、删除、更新点击量）
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

// 包含数据库连接
require_once 'db.php';

// 检查请求方法
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(array(
        "success" => false,
        "message" => "只支持POST请求"
    ));
    exit;
}

// 获取请求参数
$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['action']) || !isset($data['id'])) {
    echo json_encode(array(
        "success" => false,
        "message" => "缺少必要参数"
    ));
    exit;
}

$action = $data['action'];
$article_id = (int)$data['id'];

// 创建数据库连接
$database = new Database();
$db = $database->getConnection();

try {
    switch ($action) {
        case 'store':
            // 切换收藏状态
            $query = "UPDATE bookhub SET store = 1 - store WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $article_id, PDO::PARAM_INT);
            $stmt->execute();
            
            // 获取更新后的收藏状态
            $get_store_query = "SELECT store FROM bookhub WHERE id = :id";
            $get_store_stmt = $db->prepare($get_store_query);
            $get_store_stmt->bindParam(':id', $article_id, PDO::PARAM_INT);
            $get_store_stmt->execute();
            $store_status = $get_store_stmt->fetch(PDO::FETCH_ASSOC)['store'];
            
            echo json_encode(array(
                "success" => true,
                "message" => $store_status ? "收藏成功" : "取消收藏成功",
                "store" => $store_status
            ));
            break;
            
        case 'delete':
            // 删除文章
            $query = "DELETE FROM bookhub WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $article_id, PDO::PARAM_INT);
            $stmt->execute();
            
            echo json_encode(array(
                "success" => true,
                "message" => "文章删除成功"
            ));
            break;
            
        case 'hits':
            // 单独更新点击量（备用接口）
            $query = "UPDATE bookhub SET hits = hits + 1 WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $article_id, PDO::PARAM_INT);
            $stmt->execute();
            
            echo json_encode(array(
                "success" => true,
                "message" => "点击量更新成功"
            ));
            break;
            
        default:
            echo json_encode(array(
                "success" => false,
                "message" => "不支持的操作类型"
            ));
    }
    
} catch(PDOException $e) {
    echo json_encode(array(
        "success" => false,
        "message" => "操作失败: " . $e->getMessage()
    ));
}