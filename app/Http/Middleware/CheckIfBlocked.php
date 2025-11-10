<?php
// app/Http/Middleware/CheckIfBlocked.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckIfBlocked
{
    public function handle(Request $request, Closure $next)
    {
        if ($request->user() && $request->user()->is_blocked == 1) {
            auth('sanctum')->logout();
            return response()->json(['message' => 'Votre compte a été bloqué par un administrateur'], 403);
        }

        return $next($request);
    }
}
