let currentDate = new Date();
let selectedDate = null;
let editingLessonId = null;
let listLessons = [];
const formatDate = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
let filterQuery = "";
let filterStatus = "";
let filterSubject = "";
let filterStart = "";
let filterEnd = "";

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("prev-month").onclick = () => changeMonth(-1);
    document.getElementById("next-month").onclick = () => changeMonth(1);
    renderCalendar();
    loadLessons();
    const importBtn = document.getElementById("import-btn");
    if (importBtn) importBtn.onclick = importExcel;
    const clearBtn = document.getElementById("clear-btn");
    if (clearBtn) clearBtn.onclick = showClearConfirm;
    const exportBtn = document.getElementById("export-btn");
    if (exportBtn) exportBtn.onclick = exportWeek;

    const fq = document.getElementById("filter-query");
    const fs = document.getElementById("filter-status");
    const fsub = document.getElementById("filter-subject");
    const fstart = document.getElementById("filter-start");
    const fend = document.getElementById("filter-end");
    if (fq) fq.addEventListener("keyup", applyFilters);
    if (fs) fs.addEventListener("change", applyFilters);
    if (fsub) fsub.addEventListener("change", applyFilters);
    if (fstart) fstart.addEventListener("change", applyFilters);
    if (fend) fend.addEventListener("change", applyFilters);

    loadSubjects();
});

async function requestJson(url, options = {}) {
    try {
        const res = await fetch(url, options);
        let data = {};
        try { data = await res.json(); } catch (_) {
            data = { ok: false, error: `HTTP ${res.status}` };
        }
        if (!res.ok && data.ok === undefined) {
            data.ok = false;
            data.error = data.error || `HTTP ${res.status}`;
        }
        return data;
    } catch (e) {
        return { ok: false, error: "Сеть недоступна" };
    }
}

async function loadLessons() {
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    const data = await requestJson(`/api/lessons?month=${month}&year=${year}`);
    window.lessonsCache = Array.isArray(data) ? data : [];
    renderCalendar();
}

async function loadSubjects() {
    const res = await requestJson("/api/subjects");
    if (!Array.isArray(res)) return;
    const select = document.getElementById("filter-subject");
    if (!select) return;
    const current = select.value;
    select.innerHTML = `<option value=\"\">Все дисциплины</option>`;
    res.forEach(s => {
        select.innerHTML += `<option value="${s}">${s}</option>`;
    });
    if (current && res.includes(current)) {
        select.value = current;
    }
}

function changeMonth(delta) {
    currentDate.setMonth(currentDate.getMonth() + delta);
    renderCalendar();
    loadLessons();
}

function renderCalendar() {
    const monthLabel = document.getElementById("current-month");
    const calendar = document.getElementById("calendar");
    if (!monthLabel || !calendar) return;

    const monthNames = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
    monthLabel.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;

    calendar.innerHTML = "";
    const header = document.createElement("div");
    header.className = "calendar-row cal-head";
    ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].forEach(d => {
        const c = document.createElement("div");
        c.className = "calendar-cell cal-day-head";
        c.textContent = d;
        header.appendChild(c);
    });
    calendar.appendChild(header);

    const first = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const startDay = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

    let day = 1 - startDay;
    for (let row = 0; row < 6; row++) {
        const rowEl = document.createElement("div");
        rowEl.className = "calendar-row";
        for (let col = 0; col < 7; col++, day++) {
            const cell = document.createElement("div");
            cell.className = "calendar-cell";
            if (day < 1 || day > daysInMonth) {
                cell.classList.add("empty");
            } else {
                cell.innerHTML = `<div class="day-number">${day}</div>`;
                const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                cell.onclick = () => openModal(cellDate);
                renderNotes(cell, cellDate);
            }
            rowEl.appendChild(cell);
        }
        calendar.appendChild(rowEl);
    }
}

function renderNotes(cell, cellDate) {
    const iso = formatDate(cellDate);
    let dayLessons = (window.lessonsCache || []).filter(l => l.date === iso);
    if (filterStart) {
        if (new Date(iso) < new Date(filterStart + "T00:00:00")) return;
    }
    if (filterEnd) {
        if (new Date(iso) > new Date(filterEnd + "T00:00:00")) return;
    }
    if (filterQuery) {
        const q = filterQuery.toLowerCase();
        dayLessons = dayLessons.filter(l =>
            (l.subject || "").toLowerCase().includes(q) ||
            (l.teacher || "").toLowerCase().includes(q) ||
            (l.audience || "").toLowerCase().includes(q)
        );
    }
    if (filterStatus) {
        dayLessons = dayLessons.filter(l => l.status === filterStatus);
    }
    if (filterSubject) {
        dayLessons = dayLessons.filter(l => (l.subject || "").toLowerCase() === filterSubject.toLowerCase());
    }
    if (!dayLessons.length) return;

    const maxVisible = 2;
    dayLessons.slice(0, maxVisible).forEach(l => {
        const tag = document.createElement("div");
        tag.className = "lesson-tag";
        if (l.status === "canceled") tag.classList.add("canceled");
        if (l.status === "moved") tag.classList.add("moved");
        if (l.status === "online") tag.classList.add("online");
        tag.textContent = `${l.pair}. ${l.subject}`;
        tag.title = `${l.subject} (${l.teacher})`;
        tag.onclick = (e) => { e.stopPropagation(); openEdit(l); };
        cell.appendChild(tag);
    });

    if (dayLessons.length > maxVisible) {
        const more = document.createElement("div");
        more.className = "more-lessons";
        more.textContent = `+ ещё ${dayLessons.length - maxVisible}`;
        more.onclick = (e) => { e.stopPropagation(); openListModal(iso, dayLessons); };
        cell.appendChild(more);
    }
}

function openModal(dateObj) {
    selectedDate = dateObj;
    document.getElementById("modal-date-title").textContent = formatDate(dateObj);
    document.getElementById("modal-date").value = formatDate(dateObj);
    document.getElementById("modal-subject").value = "";
    document.getElementById("modal-teacher").value = "";
    document.getElementById("modal-audience").value = "";
    document.getElementById("modal-status").value = "scheduled";
    document.getElementById("modal-comment").value = "";
    document.getElementById("modal-pair").value = "1";
    editingLessonId = null;
    document.getElementById("lessonModal").classList.add("show");
    document.getElementById("delete-btn").style.display = "none";
}

function closeModal() {
    document.getElementById("lessonModal").classList.remove("show");
}

function openListModal(dateIso, lessons) {
    listLessons = lessons;
    document.getElementById("list-date-title").textContent = dateIso;
    const body = document.getElementById("list-body");
    body.innerHTML = lessons.map(l => `
        <div class="lesson-tag ${l.status || ""}" style="cursor:pointer; margin-bottom:6px;" onclick="openEditFromList(${l.id})">
            ${l.pair}. ${l.subject} — ${l.teacher}
        </div>
    `).join("");
    document.getElementById("listModal").classList.add("show");
}

function closeListModal() {
    document.getElementById("listModal").classList.remove("show");
}

function openEditFromList(id) {
    const found = listLessons.find(x => x.id === id);
    if (found) {
        closeListModal();
        openEdit(found);
    }
}

async function createLesson() {
    if (!selectedDate) return;
    const pair = document.getElementById("modal-pair").value;
    const subject = document.getElementById("modal-subject").value.trim();
    const teacher = document.getElementById("modal-teacher").value.trim();
    const audience = document.getElementById("modal-audience").value.trim();
    const status = document.getElementById("modal-status").value;
    const comment = document.getElementById("modal-comment").value.trim();
    const dateVal = document.getElementById("modal-date").value || formatDate(selectedDate);

    if (!subject || !teacher) {
        showAlert({ type: "error", title: "Ошибка", text: "Заполните дисциплину и преподавателя" });
        return;
    }

    const body = {
        date: dateVal,
        pair: Number(pair),
        subject,
        teacher,
        audience,
        status,
        comment
    };

    const data = await requestJson("/api/lessons" + (editingLessonId ? `/${editingLessonId}` : ""), {
        method: editingLessonId ? "PATCH" : "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(body)
    });
    if (!data.ok) {
        showAlert({ type: "error", title: "Ошибка", text: data.error || "Не удалось сохранить" });
        return;
    }
    showAlert({ type: "success", title: "Готово", text: editingLessonId ? "Изменения сохранены" : "Занятие добавлено" });
    closeModal();
    loadLessons();
}

async function importExcel() {
    const input = document.getElementById("excel-file");
    if (!input || !input.files.length) {
        showAlert({ type: "warning", title: "Файл", text: "Выберите .xlsx файл" });
        return;
    }

    const fileName = input.files[0].name;

    const fd = new FormData();
    fd.append("file", input.files[0]);

    const data = await requestJson("/api/import_excel", { method: "POST", body: fd });

    if (!data.ok) {
        showAlert({ type: "error", title: "Импорт", text: data.error || "Ошибка импорта" });
        return;
    }

    input.value = "";

    showAlert({
        type: "success",
        title: "Импорт",
        text: `Файл: ${fileName}\nДобавлено занятий: ${data.created}`
    });

    setTimeout(() => window.location.reload(), 500);
}

document.addEventListener("DOMContentLoaded", () => {
    const input = document.getElementById("excel-file");
    const label = document.querySelector(".file-btn");

    if (input && label) {
        input.addEventListener("change", () => {
            if (input.files.length > 0) {
                label.textContent = input.files[0].name;
            } else {
                label.textContent = "Выбрать .xlsx"; 
            }
        });
    }
});



async function clearAllLessons() {
    const input = document.getElementById("excel-file");
    if (input) input.value = "";
    const data = await requestJson("/api/lessons", { method: "DELETE" });
    if (!data.ok) {
        showAlert({ type: "error", title: "Ошибка", text: data.error || "Не удалось очистить" });
        return;
    }
    showAlert({ type: "success", title: "Готово", text: "Все занятия удалены" });
    loadLessons();
    hideClearConfirm();
}

function openEdit(lesson) {
    selectedDate = new Date(lesson.date + "T00:00:00");
    editingLessonId = lesson.id;
    document.getElementById("lessonModal").classList.add("show");
    document.getElementById("delete-btn").style.display = "inline-block";
    document.getElementById("modal-date").value = lesson.date;
    document.getElementById("modal-date-title").textContent = lesson.date;
    document.getElementById("modal-pair").value = lesson.pair;
    document.getElementById("modal-subject").value = lesson.subject || "";
    document.getElementById("modal-teacher").value = lesson.teacher || "";
    document.getElementById("modal-audience").value = lesson.audience || "";
    document.getElementById("modal-status").value = lesson.status || "scheduled";
    document.getElementById("modal-comment").value = lesson.comment || "";
}

async function deleteLesson() {
    if (!editingLessonId) return;
    const data = await requestJson(`/api/lessons/${editingLessonId}`, { method: "DELETE" });
    if (!data.ok) {
        showAlert({ type: "error", title: "Ошибка", text: data.error || "Не удалось удалить" });
        return;
    }
    showAlert({ type: "success", title: "Удалено", text: "Занятие удалено" });
    closeModal();
    loadLessons();
}

function applyFilters() {
    const fq = document.getElementById("filter-query");
    const fs = document.getElementById("filter-status");
    const fsub = document.getElementById("filter-subject");
    const fstart = document.getElementById("filter-start");
    const fend = document.getElementById("filter-end");
    filterQuery = fq ? fq.value.trim() : "";
    filterStatus = fs ? fs.value : "";
    filterSubject = fsub ? fsub.value : "";
    filterStart = fstart ? fstart.value : "";
    filterEnd = fend ? fend.value : "";
    renderCalendar();
}

function showClearConfirm() {
    const modal = document.getElementById("clearConfirmModal");
    if (modal) {
        modal.classList.add("show");
    } else {
        clearAllLessons();
    }
}

function hideClearConfirm() {
    const modal = document.getElementById("clearConfirmModal");
    if (modal) modal.classList.remove("show");
}

async function exportWeek() {
    const today = currentDate;
    const day = today.getDay();
    const diffToMonday = (day + 6) % 7;
    const monday = new Date(today);
    monday.setDate(today.getDate() - diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const params = new URLSearchParams({
        start: formatDate(monday),
        end: formatDate(sunday),
    });
    const url = `/api/export_week?${params.toString()}`;
    const link = document.createElement("a");
    link.href = url;
    link.download = "schedule_week.xlsx";
    document.body.appendChild(link);
    link.click();
    link.remove();
}

window.showClearConfirm = showClearConfirm;
window.hideClearConfirm = hideClearConfirm;
window.applyFilters = applyFilters;
