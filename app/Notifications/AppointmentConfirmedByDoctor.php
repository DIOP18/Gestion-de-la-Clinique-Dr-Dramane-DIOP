<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Appointment;

class AppointmentConfirmedByDoctor extends Notification
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
            ->subject('Rendez-vous confirmé - Paiement requis')
            ->greeting('Bonjour ' . $notifiable->name . ',')
            ->line('Bonne nouvelle ! Votre rendez-vous a été confirmé par Dr ' . $doctor->user->name . '.')
            ->line('**Détails du rendez-vous :**')
            ->line(' Médecin : Dr ' . $doctor->user->name)
            ->line(' Spécialité : ' . ($doctor->specialty->label ?? 'Non spécifié'))
            ->line(' Date : ' . $appointment->debut_at->format('d/m/Y'))
            ->line(' Heure : ' . $appointment->debut_at->format('H:i'))
            ->line(' Motif : ' . $appointment->motif)
            ->line('Montant à payer : ' . number_format($appointment->prix, 0, ',', ' ') . ' FCFA')
            ->line('')
            ->line(' **Action requise :**')
            ->line('Pour finaliser votre rendez-vous, vous devez effectuer le paiement et télécharger votre facture.')
            ->action('Payer maintenant', config('app.frontend_url') . '/patient/mes-rendez-vous')
            ->line('Après paiement, vous pourrez télécharger votre facture que vous devrez présenter le jour de votre rendez-vous.')
            ->line('Merci de votre confiance !')
            ->salutation('Cordialement, L\'équipe de la Clinique Dr DRAMANE DIOP');
    }
}
