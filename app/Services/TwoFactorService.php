<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Str;

/**
 * Two-Factor Authentication service stub (TOTP based).
 * Intended to be implemented with pragmarx/google2fa or similar.
 */
class TwoFactorService
{
    public function enableFor(User $user): array
    {
        $secret = $this->generateBase32Secret(32);
        $recoveryCodes = $this->generateRecoveryCodes();
        $user->two_factor_secret = $secret;
        $user->two_factor_recovery_codes = json_encode($recoveryCodes);
        $user->save();

        $label = rawurlencode(config('app.name').' ('.$user->email.')');
        $otpauth = 'otpauth://totp/'.$label.'?secret='.$secret.'&issuer='.rawurlencode(config('app.name')).'&period=30&digits=6&algorithm=SHA1';

        return [
            'secret' => $secret,
            'otpauth_url' => $otpauth,
            'recovery_codes' => $recoveryCodes,
        ];
    }

    public function disableFor(User $user): void
    {
        $user->two_factor_secret = null;
        $user->two_factor_recovery_codes = null;
        $user->save();
    }

    public function verify(User $user, string $code): bool
    {
        $code = trim($code);
        if ($code === '') return false;

        // Try recovery codes first
        if ($this->consumeRecoveryCodeIfValid($user, $code)) {
            return true;
        }

        $secret = $user->two_factor_secret;
        if (!$secret) return false;

        // Allow small time drift: previous, current, next window
        $time = time();
        foreach ([-1, 0, 1] as $offset) {
            if ($this->totp($secret, 30, 6, $time + ($offset * 30)) === $code) {
                return true;
            }
        }
        return false;
    }

    protected function consumeRecoveryCodeIfValid(User $user, string $code): bool
    {
        if (!$user->two_factor_recovery_codes) return false;
        $codes = json_decode($user->two_factor_recovery_codes, true) ?: [];
        $index = array_search($code, $codes, true);
        if ($index === false) return false;
        unset($codes[$index]);
        $user->two_factor_recovery_codes = json_encode(array_values($codes));
        $user->save();
        return true;
    }

    protected function generateBase32Secret(int $length = 32): string
    {
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $secret = '';
        for ($i = 0; $i < $length; $i++) {
            $secret .= $alphabet[random_int(0, strlen($alphabet) - 1)];
        }
        return $secret;
    }

    protected function generateRecoveryCodes(int $count = 8): array
    {
        $codes = [];
        for ($i = 0; $i < $count; $i++) {
            $codes[] = Str::upper(Str::random(4)).'-'.Str::upper(Str::random(4)).'-'.Str::upper(Str::random(4));
        }
        return $codes;
    }

    protected function base32Decode(string $b32): string
    {
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        $b32 = strtoupper($b32);
        $buffer = 0;
        $bitsLeft = 0;
        $result = '';
        for ($i = 0, $len = strlen($b32); $i < $len; $i++) {
            $val = strpos($alphabet, $b32[$i]);
            if ($val === false) continue;
            $buffer = ($buffer << 5) | $val;
            $bitsLeft += 5;
            if ($bitsLeft >= 8) {
                $bitsLeft -= 8;
                $result .= chr(($buffer >> $bitsLeft) & 0xFF);
            }
        }
        return $result;
    }

    protected function hotp(string $secretB32, int $counter, int $digits = 6): string
    {
        $secret = $this->base32Decode($secretB32);
        $binCounter = pack('N*', 0) . pack('N*', $counter);
        $hash = hash_hmac('sha1', $binCounter, $secret, true);
        $offset = ord($hash[19]) & 0x0F;
        $code = ((ord($hash[$offset]) & 0x7F) << 24) |
            ((ord($hash[$offset + 1]) & 0xFF) << 16) |
            ((ord($hash[$offset + 2]) & 0xFF) << 8) |
            (ord($hash[$offset + 3]) & 0xFF);
        $code = $code % (10 ** $digits);
        return str_pad((string)$code, $digits, '0', STR_PAD_LEFT);
    }

    protected function totp(string $secretB32, int $period = 30, int $digits = 6, ?int $time = null): string
    {
        $time = $time ?? time();
        $counter = (int) floor($time / $period);
        return $this->hotp($secretB32, $counter, $digits);
    }
}


