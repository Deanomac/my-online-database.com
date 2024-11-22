// fileHandler.js
export const FileHandler = {
    async getDataFromSource(source) {
        // Handle File objects
        if (source instanceof File) {
            return await source.text();
        }
        
        // Handle string data (including pasted content)
        if (typeof source === 'string') {
            return source;
        }

        // Handle FormData
        if (source instanceof FormData) {
            const file = source.get('file');
            if (file instanceof File) {
                return await file.text();
            }
        }

        // Handle URL strings for Google Sheets
        if (typeof source === 'string' && source.includes('docs.google.com')) {
            // Return the URL as-is for Google Sheets handler
            return source;
        }

        throw new Error('Unsupported data source');
    },

    isValidFileType(file, acceptedTypes) {
        if (!file) return false;
        if (!(file instanceof File)) return true; // Non-file sources are handled separately
        
        const fileType = file.type.toLowerCase();
        return acceptedTypes.some(type => {
            if (type.startsWith('.')) {
                // Check file extension
                return file.name.toLowerCase().endsWith(type);
            }
            // Check MIME type
            return fileType === type;
        });
    },

    getSafeFileName(filename) {
        return filename.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
    }
};

export const withErrorHandling = (fn) => {
    return async (...args) => {
        try {
            return await fn(...args);
        } catch (error) {
            console.error('File handling error:', error);
            throw new Error(`Failed to process file: ${error.message}`);
        }
    };
};