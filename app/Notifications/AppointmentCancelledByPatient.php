<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Appointment;

class AppointmentCancelledByPatient extends Notification
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
        $patient = $appointment->patient;

        return (new MailMessage)
            ->subject('Rendez-vous annulé par le patient')
            ->greeting('Bonjour Dr ' . $notifiable->name . ',')
            ->line('Un patient a annulé son rendez-vous.')
            ->line('**Détails du rendez-vous annulé :**')
            ->line('Patient : ' . $patient->user->name)
            ->line('Contact : ' . ($patient->user->phone ?? 'Non renseigné'))
            ->line('Date : ' . $appointment->debut_at->format('d/m/Y'))
            ->line('Heure : ' . $appointment->debut_at->format('H:i') . ' - ' . $appointment->fin_at->format('H:i'))
            ->line('Motif : ' . $appointment->motif)
            ->line('Prix : ' . number_format($appointment->prix, 0, ',', ' ') . ' FCFA')
            ->line('')
            ->line('ℹCe créneau horaire est maintenant disponible pour d\'autres patients.')
            ->action('Voir mon agenda', config('app.frontend_url') . '/medecin/mes-rendez-vous')
            ->salutation('Cordialement, DR DRAMANE DIOP');
    }
}
