<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Appointment;

class AppointmentCreated extends Notification
{
    use Queueable;

    protected $appointment;

    public function __construct(Appointment $appointment)
    {
        $this->appointment = $appointment;
    }

    public function via($notifiable)
    {
        return ['mail'];
    }

    public function toMail($notifiable)
    {
        $appointment = $this->appointment;
        $doctor = $appointment->doctor;

        return (new MailMessage)
            ->subject('Confirmation de votre prise de rendez-vous')
            ->greeting('Bonjour ' . $notifiable->name . ',')
            ->line('Votre rendez-vous a été prise avec succès vous serez notifier si le médecin confirme votre rendez-vous.')
            ->line('**Détails du rendez-vous :**')
            ->line(' Médecin : Dr ' . $doctor->user->name)
            ->line('Date : ' . $appointment->debut_at->format('d/m/Y'))
            ->line(' Heure : ' . $appointment->debut_at->format('H:i'))
            ->line(' Motif : ' . $appointment->motif)
            ->line(' Prix : ' . number_format($appointment->prix, 0, ',', ' ') . ' FCFA')
            ->action('Voir mes rendez-vous', config('app.frontend_url') . '/patient/mes-rendez-vous')
            ->line('Merci de votre confiance !')
            ->salutation('Cordialement, L\'équipe de la Clinique Dr DRAMANE DIOP');
    }
}
