<?php

return [
    'default' => env('FILESYSTEM_DISK', 'local'),
    'disks' => [
        'local' => [
            'driver' => 'local',
            'root' => storage_path('app/private'),
            'serve' => true,
            'throw' => false,
        ],
        'public' => [
            'driver' => 'local',
            'root' => storage_path('app/public'),
            'url' => env('APP_URL', 'http://localhost').'/storage',
            'visibility' => 'public',
            'throw' => false,
        ],
        // বিজ্ঞাপনের ছবি সরাসরি public/uploads এ জমা হয় — storage:link লাগে না
        // (FileZilla-only হোস্টিংয়ে symlink বানানো যায় না, তাই এই ব্যবস্থা)
        'uploads' => [
            'driver' => 'local',
            'root' => public_path('uploads'),
            'visibility' => 'public',
            'throw' => false,
        ],
    ],
    'links' => [
        public_path('storage') => storage_path('app/public'),
    ],
];
