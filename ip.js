document.addEventListener('DOMContentLoaded', function() {
    const ipInput = document.getElementById('ipInput');
    const connectBtn = document.getElementById('connectBtn');

    // Load previously saved IP when page loads
    function loadSavedIP() {
        try {
            const savedIP = localStorage.getItem('serverIP');
            if (savedIP) {
                ipInput.value = savedIP;
                // Pre-select the text so user can easily replace it if needed
                ipInput.select();
                return;
            }
        } catch (error) {
            console.log('Could not access localStorage:', error);
        }

        // Fallback: check if there's an IP in the URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const urlIP = urlParams.get('ip');
        if (urlIP) {
            ipInput.value = urlIP;
            ipInput.select();
            return;
        }

        // If no saved IP, focus on the input for immediate typing
        ipInput.focus();
    }

    function isValidIP(ip) {
        // IPv4 validation
        const parts = ip.trim().split(".");
        if (parts.length !== 4) return false;
        return parts.every(p => {
            const num = Number(p);
            return !isNaN(num) && num >= 0 && num <= 255 && p === num.toString();
        });
    }

    function submitIP() {
        const ip = ipInput.value.trim();
        if (!isValidIP(ip)) {
            alert("Please enter a valid IPv4 address (e.g. XXX.XXX.XXX.XXX).");
            return;
        }

        // Try to save IP to localStorage
        try {
            localStorage.setItem('serverIP', ip);
        } catch (error) {
            console.log('Could not save to localStorage:', error);
            // Fallback: add IP as URL parameter to next page
        }

        // Navigate to account.html
        try {
            window.location.href = "account.html";
        } catch (error) {
            // If direct navigation fails, try with IP as parameter
            window.location.href = "account.html?ip=" + encodeURIComponent(ip);
        }
    }

    // Load saved IP on page load
    loadSavedIP();

    // Add event listener to the connect button
    connectBtn.addEventListener('click', submitIP);

    // Allow Enter key to submit
    ipInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            submitIP();
        }
    });

    // Save IP as user types (debounced)
    let saveTimeout;
    ipInput.addEventListener('input', function() {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(function() {
            const ip = ipInput.value.trim();
            if (ip && isValidIP(ip)) {
                try {
                    localStorage.setItem('serverIP', ip);
                } catch (error) {
                    console.log('Could not save to localStorage:', error);
                }
            }
        }, 1000); // Save 1 second after user stops typing
    });
});