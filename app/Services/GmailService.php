<?php

namespace App\Services;

/**
 * Gmail API service stub.
 * Requires composer package: google/apiclient:^2.0 and OAuth credentials.
 */
class GmailService
{
    public function __construct()
    {
        // TODO: initialize Google_Client with credentials from storage and tokens
    }

    /**
     * Send a simple email via Gmail API.
     * This is a stub. Implement with Google\Service\Gmail when dependencies are installed.
     */
    public function sendEmail(string $to, string $subject, string $htmlBody): void
    {
        // Implement using Google Gmail API after installing google/apiclient
    }
}


