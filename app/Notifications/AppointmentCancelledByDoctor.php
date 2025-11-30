<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Appointment;

class AppointmentCancelledByDoctor extends Notification
{
    use Queueable;

    protected $appointment;
    protected $reason;

    public function __construct(Appointment $appointment, $reason = null)
    {
        $this->appointment = $appointment;
        $this->reason = $reason;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        $appointment = $this->appointment;
        $doctor = $appointment->doctor;

        $mail = (new MailMessage)
            ->subject(' Rendez-vous annulé')
            ->greeting('Bonjour ' . $notifiable->name . ',')
            ->line('Nous sommes désolés de vous informer que votre rendez-vous a été annulé par le médecin.')
            ->line('**Détails du rendez-vous annulé :**')
            ->line(' Médecin : Dr ' . $doctor->user->name)
            ->line(' Date : ' . $appointment->debut_at->format('d/m/Y'))
            ->line('Heure : ' . $appointment->debut_at->format('H:i'))
            ->line(' Motif initial : ' . $appointment->motif);

        if ($this->reason) {
            $mail->line('**Raison de l\'annulation :** ' . $this->reason);
        }

        $mail->line('Vous pouvez prendre un nouveau rendez-vous à tout moment.')
            ->action('Prendre un nouveau rendez-vous', config('app.frontend_url') . '/patient/prendre-rendez-vous')
            ->line('Nous nous excusons pour ce désagrément.')
            ->salutation('Cordialement, L\'équipe de la Clinique Dr DRAMANE DIOP');

        return $mail;
    }
}
