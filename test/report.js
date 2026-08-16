let reportData = null;

async function loadReport() {
    try {
        const response = await fetch("./results.json?" + Date.now());

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        reportData = await response.json();
        renderReport();
        bindEvents();
        applyFilters();
    } catch (error) {
        document.body.innerHTML = `
            <div style="padding:40px;font-family:Arial;color:#dc2626">
                <h1>Erro ao carregar relatório</h1>
                <p>Não foi possível carregar <strong>results.json</strong>.</p>
                <pre>${escapeHtml(error.message)}</pre>
            </div>
        `;
    }
}

function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value)
        .replaceAll("&","&amp;")
        .replaceAll("<","&lt;")
        .replaceAll(">","&gt;")
        .replaceAll('"',"&quot;")
        .replaceAll("'","&#039;");
}

function formatBody(body) {
    if (body === null || body === undefined) return "";
    if (typeof body === "string") return body;
    try { return JSON.stringify(body,null,2); }
    catch { return String(body); }
}

function formatDate(value) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("pt-BR");
}

function getProtocol(category) {
    if (String(category || "").startsWith("V2")) return "V2";
    if (String(category || "").startsWith("V4")) return "V4";
    return "OUTRO";
}

function renderReport() {
    const metadata = reportData.metadata || {};

    document.getElementById("test-times").innerHTML = `
        <div><strong>Início:</strong> ${escapeHtml(formatDate(metadata.startTime))}</div>
        <div><strong>Fim:</strong> ${escapeHtml(formatDate(metadata.endTime))}</div>
        <div><strong>Servidor:</strong> ${escapeHtml(metadata.server || "-")}</div>
    `;

    document.getElementById("results-body").innerHTML =
        (reportData.results || []).map((item,index) => createRow(item,index)).join("");
}

function createRow(item,index) {
    const protocol = getProtocol(item.category);
    let statusHtml;

    if (item.status === "OK") {
        statusHtml = `<span class="status ok">✓ OK</span>`;
    } else if (item.status === "IGNORADO") {
        statusHtml = `<span class="status ignored">⚠ IGNORADO</span>`;
    } else {
        statusHtml = `<button class="status error" data-error-index="${index}">✕ ERRO</button>`;
    }

    const urlHtml = item.url === "-" ? "-" :
        `<a href="${escapeHtml(item.url)}" target="_blank">${escapeHtml(item.url)}</a>`;

    const rowClass = item.status === "OK" ? "row-ok" :
        item.status === "ERRO" ? "row-error" : "row-ignored";

    return `
        <tr class="test-row ${rowClass}"
            data-status="${escapeHtml(item.status)}"
            data-protocol="${escapeHtml(protocol)}"
            data-method="${escapeHtml(item.method)}">
            <td>${escapeHtml(item.category)}</td>
            <td>${escapeHtml(item.test)}</td>
            <td>${escapeHtml(item.method)}</td>
            <td>${escapeHtml(item.expected)}</td>
            <td>${escapeHtml(item.received)}</td>
            <td>${statusHtml}</td>
            <td class="url">${urlHtml}</td>
        </tr>
    `;
}

function getCheckedValues(name) {
    return Array.from(document.querySelectorAll(`input[name="${name}"]:checked`))
        .map(input => input.value);
}

function applyFilters() {
    const selectedStatus = getCheckedValues("status");
    const selectedProtocol = getCheckedValues("protocol");
    const selectedMethods = getCheckedValues("method");

    const rows = Array.from(document.querySelectorAll(".test-row"));
    let total=0, ok=0, errors=0, ignored=0;

    rows.forEach(row => {
        const status = row.dataset.status;
        const protocol = row.dataset.protocol;
        const method = row.dataset.method;

        const visible =
            selectedStatus.includes(status) &&
            selectedProtocol.includes(protocol) &&
            selectedMethods.includes(method);

        row.style.display = visible ? "" : "none";
        if (!visible) return;

        total++;
        if (status === "OK") ok++;
        if (status === "ERRO") errors++;
        if (status === "IGNORADO") ignored++;
    });

    document.getElementById("summary-total").textContent = total;
    document.getElementById("summary-ok").textContent = ok;
    document.getElementById("summary-error").textContent = errors;
    document.getElementById("summary-ignored").textContent = ignored;
    document.getElementById("no-results").style.display = total === 0 ? "block" : "none";
}

function showError(index) {
    const item = reportData.results[index];
    if (!item) return;

    document.getElementById("error-details").innerHTML = `
        <div><strong>Categoria:</strong> ${escapeHtml(item.category)}</div>
        <div><strong>Teste:</strong> ${escapeHtml(item.test)}</div>
        <div><strong>Método:</strong> ${escapeHtml(item.method)}</div>
        <div><strong>URL:</strong> ${escapeHtml(item.url)}</div>
        <div><strong>Esperado:</strong> ${escapeHtml(item.expected)}</div>
        <div><strong>Recebido:</strong> ${escapeHtml(item.received)}</div>
    `;

    document.getElementById("error-body").textContent = formatBody(item.responseBody);
    document.getElementById("error-modal").style.display = "block";
}

function closeModal() {
    document.getElementById("error-modal").style.display = "none";
}

function bindEvents() {
    document.querySelectorAll('.filter-option input[type="checkbox"]')
        .forEach(checkbox => checkbox.addEventListener("change", applyFilters));

    document.getElementById("select-all").addEventListener("click", () => {
        document.querySelectorAll('.filter-option input[type="checkbox"]')
            .forEach(checkbox => checkbox.checked = true);
        applyFilters();
    });

    document.getElementById("clear-all").addEventListener("click", () => {
        document.querySelectorAll('.filter-option input[type="checkbox"]')
            .forEach(checkbox => checkbox.checked = false);
        applyFilters();
    });

    document.getElementById("results-body").addEventListener("click", event => {
        const button = event.target.closest("[data-error-index]");
        if (!button) return;
        showError(Number(button.dataset.errorIndex));
    });

    document.getElementById("close-modal").addEventListener("click", closeModal);

    document.getElementById("error-modal").addEventListener("click", event => {
        if (event.target.id === "error-modal") closeModal();
    });
}

loadReport();
