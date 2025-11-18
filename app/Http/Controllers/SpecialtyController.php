<?php

namespace App\Http\Controllers;

use App\Models\Specialty;
use Illuminate\Http\Request;

class SpecialtyController extends Controller
{
    public function index()
    {
        $specialties = Specialty::select('id', 'label', 'prix')->get();
        return response()->json($specialties);
    }
    public function specialitesIndexass()
    {
        return response()->json(Specialty::orderBy('label')->get());
    }
}
