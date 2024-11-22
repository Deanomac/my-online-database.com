// errorManager.js
export const ErrorManager = {
    showError(message, error) {
        console.error(message, error);
        alert(`${message} ${error.message}`);
    },
};
