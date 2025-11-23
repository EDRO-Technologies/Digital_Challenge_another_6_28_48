document.addEventListener("DOMContentLoaded", () => {

    /* =========================================================
       РЕДАКТИРОВАНИЕ ПРОФИЛЯ
    ========================================================= */
    const editBtn = document.querySelector(".profile-edit .btn");
    const inputs = document.querySelectorAll(".profile-field");
    const selects = document.querySelectorAll(".select-field");
    let editMode = false;

    window.enableEdit = function () {
        if (editMode) return;

        inputs.forEach(f => {
            f.removeAttribute("readonly");
            f.classList.remove("disabled-input");
        });

        selects.forEach(s => {
            s.classList.remove("disabled");
            s.querySelector(".select-display")?.classList.remove("select-locked");
        });

        editBtn.textContent = "Сохранить";
        editBtn.setAttribute("onclick", "saveProfile()");

        editMode = true;
    };

    /* =========================================================
       СОХРАНЕНИЕ ПРОФИЛЯ
    ========================================================= */
    window.saveProfile = async function () {
        const data = {
            username: document.querySelector("#p-name")?.value.trim(),
            email: document.querySelector("#p-email")?.value.trim(),
            password: document.querySelector("#p-password")?.value.trim(),
            country: document.querySelector("#p-country")?.value.trim(),
            language: document.querySelector("#p-language")?.value.trim(),
            gender: document.querySelector("#p-gender")?.value.trim(),
        };

        if (!data.username)
            return showAlert({ type: "error", title: "Ошибка", text: "Имя не может быть пустым" });

        if (!data.email)
            return showAlert({ type: "error", title: "Ошибка", text: "Почта не может быть пустой" });

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
            return showAlert({ type: "error", title: "Ошибка", text: "Некорректная почта" });

        if (data.password && data.password.length < 6)
            return showAlert({ type: "error", title: "Ошибка", text: "Пароль минимум 6 символов" });

        let response;
        try {
            response = await fetch("/auth/update_profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });
        } catch (e) {
            return showAlert({
                type: "error",
                title: "Ошибка сети",
                text: "Проверь подключение к интернету"
            });
        }

        let res;
        try {
            res = await response.json();
        } catch (e) {
            return showAlert({
                type: "error",
                title: "Ошибка",
                text: "Сервер вернул неверный ответ"
            });
        }

        if (!res.ok) {
            return showAlert({
                type: "error",
                title: "Ошибка",
                text: res.error || "Неизвестная ошибка"
            });
        }

        showAlert({
            type: "success",
            title: "Готово!",
            text: res.message || "Изменения сохранены!"
        });

        setTimeout(() => location.reload(), 700);
    };


    /* =========================================================
       ВЫПАДАЮЩЕЕ МЕНЮ ПРОФИЛЯ
    ========================================================= */
    const profileBtn = document.getElementById("profileBtn");
    const profileMenu = document.getElementById("profileMenu");

    if (profileBtn && profileMenu) {
        profileBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            const isOpen = profileMenu.style.display === "flex";

            profileMenu.style.display = isOpen ? "none" : "flex";
            profileBtn.classList.toggle("active", !isOpen);
        });

        document.addEventListener("click", (e) => {
            if (!profileBtn.contains(e.target) && !profileMenu.contains(e.target)) {
                profileMenu.style.display = "none";
                profileBtn.classList.remove("active");
            }
        });
    }
});
