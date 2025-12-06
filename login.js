function login() {
    const email = document.getElementById("email").value;
    const pass = document.getElementById("password").value;

    // Default Admin
    const adminEmail = "admin@pos.com";
    const adminPass = "12345";

    if (email === adminEmail && pass === adminPass) {
        // Redirect to Dashboard
        window.location.href = "dashboard.html";
    } else {
        // Show Error
        document.getElementById("errorMsg").style.display = "block";
    }
}
