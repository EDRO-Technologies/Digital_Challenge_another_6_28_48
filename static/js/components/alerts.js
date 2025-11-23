// ===========================
//  POPUP ALERT BASE FUNCTION
// ===========================
window.showAlert = function(configOrType, maybeTitle, maybeText) {
    let options = { type: "info", title: "", text: "" };

    if (typeof configOrType === "string") {
        options.type = configOrType;
        options.title = maybeTitle || "";
        options.text = maybeText || "";
    } else if (configOrType && typeof configOrType === "object") {
        options = { ...options, ...configOrType };
    }

    const container = document.querySelector("#alert-container");
    if (!container) {
        console.error("⚠ alert-container not found in DOM");
        return;
    }

    const alertBox = document.createElement("div");
    alertBox.classList.add("alert-popup", `alert-${options.type}`);

    alertBox.innerHTML = `
        <div class="alert-icon"></div>
        <div class="alert-content">
            <div class="alert-title">${options.title}</div>
            <div class="alert-text">${options.text}</div>
        </div>
    `;

    container.appendChild(alertBox);

    setTimeout(() => {
        alertBox.classList.add("hide");
        setTimeout(() => alertBox.remove(), 300);
    }, 3500);
};


// ===========================
//  SHORTCUTS
// ===========================

window.showSuccess = function(text) {
    window.showAlert({
        type: "success",
        title: "Успешно!",
        text: text
    });
};

window.showError = function(text) {
    window.showAlert({
        type: "error",
        title: "Ошибка!",
        text: text
    });
};

window.showWarning = function(text) {
    window.showAlert({
        type: "warning",
        title: "Предупреждение",
        text: text
    });
};

window.showInfo = function(text) {
    window.showAlert({
        type: "info",
        title: "Информация",
        text: text
    });
};
