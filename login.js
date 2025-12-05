function login() {
    const user = document.getElementById("email").value.trim();
    const pass = document.getElementById("password").value.trim();

    const ADMIN_USER = "Admin@313"; 
    const ADMIN_PASS = "246800";

    if (user === ADMIN_USER && pass === ADMIN_PASS) {
        localStorage.setItem("adminLogged", "yes");
        window.location.href = "admin.html";
    } else {
        alert("Wrong Email or Password!");
    }
}
