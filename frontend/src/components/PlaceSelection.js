import React from 'react';
import { useLocation } from 'react-router-dom';

const PlaceSelection = () => {
    const location = useLocation();
    const gifUrl = location.state?.gifUrl; // Access the passed URL

    console.log('GIF URL:', gifUrl); // Log the URL to check if it's correctly received

    return (
        <div>
            {gifUrl ? (
                <div>
                    <h2>Your Generated GIF:</h2>
                    <img src={gifUrl} alt="Generated GIF" style={{ maxWidth: '100%', height: 'auto' }} />
                </div>
            ) : (
                <p>GIF URL not provided or loading...</p>
            )}
        </div>
    );
};

export default PlaceSelection;
