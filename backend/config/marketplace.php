<?php

return [
    // .env এর ADS_AUTO_APPROVE; পরে অ্যাডমিন প্যানেলের সেটিংস থেকেও বদলানো যাবে
    'auto_approve' => (bool) env('ADS_AUTO_APPROVE', true),
    'max_images' => 5,
    'max_image_kb' => 3072,
];
