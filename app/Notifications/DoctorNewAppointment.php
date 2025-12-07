<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Appointment;

class DoctorNewAppointment extends Notification
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
            ->subject('Nouveau rendez-vous à confirmer')
            ->greeting('Bonjour Dr ' . $notifiable->name . ',')
            ->line('Un nouveau rendez-vous a été pris et nécessite votre confirmation.')
            ->line('**Détails du rendez-vous :**')
            ->line(' Patient : ' . $patient->user->name)
            ->line(' Contact : ' . ($patient->user->phone ?? 'Non renseigné'))
            ->line(' Date : ' . $appointment->debut_at->format('d/m/Y'))
            ->line(' Heure : ' . $appointment->debut_at->format('H:i') . ' - ' . $appointment->fin_at->format('H:i'))
            ->line(' Motif : ' . $appointment->motif)
            ->line(' Prix : ' . number_format($appointment->prix, 0, ',', ' ') . ' FCFA')
            ->line('Statut : **' . $appointment->statut . '**')
            ->action('Voir le rendez-vous', config('app.frontend_url') . '/medecin/mes-rendez-vous')
            ->line('Veuillez confirmer ou annuler ce rendez-vous dans les plus brefs délais.')
            ->salutation('Cordialement, L\'équipe de la Clinique Dr DRAMANE DIOP');
    }
}
