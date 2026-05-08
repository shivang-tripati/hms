/**
 * Fetches the current geographic location of the user.
 * 
 * @returns A promise that resolves to an object containing latitude and longitude,
 *          or rejects with an Error if geolocation fails or is not supported.
 */
export const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
        if (typeof navigator === "undefined" || !navigator.geolocation) {
            reject(new Error("Geolocation is not supported by your browser"));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            (error) => {
                reject(new Error(error.message));
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    });
};

/**
 * Fetches a human-readable address from coordinates using Nominatim API.
 * 
 * @param latitude The latitude coordinate
 * @param longitude The longitude coordinate
 * @returns A promise that resolves to the formatted address string or null if it fails
 */
export const getAddressFromCoordinates = async (latitude: number, longitude: number): Promise<string | null> => {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
        if (!response.ok) return null;
        
        const data = await response.json();
        return data.display_name || null;
    } catch (error) {
        console.error("Reverse geocoding failed", error);
        return null;
    }
};
