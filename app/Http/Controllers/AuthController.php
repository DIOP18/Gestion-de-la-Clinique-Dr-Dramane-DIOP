<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'first_name' => ['required','string','max:255'],
            'last_name' => ['required','string','max:255'],
            'email' => ['required','email','max:255','unique:users,email'],
            'password' => ['required', Password::min(8)],
            'phone' => ['required','string','max:30'],
            'address' => ['required','string','max:255'],
            'description' => ['required','string'],
            'gender' => ['required','in:M,F,O'],
            'image' => ['required','image','mimes:jpg,jpeg,png,webp','max:2048'],
        ]);

        $imagePath = $request->file('image')->store('users', 'public');

        $user = User::create([
            'name' => $data['first_name'].' '.$data['last_name'],
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'email' => $data['email'],
            'phone' => $data['phone'],
            'address' => $data['address'],
            'image' => $imagePath,
            'description' => $data['description'],
            'gender' => $data['gender'],
            'password' => Hash::make($data['password']),
            'role' => 'PATIENT',
        ]);

        $token = $user->createToken('api')->plainTextToken;
        return response()->json(['user' => $user, 'token' => $token], 201);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required','email'],
            'password' => ['required'],
            
        ]);

        $user = User::where('email', $credentials['email'])->first();
        if (!$user || !Hash::check($credentials['password'], $user->password)) {
            return response()->json(['message' => 'Identifiants invalides'], 422);
        }
        if ($user->is_blocked) {
            return response()->json(['message' => 'Compte bloqué'], 403);
        }
        // 2FA required if secret exists
        if ($user->two_factor_secret) {
            $code = $credentials['two_factor_code'] ?? null;
            $recovery = $credentials['two_factor_recovery_code'] ?? null;
            $twoFactorOk = false;
            if ($code) {
                $twoFactorOk = app(\App\Services\TwoFactorService::class)->verify($user, $code);
            } elseif ($recovery) {
                $twoFactorOk = app(\App\Services\TwoFactorService::class)->verify($user, $recovery);
            }
            if (!$twoFactorOk) {
                return response()->json(['message' => 'Code 2FA requis ou invalide', 'two_factor_required' => true], 401);
            }
        }

        $token = $user->createToken('api')->plainTextToken;
        return response()->json([
            'message' => 'Connecté avec succès',
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Déconnecté avec succès']);
    }
}


