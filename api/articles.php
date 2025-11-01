<?php
// 支持分页的API - 直接从数据库读取

// 设置头信息
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

// 确保PHP输出不包含BOM
ob_start();

// 包含数据库连接
require_once 'db.php';

// 获取请求参数
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : DEFAULT_PAGE_SIZE; // 使用全局默认值
$search = isset($_GET['search']) ? $_GET['search'] : '';
$sort = isset($_GET['sort']) ? $_GET['sort'] : 'newest';
$stored = isset($_GET['stored']) ? (int)$_GET['stored'] : 0; // 新增：获取收藏筛选参数

// 确保页码和每页数量有效
$page = max(1, $page);
$limit = max(1, min(DEFAULT_PAGE_SIZE, $limit)); // 使用全局默认值作为最大限制

// 创建数据库连接
$database = new Database();
try {
    $db = $database->getConnection();
    if (!$db) {
        throw new Exception("数据库连接失败");
    }
} catch (Exception $e) {
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
    
    // 构建查询SQL
    $baseQuery = "SELECT id, title, info AS preview, hits, store FROM bookhub";
    $countQuery = "SELECT COUNT(*) FROM bookhub";
    $whereClause = "";
    
    // 添加搜索条件（使用更安全的方法处理搜索词）
    if (!empty($search)) {
        // 对搜索词进行安全处理
        $searchTerm = $db->quote('%' . $search . '%');
        $whereClause = " WHERE title LIKE $searchTerm OR info LIKE $searchTerm";
    }
    
    // 新增：添加收藏筛选条件
    if ($stored === 1) {
        if (empty($whereClause)) {
            $whereClause = " WHERE store = 1";
        } else {
            $whereClause .= " AND store = 1";
        }
    }
    
    // 添加排序条件
    if ($sort === 'hits') {
        $orderBy = " ORDER BY hits DESC";
    } else if ($sort === 'title') {
        $orderBy = " ORDER BY title ASC";
    } else if ($sort === 'stored') {
        // 对于已收藏文章，使用ID降序排序（最新的在前面）
        $orderBy = " ORDER BY id DESC";
    } else {
        $orderBy = " ORDER BY id DESC";
    }
    
    // 查询总记录数
    $countQueryWithWhere = $countQuery . $whereClause;
    $totalItems = $db->query($countQueryWithWhere)->fetchColumn();
    
    // 计算分页数据
    $totalPages = ceil($totalItems / $limit);
    $offset = ($page - 1) * $limit;
    
    // 查询当前页数据 - 对limit和offset使用参数绑定，其余使用quote处理
    $query = $baseQuery . $whereClause . $orderBy . " LIMIT :limit OFFSET :offset";
    $stmt = $db->prepare($query);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    
    // 执行查询
    $stmt->execute();
    $paginatedArticles = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // 在PHP端进行排序：标题中包含关键词的结果排在前面
    if (!empty($search) && !empty($paginatedArticles)) {
        usort($paginatedArticles, function($a, $b) use ($search) {
            // 检查标题中是否包含关键词
            $aInTitle = mb_stripos($a['title'], $search, 0, 'UTF-8') !== false;
            $bInTitle = mb_stripos($b['title'], $search, 0, 'UTF-8') !== false;
            
            // 如果一个在标题中，另一个不在，则在标题中的排在前面
            if ($aInTitle && !$bInTitle) return -1;
            if (!$aInTitle && $bInTitle) return 1;
            
            // 否则保持原有排序（根据ID降序）
            return $b['id'] - $a['id'];
        });
    }
    
    // 为预览文本添加省略号，并清理文本（只保留中文和必要标点符号）
    foreach ($paginatedArticles as &$article) {
        if (isset($article['preview'])) {
            // 清理预览文本：只保留中文和必要标点符号，去掉英文和数字
            $originalText = $article['preview']; // 保存原始完整文本
            
            // 1. 先去除HTML标签
            $originalText = strip_tags($originalText);
            
            // 2. 全面处理所有空白字符和不可见字符
            $originalText = preg_replace('/[\s\p{Z}\p{C}]/u', '', $originalText);
            
            // 3. 彻底清理：只保留中文字符和必要的标点符号，完全去掉英文和数字
            $cleanedText = preg_replace('/[^\p{Han},.?!，。？！、：；]/u', '', $originalText);
            
            // 4. 再次确保去除英文和数字（双重保障）
            $cleanedText = preg_replace('/[a-zA-Z0-9]/u', '', $cleanedText);
            
            // 搜索关键词命中处理
            if (!empty($search)) {
                // 查找关键词在清理后文本中的位置
                $keywordPos = mb_stripos($cleanedText, $search, 0, 'UTF-8');
                
                if ($keywordPos !== false) {
                    // 如果找到关键词，生成包含关键词上下文的摘要
                    $textLength = mb_strlen($cleanedText, 'UTF-8');
                    
                    // 计算起始位置（关键词前20个字符，如果不足则从开头开始）
                    $startPos = max(0, $keywordPos - 20);
                    
                    // 计算需要截取的长度（关键词前20个 + 关键词长度 + 关键词后40个）
                    $extractLength = min($textLength - $startPos, 60 + mb_strlen($search, 'UTF-8'));
                    
                    // 截取包含关键词上下文的文本
                    $contextText = mb_substr($cleanedText, $startPos, $extractLength, 'UTF-8');
                    
                    // 如果不是从开头开始，添加省略号
                    if ($startPos > 0) {
                        $contextText = '...' . $contextText;
                    }
                    
                    // 如果不是到结尾结束，添加省略号
                    if ($startPos + $extractLength < $textLength) {
                        $contextText .= '...';
                    }
                    
                    $article['preview'] = $contextText;
                } else {
                    // 如果没找到关键词（可能是在标题中找到的），使用默认的开头文本
                    $article['preview'] = mb_substr($cleanedText, 0, 80, 'UTF-8');
                    if (mb_strlen($article['preview'], 'UTF-8') >= 80) {
                        $article['preview'] .= '...';
                    }
                }
            } else {
                // 没有搜索关键词时，使用默认的开头文本
                // 5. 截取到80个字符
                $article['preview'] = mb_substr($cleanedText, 0, 80, 'UTF-8');
                
                // 6. 如果清理后内容不足80个字符，尝试从更多原始文本中提取中文
                if (mb_strlen($article['preview'], 'UTF-8') < 80) {
                    // 尝试从原始长文本中提取更多中文
                    $chineseChars = '';
                    $charsProcessed = 0;
                    $textLength = mb_strlen($originalText, 'UTF-8');
                    
                    // 逐字符处理，只收集中文字符和必要标点
                    for ($i = 0; $i < $textLength && mb_strlen($chineseChars, 'UTF-8') < 80; $i++) {
                        $char = mb_substr($originalText, $i, 1, 'UTF-8');
                        // 检查是否为中文字符或必要标点
                        if (preg_match('/[\p{Han},.?!，。？！、：；]/u', $char)) {
                            $chineseChars .= $char;
                        }
                    }
                    
                    $article['preview'] = $chineseChars;
                }
                
                // 添加省略号
                if (mb_strlen($article['preview'], 'UTF-8') >= 80) {
                    $article['preview'] .= '...';
                }
            }
        }
    }
    
    // 计算数据库查询耗时（毫秒）
    $db_execution_time = round((microtime(true) - $db_start_time) * 1000, 3);
    
    // 构建响应数据
    $response = [
        "data" => $paginatedArticles,
        "totalItems" => $totalItems,
        "totalPages" => $totalPages,
        "currentPage" => $page,
        "pageSize" => $limit,
        "dbTime" => $db_execution_time
    ];
    
    // 输出JSON响应，确保中文正确编码
    echo json_encode($response, JSON_UNESCAPED_UNICODE);
    
} catch(PDOException $e) {
    // 发生数据库错误
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

// 可选：记录访问日志
// error_log(date('Y-m-d H:i:s') . " - API accessed: page=$page, limit=$limit, search=$search, sort=$sort\n", 3, __DIR__ . '/api.log');