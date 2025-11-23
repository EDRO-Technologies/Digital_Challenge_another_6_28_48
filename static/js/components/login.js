async function loginUser() {
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value.trim();

    if (!username || !password) {
        return showAlert({
            type: "error",
            title: "Ошибка",
            text: "Заполните все поля!"
        });
    }

    const response = await fetch("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });

    const res = await response.json();

    if (!res.ok) {
        return showAlert({
            type: "error",
            title: "Ошибка",
            text: res.error
        });
    }

    window.location.href = res.redirect;
}
