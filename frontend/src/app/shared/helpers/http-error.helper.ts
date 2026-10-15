import { HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';

// Picks the message to show the user: the API's own message, or a plain explanation when it cannot be reached.
export function errorMessageOf(error: HttpErrorResponse): string {
    if (error.status === 0) {
        return 'Cannot reach the server. Is the backend running?';
    }

    const apiMessage = (error.error as { message?: unknown } | null)?.message;
    return typeof apiMessage === 'string' ? apiMessage : 'Something went wrong. Please try again.';
}

// For catchError: turns an HTTP failure into an Error whose message is ready to show.
export const failWithMessage = (error: HttpErrorResponse) => throwError(() => new Error(errorMessageOf(error)));
