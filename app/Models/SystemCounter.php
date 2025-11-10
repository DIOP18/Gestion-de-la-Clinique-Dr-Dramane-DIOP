<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SystemCounter extends Model
{
    protected $fillable = ['type', 'last_number'];

}
