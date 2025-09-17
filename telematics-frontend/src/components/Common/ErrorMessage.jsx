import React from 'react';
import { AlertCircle } from 'lucide-react';

function ErrorMessage({ message, onRetry }) {
    return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600" />
                <div className="flex-1">
                    <p className="text-red-700">{message}</p>
                    {onRetry && (
                        <button
                            onClick={onRetry}
                            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                        >
                            Try Again
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ErrorMessage;
