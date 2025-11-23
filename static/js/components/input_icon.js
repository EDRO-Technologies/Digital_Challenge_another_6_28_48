document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".icon-input").forEach(block => {
        const input = block.querySelector("input");
        const icon = block.querySelector(".input-icon");

        if (!input || !icon) return;

        const defaultIcon = icon.dataset.default;
        const activeIcon = icon.dataset.active;

        input.addEventListener("focus", () => {
            if (activeIcon) icon.src = activeIcon;
        });

        input.addEventListener("blur", () => {
            icon.src = defaultIcon;
        });
    });
});

document.querySelectorAll(".select-field").forEach(select => {
    const display = select.querySelector(".select-display");
    const arrow = select.querySelector(".select-arrow");
    const options = select.querySelector(".select-options");
    const input = select.querySelector("input");

    const iconDefault = arrow.dataset.iconDefault;
    const iconActive = arrow.dataset.iconActive;

    display.addEventListener("click", () => {
        const opened = options.classList.toggle("open");
        display.classList.toggle("active", opened);

        arrow.src = opened ? iconActive : iconDefault;
    });

    options.querySelectorAll(".select-option").forEach(opt => {
        opt.addEventListener("click", () => {
            display.querySelector(".select-text").textContent = opt.textContent;
            display.querySelector(".select-text").style.color = "#333";

            input.value = opt.dataset.value;

            options.classList.remove("open");
            display.classList.remove("active");
            arrow.src = iconDefault;
        });
    });
});
