<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Appointment;
use Carbon\Carbon;

class AppointmentRescheduled extends Notification
{
    use Queueable;

    protected $appointment;
    protected $oldDate;
    protected $oldTimeStart;
    protected $oldTimeEnd;
    protected $rescheduledBy;
    protected $reason;

    public function __construct(
        Appointment $appointment,
                    $oldDate,
                    $oldTimeStart,
                    $oldTimeEnd,
                    $rescheduledBy,
                    $reason = null
    ) {
        $this->appointment = $appointment;
        $this->oldDate = $oldDate;
        $this->oldTimeStart = $oldTimeStart;
        $this->oldTimeEnd = $oldTimeEnd;
        $this->rescheduledBy = $rescheduledBy;
        $this->reason = $reason;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        $appointment = $this->appointment;

        $mail = (new MailMessage)
            ->subject('🔄 Rendez-vous reprogrammé')
            ->greeting('Bonjour ' . $notifiable->name . ',')
            ->line('Votre rendez-vous a été reprogrammé par ' . $this->rescheduledBy . '.');

        if ($this->reason) {
            $mail->line('**Raison :** ' . $this->reason);
        }

        $mail->line('')
            ->line('**Ancien rendez-vous :**')
            ->line(' Date : ' . Carbon::parse($this->oldDate)->format('d/m/Y'))
            ->line(' Horaire : ' . $this->oldTimeStart . ' - ' . $this->oldTimeEnd)
            ->line('')
            ->line('**Nouveau rendez-vous :**')
            ->line(' Date : ' . $appointment->debut_at->format('d/m/Y'))
            ->line(' Horaire : ' . $appointment->debut_at->format('H:i') . ' - ' . $appointment->fin_at->format('H:i'))
            ->line(' Médecin : Dr ' . $appointment->doctor->user->name)
            ->line('Spécialité : ' . ($appointment->doctor->specialty->label ?? 'Non spécifié'));

        if ($appointment->est_paye) {
            $mail->line('')
                ->line(' Votre paiement a été transféré vers le nouveau rendez-vous.');
        }

        return $mail->line('Merci de votre compréhension.')
            ->salutation('Cordialement, L\'équipe de la Clinique Dr DRAMANE DIOP');
    }
}
