document.addEventListener("DOMContentLoaded", () => {

    window.registerUser = async function () {

        const username = document.querySelector("#reg-username");
        const email = document.querySelector("#reg-email");
        const password = document.querySelector("#reg-password");
        const policy = document.querySelector("#agree-policy");

        if (!username || !email || !password || !policy) {
            console.error("One or more elements not found!");
            return;
        }

        const data = {
            username: username.value.trim(),
            email: email.value.trim(),
            password: password.value.trim(),
            policy: policy.checked
        };

        const response = await fetch("/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        const res = await response.json();
        console.log("Backend:", res);
    };

});

document.addEventListener("DOMContentLoaded", () => {

    window.registerUser = async function () {

        const username = document.querySelector("#reg-username");
        const email = document.querySelector("#reg-email");
        const password = document.querySelector("#reg-password");
        const policy = document.querySelector("#agree-policy");

        const data = {
            username: username.value.trim(),
            email: email.value.trim(),
            password: password.value.trim(),
            policy: policy.checked
        };

        const response = await fetch("/auth/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        const res = await response.json();
        console.log("Backend:", res);

        if (!res.ok) {
            showAlert({
                type: "error",
                title: "Ошибка!",
                text: res.error
            });
            return;
        }

        showAlert({
            type: "success",
            title: "Успешно!",
            text: "Вы успешно зарегистрировались."
        });

        setTimeout(() => window.location.href = "/login", 1200);
    };

});
