<?php

namespace App\Http\Controllers;

use App\Services\TwoFactorService;
use Illuminate\Http\Request;

class TwoFactorController extends Controller
{
    public function __construct(private TwoFactorService $service) {}

    public function enable(Request $request)
    {
        $data = $this->service->enableFor($request->user());
        return response()->json([
            'message' => '2FA activée. Scannez le QR et sauvegardez vos codes.',
            'secret' => $data['secret'],
            'otpauth_url' => $data['otpauth_url'],
            'recovery_codes' => $data['recovery_codes'],
        ]);
    }

    public function verify(Request $request)
    {
        $payload = $request->validate([
            'code' => ['required','string'],
        ]);
        $valid = $this->service->verify($request->user(), $payload['code']);
        if (!$valid) {
            return response()->json(['message' => 'Code 2FA invalide'], 422);
        }
        return response()->json(['message' => 'Code 2FA valide']);
    }

    public function disable(Request $request)
    {
        $this->service->disableFor($request->user());
        return response()->json(['message' => '2FA désactivée']);
    }
}


