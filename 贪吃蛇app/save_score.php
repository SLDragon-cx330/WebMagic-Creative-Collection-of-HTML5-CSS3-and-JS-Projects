<?php
header('Content-Type: application/json');

$score = isset($_POST['score']) ? intval($_POST['score']) : 0;
$date = isset($_POST['date']) ? $_POST['date'] : date('Y-m-d H:i:s');

$scoresFile = 'scores.txt';
$scores = [];

// 读取现有分数
if (file_exists($scoresFile)) {
    $scores = array_map('trim', file($scoresFile));
    $scores = array_map(function($line) {
        return json_decode($line, true);
    }, $scores);
}

// 添加新分数
$scores[] = ['score' => $score, 'date' => $date];

// 按分数排序
usort($scores, function($a, $b) {
    return $b['score'] - $a['score'];
});

// 只保留前10名
$scores = array_slice($scores, 0, 10);

// 保存到文件
file_put_contents($scoresFile, implode("\n", array_map('json_encode', $scores)));

// 返回更新后的排行榜
echo json_encode(['success' => true, 'scores' => $scores]);
?> 