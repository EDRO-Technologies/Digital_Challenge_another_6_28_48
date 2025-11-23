let viewDate = new Date();
let filterQuery = "";
let filterStatus = "";
let filterSubject = "";
let filterStart = "";
let filterEnd = "";

const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

document.addEventListener("DOMContentLoaded", () => {
    renderPublicCalendar();
    loadPublicLessons();
    const prev = document.getElementById("pub-prev");
    const next = document.getElementById("pub-next");
    if (prev) prev.onclick = () => changeMonth(-1);
    if (next) next.onclick = () => changeMonth(1);

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
    const applyBtn = document.getElementById("filter-apply");
    if (applyBtn) applyBtn.onclick = applyFilters;

    loadSubjects();
});

async function loadPublicLessons() {
    const month = viewDate.getMonth() + 1;
    const year = viewDate.getFullYear();
    const res = await fetch(`/api/lessons?month=${month}&year=${year}`);
    const data = await res.json();
    window.publicLessons = data || [];
    renderPublicCalendar();
}

async function loadSubjects() {
    const res = await fetch("/api/subjects");
    const data = await res.json();
    const select = document.getElementById("filter-subject");
    if (!select || !Array.isArray(data)) return;
    const cur = select.value;
    select.innerHTML = `<option value=\"\">Все дисциплины</option>`;
    data.forEach(s => select.innerHTML += `<option value="${s}">${s}</option>`);
    if (cur && data.includes(cur)) select.value = cur;
}

function changeMonth(delta) {
    viewDate.setMonth(viewDate.getMonth() + delta);
    renderPublicCalendar();
    loadPublicLessons();
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
    renderPublicCalendar();
}

function renderPublicCalendar() {
    const container = document.getElementById("calendar");
    if (!container) return;

    const monthNames = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
    const monthLabel = document.getElementById("current-month");
    if (monthLabel) monthLabel.textContent = `${monthNames[viewDate.getMonth()]} ${viewDate.getFullYear()}`;

    container.innerHTML = "";

    const header = document.createElement("div");
    header.className = "calendar-row cal-head";
    ["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].forEach(d => {
        const c = document.createElement("div");
        c.className = "calendar-cell cal-day-head";
        c.textContent = d;
        header.appendChild(c);
    });
    container.appendChild(header);

    const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
    const startDay = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();

    let day = 1 - startDay;
    for (let r = 0; r < 6; r++) {
        const row = document.createElement("div");
        row.className = "calendar-row";
        for (let c = 0; c < 7; c++, day++) {
            const cell = document.createElement("div");
            cell.className = "calendar-cell";
            if (day < 1 || day > daysInMonth) {
                cell.classList.add("empty");
            } else {
                cell.innerHTML = `<div class="day-number">${day}</div>`;
                const cellDate = fmt(new Date(viewDate.getFullYear(), viewDate.getMonth(), day));
                let lessons = (window.publicLessons || []).filter(l => l.date === cellDate);
                if (filterStart && new Date(cellDate) < new Date(filterStart + "T00:00:00")) lessons = [];
                if (filterEnd && new Date(cellDate) > new Date(filterEnd + "T00:00:00")) lessons = [];
                if (filterQuery) {
                    const q = filterQuery.toLowerCase();
                    lessons = lessons.filter(l =>
                        (l.subject || "").toLowerCase().includes(q) ||
                        (l.teacher || "").toLowerCase().includes(q) ||
                        (l.audience || "").toLowerCase().includes(q)
                    );
                }
                if (filterStatus) lessons = lessons.filter(l => l.status === filterStatus);
                if (filterSubject) lessons = lessons.filter(l => (l.subject || "").toLowerCase() === filterSubject.toLowerCase());

                const maxVisible = 2;
                lessons.slice(0, maxVisible).forEach(l => {
                    const tag = document.createElement("div");
                    tag.className = "lesson-tag";
                    tag.textContent = `${l.pair}. ${l.subject}`;
                    cell.appendChild(tag);
                });
                if (lessons.length > maxVisible) {
                    const more = document.createElement("div");
                    more.className = "more-lessons";
                    more.textContent = `+ ещё ${lessons.length - maxVisible}`;
                    more.onclick = (e) => { e.stopPropagation(); openListModal(cellDate, lessons); };
                    cell.appendChild(more);
                }
            }
            row.appendChild(cell);
        }
        container.appendChild(row);
    }
}

function openListModal(dateIso, lessons) {
    const title = document.getElementById("list-date-title");
    const body = document.getElementById("list-body");
    const modal = document.getElementById("listModal");
    if (!title || !body || !modal) return;
    title.textContent = dateIso;
    body.innerHTML = lessons.map(l => {
        const statusClass = l.status ? l.status : "";
        const audience = l.audience ? ` — ${l.audience}` : "";
        return `<div class="lesson-tag ${statusClass}" style="margin-bottom:6px;">
            ${l.pair}. ${l.subject} — ${l.teacher || ""}${audience}
        </div>`;
    }).join("") || "<p>Нет занятий</p>";
    modal.classList.add("show");
}

function closeListModal() {
    const modal = document.getElementById("listModal");
    if (modal) modal.classList.remove("show");
}

window.applyFilters = applyFilters;
window.closeListModal = closeListModal;
