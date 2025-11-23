document.addEventListener("DOMContentLoaded", () => {
    const burger = document.querySelector(".burger");
    const menu = document.querySelector(".mobile-menu");
    const header = document.querySelector(".header");
    const burgerIcon = burger.querySelector("img");

    let menuOpen = false;

    burger.addEventListener("click", () => {
        menuOpen = !menuOpen;

        if (menuOpen) {
            menu.classList.add("active");
            header.classList.add("menu-open");

            burgerIcon.src = "/static/img/icons/close.svg";
        } else {
            menu.classList.remove("active");
            header.classList.remove("menu-open");

            burgerIcon.src = "/static/img/icons/burger.svg";
        }
    });
});
