<?php
/**
 * File test đơn giản để kiểm tra PHP có hoạt động không
 * Truy cập: https://sfotor.site/api/test.php
 */

header('Content-Type: application/json; charset=utf-8');

echo json_encode([
    'success' => true,
    'message' => 'PHP đang hoạt động bình thường!',
    'php_version' => phpversion(),
    'server' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
    'timestamp' => date('Y-m-d H:i:s')
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
?>

