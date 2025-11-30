<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\Appointment;
use App\Models\Invoice;

class PaymentSuccessful extends Notification
{
    use Queueable;

    protected $appointment;
    protected $invoice;

    public function __construct(Appointment $appointment, Invoice $invoice = null)
    {
        $this->appointment = $appointment;
        $this->invoice = $invoice;
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
            ->subject(' Paiement confirmé - Facture disponible')
            ->greeting('Bonjour ' . $notifiable->name . ',')
            ->line('Votre paiement a été confirmé avec succès veuillez télecharger votre facture !')
            ->line('**Détails de votre rendez-vous :**')
            ->line('️  Médecin : Dr ' . $doctor->user->name)
            ->line(' Date : ' . $appointment->debut_at->format('d/m/Y'))
            ->line(' Heure : ' . $appointment->debut_at->format('H:i'))
            ->line(' Montant payé : ' . number_format($appointment->prix, 0, ',', ' ') . ' FCFA')
            ->line(' Mode de paiement : ' . $appointment->paye_par);

        if ($this->invoice) {
            $mail->line('')
                ->line(' **Facture N° ' . $this->invoice->invoice_number . '**')
                ->action('Télécharger ma facture', config('app.frontend_url') . '/patient/mes-rendez-vous')
                ->line(' Veuillez imprimer et apporter cette facture le jour de votre rendez-vous.');
        }

        $mail->line('')
            ->line('**Rappel important :**')
            ->line('• Arrivez 10 minutes avant l\'heure de votre rendez-vous')
            ->line('• Apportez votre facture et votre carte d\'identité')
            ->line('• En cas d\'empêchement, appelez l\'assistante pour une reprogrammation du rendez-vous 785293632')
            ->line('Nous avons hâte de vous accueillir !')
            ->salutation('Cordialement, L\'équipe de la Clinique Dr DRAMANE DIOP');

        return $mail;
    }
}
