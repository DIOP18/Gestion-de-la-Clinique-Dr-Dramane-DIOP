<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    /**
     * Retourner le profil de l'utilisateur connecté
     */
    public function me(Request $request)
    {
        return response()->json($request->user()->load('doctor', 'assistant', 'patient'));
    }

    /**
     * Modifier les informations du profil
     */
    public function update(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'first_name' => 'sometimes|string|max:255',
            'last_name'  => 'sometimes|string|max:255',
            'phone'      => 'sometimes|string|max:30|unique:users,phone,' . $user->id,
            'address'    => 'sometimes|string|max:255',
            'gender'     => 'sometimes|in:M,F,O',
        ]);

        $user->update($data);

        // Mettre à jour champs "name" automatiquement
        if (isset($data['first_name']) || isset($data['last_name'])) {
            $user->name = trim(($data['first_name'] ?? $user->first_name) . ' ' . ($data['last_name'] ?? $user->last_name));
            $user->save();
        }

        return response()->json($user);
    }

    /**
     * Modifier la photo de profil
     */
    public function updateAvatar(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'image' => 'required|image|mimes:jpg,jpeg,png,webp|max:2048',
        ]);


        $path = $request->file('image')->store('users', 'public');

        $user->image = $path;
        $user->save();

        return response()->json([
            'message' => 'Photo de profil mise à jour',
            'image' => $path
        ]);
    }

    /**
     * Modifier le mot de passe
     */
    public function updatePassword(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'current_password' => 'required',
            'new_password'     => 'required|min:8',
        ]);

        if (!Hash::check($data['current_password'], $user->password)) {
            return response()->json(['message' => 'Mot de passe actuel incorrect'], 422);
        }

        $user->password = Hash::make($data['new_password']);
        $user->save();

        return response()->json(['message' => 'Mot de passe mis à jour']);
    }
}
