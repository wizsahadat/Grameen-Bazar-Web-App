<?php

// ফ্রন্টএন্ড আলাদা ডোমেইন/পোর্টে চললে এই কনফিগ দিয়ে API অ্যাক্সেস অনুমতি দেওয়া হয়
return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => array_filter(array_map('trim', explode(',', env('CORS_ALLOWED_ORIGINS', '*')))),
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => false,
];
