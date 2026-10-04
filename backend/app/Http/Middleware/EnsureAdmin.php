<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

// শুধু অ্যাডমিন রোলের ইউজার ঢুকতে পারবে (অ্যাডমিন প্যানেলের API তে ব্যবহার হবে)
class EnsureAdmin
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->isAdmin()) {
            return response()->json(['message' => 'এই কাজের অনুমতি আপনার নেই।'], 403);
        }

        return $next($request);
    }
}
