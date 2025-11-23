function initCustomSelect(selector) {
    const field = document.querySelector(selector);
    if (!field) return;

    const display = field.querySelector(".select-display");
    const options = field.querySelector(".select-options");
    const input = field.querySelector("input[type='hidden']");
    const text = field.querySelector(".select-text");

    display.onclick = () => {
        const isOpen = options.classList.contains("open");

        document.querySelectorAll(".select-options").forEach(o => o.classList.remove("open"));
        document.querySelectorAll(".select-display").forEach(d => d.classList.remove("active"));

        options.classList.toggle("open", !isOpen);
        display.classList.toggle("active", !isOpen);
    };

    options.onclick = e => {
        if (!e.target.classList.contains("select-option")) return;

        const value = e.target.dataset.value;
        const label = e.target.textContent;

        input.value = value;
        text.textContent = label;

        options.classList.remove("open");
        display.classList.remove("active");
    };
}

document.addEventListener("click", e => {
    if (!e.target.closest(".select-field")) {
        document.querySelectorAll(".select-options").forEach(o => o.classList.remove("open"));
        document.querySelectorAll(".select-display").forEach(d => d.classList.remove("active"));
    }
});
