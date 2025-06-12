(function() {
    const TIMEOUT_DURATION = 5 * 60 * 1000;
    let logoutTimer;

    function resetTimer() {
        clearTimeout(logoutTimer);
        logoutTimer = setTimeout(() => {
            alert("Sesi Anda telah berakhir karena tidak ada aktivitas. Anda akan diarahkan ke halaman login.");

            const logoutForm = document.getElementById('logout-form');
            if (logoutForm) {
                logoutForm.submit();
            } else {
                // Jika form tidak ditemukan, redirect manual ke login
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = '/logout/';
                
                const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]');
                if (csrfToken) {
                    const csrfInput = document.createElement('input');
                    csrfInput.type = 'hidden';
                    csrfInput.name = 'csrfmiddlewaretoken';
                    csrfInput.value = csrfToken.value;
                    form.appendChild(csrfInput);
                }

                document.body.appendChild(form);
                form.submit();
            }
        }, TIMEOUT_DURATION);
    }

    function activityDetector() {
        ['mousemove', 'keydown', 'click', 'scroll'].forEach(event =>
            document.addEventListener(event, resetTimer, true)
        );
    }

    document.addEventListener('DOMContentLoaded', () => {
        resetTimer();
        activityDetector();
    });
})();
