<?php
/**
 * API endpoint để upload config.json và frame images lên server
 * Đặt file này vào: public_html/api/upload-config.php
 */

// Set headers trước khi output bất kỳ gì
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Admin credentials (nên đổi trong production)
$ADMIN_USERNAME = 'sondinhson11';
$ADMIN_PASSWORD = 'As121202@';

// Kiểm tra authentication
if (!isset($_POST['username']) || !isset($_POST['password'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Thiếu thông tin đăng nhập']);
    exit;
}

if ($_POST['username'] !== $ADMIN_USERNAME || $_POST['password'] !== $ADMIN_PASSWORD) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Sai tên đăng nhập hoặc mật khẩu']);
    exit;
}

// Kiểm tra method
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

try {
    // Xác định đường dẫn base (public_html)
    // Nếu file ở public_html/api/upload-config.php thì baseDir là public_html
    $baseDir = dirname(dirname(__FILE__)); // public_html
    
    // Đảm bảo không có output nào trước JSON
    ob_start();
    $results = [];

    // 1. Upload config.json
    if (isset($_POST['config'])) {
        $configData = $_POST['config'];
        $configPath = $baseDir . '/config.json';
        
        // Validate JSON trước khi ghi
        $configArray = json_decode($configData, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('JSON không hợp lệ: ' . json_last_error_msg());
        }
        
        // Kiểm tra và clean frames
        if (isset($configArray['frames']) && is_array($configArray['frames'])) {
            $frameIds = [];
            $duplicates = [];
            $invalidFrames = [];
            $cleanedFrames = [];
            
            // Đếm số lần xuất hiện của mỗi ID trước khi clean
            $idCounts = [];
            foreach ($configArray['frames'] as $frame) {
                if (isset($frame['id'])) {
                    $id = $frame['id'];
                    $idCounts[$id] = ($idCounts[$id] ?? 0) + 1;
                }
            }
            
            foreach ($configArray['frames'] as $index => $frame) {
                // Kiểm tra frame hợp lệ
                if (!isset($frame['id']) || !isset($frame['name']) || !isset($frame['path'])) {
                    $invalidFrames[] = "Frame ở vị trí {$index} thiếu thông tin (id: " . (isset($frame['id']) ? $frame['id'] : 'null') . ", name: " . (isset($frame['name']) ? $frame['name'] : 'null') . ", path: " . (isset($frame['path']) ? $frame['path'] : 'null') . ")";
                    continue;
                }
                
                $frameId = $frame['id'];
                
                // Kiểm tra duplicate ID
                if (in_array($frameId, $frameIds)) {
                    $existingIndex = array_search($frameId, $frameIds);
                    $duplicates[] = "Frame ID {$frameId} bị trùng - Frame mới: vị trí {$index}, tên '{$frame['name']}' - Frame cũ: vị trí {$existingIndex}, tên '{$cleanedFrames[$existingIndex]['name']}'";
                    continue; // Bỏ qua frame duplicate
                }
                
                $frameIds[] = $frameId;
                $cleanedFrames[] = $frame;
            }
            
            // Log các ID bị duplicate
            $duplicateIds = [];
            foreach ($idCounts as $id => $count) {
                if ($count > 1) {
                    $duplicateIds[] = "ID {$id} xuất hiện {$count} lần";
                }
            }
            if (!empty($duplicateIds)) {
                $results['duplicate_ids_summary'] = $duplicateIds;
            }
            
            // Log chi tiết frame ID 153 nếu có
            $frame153Instances = [];
            foreach ($configArray['frames'] as $index => $frame) {
                if (isset($frame['id']) && $frame['id'] == 153) {
                    $frame153Instances[] = [
                        'index' => $index,
                        'frame' => $frame,
                        'has_id' => isset($frame['id']),
                        'has_name' => isset($frame['name']),
                        'has_path' => isset($frame['path']),
                        'was_added' => false
                    ];
                }
            }
            
            // Kiểm tra frame 153 có trong cleaned không
            if (!empty($frame153Instances)) {
                $frame153InCleaned = false;
                foreach ($cleanedFrames as $cleanedFrame) {
                    if ($cleanedFrame['id'] == 153) {
                        $frame153InCleaned = true;
                        break;
                    }
                }
                
                $results['frame_153_debug'] = [
                    'instances_found' => count($frame153Instances),
                    'instances' => $frame153Instances,
                    'in_cleaned' => $frame153InCleaned,
                    'cleaned_frames_count' => count($cleanedFrames),
                    'all_frame_ids_count' => count($frameIds),
                    'frame_153_in_ids' => in_array(153, $frameIds)
                ];
                
                // Nếu frame 153 không có trong cleaned, tìm lý do
                if (!$frame153InCleaned) {
                    $reason = 'Unknown';
                    foreach ($frame153Instances as $instance) {
                        if (!isset($instance['frame']['id']) || !isset($instance['frame']['name']) || !isset($instance['frame']['path'])) {
                            $reason = 'Thiếu thông tin (id, name, hoặc path)';
                            break;
                        }
                        // Kiểm tra xem có bị duplicate không
                        $idCount = 0;
                        foreach ($configArray['frames'] as $f) {
                            if (isset($f['id']) && $f['id'] == 153) {
                                $idCount++;
                            }
                        }
                        if ($idCount > 1) {
                            $reason = "Duplicate ID (có {$idCount} frame cùng ID 153)";
                        }
                    }
                    $results['frame_153_missing_reason'] = $reason;
                }
            }
            
            // Log các frame bị loại bỏ
            if (!empty($invalidFrames)) {
                $results['invalid_frames'] = $invalidFrames;
            }
            if (!empty($duplicates)) {
                $results['duplicate_frames'] = $duplicates;
            }
            
            // Lưu số lượng frame ban đầu
            $originalCount = count($configArray['frames']);
            
            // Cập nhật config với frames đã clean
            $configArray['frames'] = $cleanedFrames;
            $configData = json_encode($configArray, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
            
            $results['frames_count'] = count($cleanedFrames);
            $results['frames_removed'] = $originalCount - count($cleanedFrames);
            
            if ($results['frames_removed'] > 0) {
                $results['warning'] = "Đã loại bỏ {$results['frames_removed']} frame không hợp lệ hoặc trùng ID";
            }
        }
        
        // Ghi file mới
        $bytesWritten = file_put_contents($configPath, $configData, LOCK_EX);
        if ($bytesWritten === false) {
            throw new Exception('Không thể ghi file config.json. Kiểm tra quyền file.');
        }
        
        // Verify file sau khi ghi
        $verifyData = file_get_contents($configPath);
        $verifyArray = json_decode($verifyData, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('File đã ghi bị lỗi JSON. Vui lòng kiểm tra lại.');
        }
        
        $results['config'] = "Đã cập nhật config.json ({$results['frames_count']} frames, {$bytesWritten} bytes)";
        $results['verified'] = true;
    }

    // 2. Upload frame images
    if (isset($_FILES['frames']) && is_array($_FILES['frames']['name'])) {
        $frameDir = $baseDir . '/frame';
        
        // Tạo thư mục frame nếu chưa có
        if (!is_dir($frameDir)) {
            mkdir($frameDir, 0755, true);
        }

        $uploadedCount = 0;
        $totalFiles = count($_FILES['frames']['name']);

        for ($i = 0; $i < $totalFiles; $i++) {
            if ($_FILES['frames']['error'][$i] === UPLOAD_ERR_OK) {
                $fileName = $_FILES['frames']['name'][$i];
                $tmpName = $_FILES['frames']['tmp_name'][$i];
                $targetPath = $frameDir . '/' . basename($fileName);

                // Kiểm tra file type
                $fileType = strtolower(pathinfo($targetPath, PATHINFO_EXTENSION));
                $allowedTypes = ['png', 'jpg', 'jpeg', 'webp', 'gif'];
                
                if (in_array($fileType, $allowedTypes)) {
                    if (move_uploaded_file($tmpName, $targetPath)) {
                        $uploadedCount++;
                        $results['frames'][] = "Đã upload: $fileName";
                    } else {
                        $results['frames'][] = "Lỗi upload: $fileName";
                    }
                } else {
                    $results['frames'][] = "File không hợp lệ: $fileName";
                }
            }
        }

        $results['frames_summary'] = "Đã upload $uploadedCount/$totalFiles ảnh";
    }

    // Xóa output buffer để đảm bảo chỉ có JSON
    ob_end_clean();
    
    // 3. Chỉ upload config.json (không có ảnh)
    if (isset($_POST['config']) && (!isset($_FILES['frames']) || empty($_FILES['frames']['name']))) {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Đã cập nhật config.json thành công',
            'details' => $results
        ], JSON_UNESCAPED_UNICODE);
    } else {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => 'Đã cập nhật config.json và upload ảnh thành công',
            'details' => $results
        ], JSON_UNESCAPED_UNICODE);
    }

} catch (Exception $e) {
    ob_end_clean(); // Xóa output buffer nếu có lỗi
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Lỗi server: ' . $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ], JSON_UNESCAPED_UNICODE);
}
?>

