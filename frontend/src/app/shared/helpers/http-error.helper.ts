import { HttpErrorResponse } from '@angular/common/http';

// Picks the message to show the user: the API's own message, or a plain explanation when it cannot be reached.
export function errorMessageOf(error: HttpErrorResponse): string {
    if (error.status === 0) {
        return 'Cannot reach the server. Is the backend running?';
    }

    const apiMessage = (error.error as { message?: unknown } | null)?.message;
    return typeof apiMessage === 'string' ? apiMessage : 'Something went wrong. Please try again.';
}
