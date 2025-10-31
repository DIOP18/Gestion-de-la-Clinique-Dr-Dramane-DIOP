<?php

namespace App\Http\Controllers;

use App\Models\Assistant;
use App\Models\Doctor;
use App\Models\Specialty;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    // Users
    public function usersIndex()
    {
        return response()->json(User::orderByDesc('id')->paginate(20));
    }

    public function usersShow(User $user)
    {
        return response()->json($user);
    }

    public function usersStore(Request $request)
    {
        $data = $request->validate([
            'first_name' => ['required','string','max:255'],
            'last_name' => ['required','string','max:255'],
            'email' => ['required','email','max:255','unique:users,email'],
            'password' => ['required','min:8'],
            'role' => ['required','in:ADMINISTRATEUR,MEDECIN,ASSISTANT,PATIENT'],
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
            'role' => $data['role'],
        ]);
        return response()->json($user, 201);
    }

    public function usersUpdate(Request $request, User $user)
    {
        $data = $request->validate([
            'first_name' => ['sometimes','string','max:255'],
            'last_name' => ['sometimes','string','max:255'],
            'email' => ['sometimes','email','max:255','unique:users,email,'.$user->id],
            'password' => ['nullable','min:8'],
            'role' => ['sometimes','in:ADMINISTRATEUR,MEDECIN,ASSISTANT,PATIENT'],
            'phone' => ['sometimes','string','max:30'],
            'is_blocked' => ['sometimes','boolean'],
            'address' => ['sometimes','string','max:255'],
            'description' => ['sometimes','string'],
            'gender' => ['sometimes','in:M,F,O'],
            'image' => ['sometimes','image','mimes:jpg,jpeg,png,webp','max:2048'],
        ]);
        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }
        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('users', 'public');
        }
        if (isset($data['first_name']) || isset($data['last_name'])) {
            $first = $data['first_name'] ?? $user->first_name;
            $last = $data['last_name'] ?? $user->last_name;
            $data['name'] = trim($first.' '.$last);
        }
        $user->update($data);
        return response()->json($user);
    }

    public function usersDestroy(User $user)
    {
        $user->delete();
        return response()->json(['message' => 'Supprimé']);
    }

    public function usersBlock(User $user)
    {
        $user->update(['is_blocked' => true]);
        return response()->json(['message' => 'Bloqué']);
    }

    public function usersUnblock(User $user)
    {
        $user->update(['is_blocked' => false]);
        return response()->json(['message' => 'Débloqué']);
    }

    // Specialties
    public function specialitesIndex()
    {
        return response()->json(Specialty::orderBy('label')->get());
    }

    public function specialitesStore(Request $request)
    {
        $data = $request->validate(['label' => ['required','string','max:255','unique:specialties,label']]);
        $specialty = Specialty::create($data);
        return response()->json($specialty, 201);
    }

    public function specialitesUpdate(Request $request, Specialty $specialty)
    {
        $data = $request->validate(['label' => ['required','string','max:255','unique:specialties,label,'.$specialty->id]]);
        $specialty->update($data);
        return response()->json($specialty);
    }

    public function specialitesDestroy(Specialty $specialty)
    {
        $specialty->delete();
        return response()->json(['message' => 'Supprimé']);
    }

    // Doctors
    public function medecinsIndex()
    {
        $items = Doctor::with(['user','specialty'])->orderByDesc('id')->paginate(20);
        return response()->json($items);
    }

    public function medecinsStore(Request $request)
    {
        $data = $request->validate([
            'first_name' => ['required','string','max:255'],
            'last_name' => ['required','string','max:255'],
            'email' => ['required','email','max:255','unique:users,email'],
            'password' => ['required','min:8'],
            'phone' => ['required','string','max:30'],
            'address' => ['required','string','max:255'],
            'description' => ['required','string'],
            'gender' => ['required','in:M,F,O'],
            'image' => ['required','image','mimes:jpg,jpeg,png,webp','max:2048'],
            'num_ordre' => ['required','string','max:100','unique:doctors,num_ordre'],
            'specialty_id' => ['required','exists:specialties,id'],
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
            'role' => 'MEDECIN',
        ]);
        $doctor = Doctor::create([
            'user_id' => $user->id,
            'num_ordre' => $data['num_ordre'],
            'specialty_id' => $data['specialty_id'],
        ]);
        return response()->json($doctor->load(['user','specialty']), 201);
    }

    // Assistants
    public function assistantsIndex()
    {
        $items = Assistant::with('user')->orderByDesc('id')->paginate(20);
        return response()->json($items);
    }

    public function assistantsStore(Request $request)
    {
        $data = $request->validate([
            'first_name' => ['required','string','max:255'],
            'last_name' => ['required','string','max:255'],
            'email' => ['required','email','max:255','unique:users,email'],
            'password' => ['required','min:8'],
            'phone' => ['required','string','max:30'],
            'address' => ['required','string','max:255'],
            'description' => ['required','string'],
            'gender' => ['required','in:M,F,O'],
            'image' => ['required','image','mimes:jpg,jpeg,png,webp','max:2048'],
            'num_employe' => ['required','string','max:100','unique:assistants,num_employe'],
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
            'role' => 'ASSISTANT',
        ]);
        $assistant = Assistant::create([
            'user_id' => $user->id,
            'num_employe' => $data['num_employe'],
        ]);
        return response()->json($assistant->load('user'), 201);
    }
}


