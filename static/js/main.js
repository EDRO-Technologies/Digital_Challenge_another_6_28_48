window.addEventListener("load", () => {
    const loader = document.getElementById("page-loader");

    setTimeout(() => {
        loader.classList.add("hidden");
    }, 300);
});
