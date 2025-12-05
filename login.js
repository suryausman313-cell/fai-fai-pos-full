function login() {
    const user = document.getElementById("email").value.trim();
    const pass = document.getElementById("password").value.trim();

    const ADMIN_USER = "admin@123";
    const ADMIN_PASS = "246800";

    if (user === ADMIN_USER && pass === ADMIN_PASS) {
        localStorage.setItem("logged", "yes");
        window.location.href = "admin.html";
    } else {
        alert("Wrong Email or Password!");
    }
}
