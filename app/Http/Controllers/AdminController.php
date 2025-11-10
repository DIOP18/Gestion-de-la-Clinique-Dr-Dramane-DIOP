<?php

namespace App\Http\Controllers;

use App\Models\Assistant;
use App\Models\Doctor;
use App\Models\Specialty;
use App\Models\SystemCounter;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AdminController extends Controller
{
    // Users
    public function usersIndex(Request $request) {
        // Exclure l'utilisateur connecté
        $users = User::where('id', '!=', $request->user()->id)
            ->orderByDesc('id')
            ->paginate(20);
        return response()->json($users);
    }

    public function usersShow(User $user)
    {
        return response()->json($user);
    }
    private function getNextOrdreNumber(): string {
        DB::beginTransaction();
        try {
            $counter = SystemCounter::firstOrCreate(
                ['type' => 'doctor_ordre'],
                ['last_number' => 0]
            );
            $counter->increment('last_number');
            $number = str_pad($counter->last_number, 6, '0', STR_PAD_LEFT);
            DB::commit();
            return "ORD-{$number}";
        } catch (\Exception $e) {
            DB::rollback();
            throw $e;
        }
    }

    private function getNextEmployeNumber(): string {
        DB::beginTransaction();
        try {
            $counter = SystemCounter::firstOrCreate(
                ['type' => 'assistant_employe'],
                ['last_number' => 0]
            );
            $counter->increment('last_number');
            $number = str_pad($counter->last_number, 6, '0', STR_PAD_LEFT);
            DB::commit();
            return "EMP-{$number}";
        } catch (\Exception $e) {
            DB::rollback();
            throw $e;
        }
    }


    public function usersStore(Request $request) {
        $data = $request->validate([
            'first_name' => ['required','string','max:255'],
            'last_name' => ['required','string','max:255'],
            'email' => ['required','email','max:255','unique:users,email'],
            'password' => ['required','min:8'],
            'role' => ['required','in:ADMINISTRATEUR,MEDECIN,ASSISTANT'],
            'phone' => ['required','string','max:30','unique:users,phone'],
            'address' => ['required','string','max:255'],
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
            'gender' => $data['gender'],
            'password' => Hash::make($data['password']),
            'role' => $data['role'],
        ]);

        return response()->json($user, 201);
    }


    public function usersUpdate(Request $request, User $user) {
        $data = $request->validate([
            'first_name' => ['sometimes','string','max:255'],
            'last_name' => ['sometimes','string','max:255'],
            'email' => ['sometimes','email','max:255','unique:users,email,'.$user->id],
            'password' => ['nullable','min:8'],
            'role' => ['sometimes','in:ADMINISTRATEUR,MEDECIN,ASSISTANT'],
            'phone' => ['sometimes','string','max:30','unique:users,phone,'.$user->id],
            'address' => ['sometimes','string','max:255'],
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


    public function usersDestroy(User $user, Request $request) {
        // Empêcher la suppression de soi-même
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Vous ne pouvez pas vous supprimer vous-même'], 403);
        }

        $user->delete();
        return response()->json(['message' => 'Utilisateur supprimé avec succès', 'success' => true]);
    }

    public function usersBlock(User $user)
    {
        try {
            $user->is_blocked = 1;
            $user->save();

            return response()->json([
                'message' => 'Utilisateur bloqué avec succès',
                'success' => true,
                'user' => $user->fresh(), // renvoie l'utilisateur mis à jour
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors du blocage : ' . $e->getMessage(),
                'success' => false,
            ], 500);
        }
    }

    public function usersUnblock(User $user)
    {
        try {
            $user->is_blocked = 0;
            $user->save();

            return response()->json([
                'message' => 'Utilisateur débloqué avec succès',
                'success' => true,
                'user' => $user->fresh(),
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Erreur lors du déblocage : ' . $e->getMessage(),
                'success' => false,
            ], 500);
        }
    }


    // Specialties
    public function specialitesIndex()
    {
        return response()->json(Specialty::orderBy('label')->get());
    }

    public function specialitesStore(Request $request)
    {
        $data = $request->validate([
            'label' => ['required','string','max:255','unique:specialties,label'],
            'prix' => ['required', 'numeric', 'min:0'],
        ]);

        $specialty = Specialty::create($data);
        return response()->json($specialty, 201);
    }

    public function specialitesUpdate(Request $request, Specialty $specialty)
    {
        $data = $request->validate([
            'label' => ['required','string','max:255','unique:specialties,label,'.$specialty->id],
            'prix' => ['required', 'numeric', 'min:0'],
        ]);

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

    public function medecinsStore(Request $request) {
        $data = $request->validate([
            'first_name' => ['required','string','max:255'],
            'last_name' => ['required','string','max:255'],
            'email' => ['required','email','max:255','unique:users,email'],
            'password' => ['required','min:8'],
            'phone' => ['required','string','max:30','unique:users,phone'],
            'address' => ['required','string','max:255'],
            'gender' => ['required','in:M,F,O'],
            'image' => ['required','image','mimes:jpg,jpeg,png,webp','max:2048'],
            'specialty_id' => ['required','exists:specialties,id'],
            'description' => ['required','string'],
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
            'gender' => $data['gender'],
            'password' => Hash::make($data['password']),
            'role' => 'MEDECIN',
        ]);

        $doctor = Doctor::create([
            'user_id' => $user->id,
            'num_ordre' => $this->getNextOrdreNumber(),
            'specialty_id' => $data['specialty_id'],
            'description' => $data['description'],
        ]);

        return response()->json($doctor->load(['user','specialty']), 201);
    }

    // Assistants
    public function assistantsIndex()
    {
        $items = Assistant::with('user')->orderByDesc('id')->paginate(20);
        return response()->json($items);
    }

    public function assistantsStore(Request $request) {
        $data = $request->validate([
            'first_name' => ['required','string','max:255'],
            'last_name' => ['required','string','max:255'],
            'email' => ['required','email','max:255','unique:users,email'],
            'password' => ['required','min:8'],
            'phone' => ['required','string','max:30','unique:users,phone'],
            'address' => ['required','string','max:255'],
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
            'gender' => $data['gender'],
            'password' => Hash::make($data['password']),
            'role' => 'ASSISTANT',
        ]);

        $assistant = Assistant::create([
            'user_id' => $user->id,
            'num_employe' => $this->getNextEmployeNumber(),
        ]);

        return response()->json($assistant->load('user'), 201);
    }
}


