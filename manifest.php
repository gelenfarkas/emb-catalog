<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$root = __DIR__ . DIRECTORY_SEPARATOR . 'data';
$datasets = [];

if (is_dir($root)) {
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($root, FilesystemIterator::SKIP_DOTS)
    );

    foreach ($iterator as $file) {
        if (!$file->isFile() || strtolower($file->getExtension()) !== 'json') {
            continue;
        }

        $relative = str_replace('\\', '/', substr($file->getPathname(), strlen(__DIR__) + 1));
        if ($relative === 'data/manifest.json') {
            continue;
        }

        $parts = explode('/', $relative);
        $folder = $parts[1] ?? 'egyeb';

        $datasets[] = [
            'path' => $relative,
            'category' => categoryLabel($folder),
            'label' => categoryLabel($folder) . ' / ' . $file->getBasename('.json'),
        ];
    }
}

usort($datasets, static fn($a, $b) => strcmp($a['path'], $b['path']));

echo json_encode(['datasets' => $datasets], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

function categoryLabel(string $folder): string
{
    $map = [
        'cipo' => 'Cipő',
        'cipok' => 'Cipő',
        'zokni' => 'Zokni',
        'taska' => 'Táska',
    ];

    $key = strtolower(trim($folder));
    return $map[$key] ?? ucfirst(str_replace(['-', '_'], ' ', $key));
}
