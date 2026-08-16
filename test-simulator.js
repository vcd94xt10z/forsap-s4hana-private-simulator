import fs from "node:fs/promises";
import path from "node:path";
import { exec } from "node:child_process";

const BASE_URL =
    process.env.BASE_URL ||
    "http://localhost:4004";

const V2_PATH =
    "/sap/opu/odata/sap/API_BUSINESS_PARTNER";

const V4_PATH =
    "/sap/opu/odata4/sap/api_business_partner/srvd_a2x/sap/businesspartner/0001";

const V2 =
    `${BASE_URL}${V2_PATH}`;

const V4 =
    `${BASE_URL}${V4_PATH}`;

const REPORT_FILE =
    path.resolve(
        process.cwd(),
        "result-tests.html"
    );

const results = [];

let testStartTime = null;
let testEndTime = null;

function addResult({
    category,
    test,
    method,
    url,
    expected,
    received,
    responseBody = null,
    status
}) {
    results.push({
        category,
        test,
        method,
        url,
        expected,
        received,
        responseBody,
        status
    });
}

async function request(
    method,
    url,
    options = {}
) {
    try {
        const headers = {
            Accept: "application/json",
            ...(options.headers || {})
        };

        if (
            options.body !== undefined &&
            options.body !== null
        ) {
            headers["Content-Type"] =
                "application/json";
        }

        const response = await fetch(
            url,
            {
                method,
                headers,
                body:
                    options.body === undefined
                        ? undefined
                        : JSON.stringify(
                            options.body
                        )
            }
        );

        const text =
            await response.text();

        let data = null;

        if (text) {
            try {
                data =
                    JSON.parse(text);
            } catch {
                data = text;
            }
        }

        return {
            status:
                response.status,

            data,

            responseBody:
                data
        };

    } catch (error) {
        return {
            status: null,
            data: null,
            responseBody: {
                error:
                    error?.message ||
                    String(error)
            }
        };
    }
}

function record({
    category,
    test,
    method,
    url,
    expected,
    received,
    responseBody
}) {
    const success =
        received === expected;

    addResult({
        category,
        test,
        method,
        url,
        expected,
        received,
        responseBody,
        status:
            success
                ? "OK"
                : "ERRO"
    });

    return success;
}

function skip({
    category,
    test,
    method = "-",
    url = "-",
    reason
}) {
    addResult({
        category,
        test,
        method,
        url,
        expected: "-",
        received: "-",
        responseBody: null,
        status: "IGNORADO",
        reason
    });
}

async function runTest(
    testFunction
) {
    try {
        await testFunction();
    } catch (error) {
        addResult({
            category: "EXECUÇÃO",
            test:
                testFunction.name ||
                "Teste",
            method: "-",
            url: "-",
            expected: "-",
            received: "ERRO",
            responseBody: {
                error:
                    error?.stack ||
                    error?.message ||
                    String(error)
            },
            status: "ERRO"
        });
    }
}

function getV2Results(data) {
    return (
        data?.d?.results ??
        []
    );
}

function getV4Results(data) {
    return (
        data?.value ??
        []
    );
}

function escapeHtml(value) {
    if (
        value === null ||
        value === undefined
    ) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatBody(body) {
    if (
        body === null ||
        body === undefined
    ) {
        return "";
    }

    if (
        typeof body === "string"
    ) {
        return body;
    }

    try {
        return JSON.stringify(
            body,
            null,
            2
        );
    } catch {
        return String(body);
    }
}

function statusHtml(
    status,
    index
) {
    if (status === "OK") {
        return `
            <span class="status ok">
                ✓ OK
            </span>
        `;
    }

    if (status === "IGNORADO") {
        return `
            <span class="status ignored">
                ⚠ IGNORADO
            </span>
        `;
    }

    return `
        <button
            class="status error"
            onclick="showError(${index})"
        >
            ✕ ERRO
        </button>
    `;
}

function generateHtml() {
    const total =
        results.length;

    const passed =
        results.filter(
            item =>
                item.status === "OK"
        ).length;

    const failed =
        results.filter(
            item =>
                item.status === "ERRO"
        ).length;

    const ignored =
        results.filter(
            item =>
                item.status === "IGNORADO"
        ).length;

    const rows =
        results
            .map(
                (item, index) => `
                    <tr class="${
                        item.status === "OK"
                            ? "row-ok"
                            : item.status === "ERRO"
                                ? "row-error"
                                : "row-ignored"
                    }">

                        <td>
                            ${escapeHtml(
                                item.category
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                item.test
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                item.method
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                item.expected
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                item.received
                            )}
                        </td>

                        <td>
                            ${statusHtml(
                                item.status,
                                index
                            )}
                        </td>

                        <td class="url">
                            ${
                                item.url === "-"
                                    ? "-"
                                    : `
                                        <a
                                            href="${escapeHtml(item.url)}"
                                            target="_blank"
                                        >
                                            ${escapeHtml(item.url)}
                                        </a>
                                    `
                            }
                        </td>

                    </tr>
                `
            )
            .join("");

    const bodies =
        results
            .map(
                (item, index) => `
                    <div
                        id="error-${index}"
                        class="modal"
                    >
                        <div class="modal-content">

                            <div class="modal-header">
                                <h2>
                                    Detalhes do erro
                                </h2>

                                <button
                                    class="close"
                                    onclick="closeError(${index})"
                                >
                                    ×
                                </button>
                            </div>

                            <div class="details">

                                <div>
                                    <strong>
                                        Categoria:
                                    </strong>

                                    ${escapeHtml(
                                        item.category
                                    )}
                                </div>

                                <div>
                                    <strong>
                                        Teste:
                                    </strong>

                                    ${escapeHtml(
                                        item.test
                                    )}
                                </div>

                                <div>
                                    <strong>
                                        Método:
                                    </strong>

                                    ${escapeHtml(
                                        item.method
                                    )}
                                </div>

                                <div>
                                    <strong>
                                        URL:
                                    </strong>

                                    ${escapeHtml(
                                        item.url
                                    )}
                                </div>

                                <div>
                                    <strong>
                                        Esperado:
                                    </strong>

                                    ${escapeHtml(
                                        item.expected
                                    )}
                                </div>

                                <div>
                                    <strong>
                                        Recebido:
                                    </strong>

                                    ${escapeHtml(
                                        item.received
                                    )}
                                </div>

                            </div>

                            <h3>
                                Response Body
                            </h3>

                            <pre>${escapeHtml(
                                formatBody(
                                    item.responseBody
                                )
                            )}</pre>

                        </div>
                    </div>
                `
            )
            .join("");

    return `
<!DOCTYPE html>

<html lang="pt-BR">

<head>

<meta charset="UTF-8">

<meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
>

<title>
    FOR SAP - Resultado dos Testes
</title>

<style>

* {
    box-sizing: border-box;
}

body {
    margin: 0;
    padding: 0;
    font-family:
        Arial,
        Helvetica,
        sans-serif;

    background:
        #f5f7fa;

    color:
        #172033;
}

.header {
    background:
        #ffffff;

    border-bottom:
        1px solid #d9dee7;

    padding:
        24px 30px;
}

.title {
    font-size:
        28px;

    font-weight:
        700;

    margin-bottom:
        8px;
}

.subtitle {
    color:
        #667085;

    font-size:
        14px;
}

.times {
    display:
        flex;

    gap:
        30px;

    margin-top:
        16px;

    font-size:
        14px;
}

.summary {
    display:
        flex;

    gap:
        12px;

    padding:
        20px 30px;

    background:
        #ffffff;

    border-bottom:
        1px solid #d9dee7;
}

.summary-card {
    padding:
        12px 18px;

    border-radius:
        8px;

    background:
        #f2f4f7;

    min-width:
        120px;
}

.summary-card strong {
    display:
        block;

    font-size:
        22px;
}

.summary-label {
    color:
        #667085;

    font-size:
        12px;

    margin-top:
        3px;
}

.container {
    padding:
        20px 30px;
}

table {
    width:
        100%;

    border-collapse:
        separate;

    border-spacing:
        0;

    background:
        #ffffff;

    border:
        1px solid #d9dee7;

    border-radius:
        8px;

    overflow:
        hidden;
}

thead {
    background:
        #f8fafc;
}

th {
    text-align:
        left;

    padding:
        12px 10px;

    font-size:
        13px;

    border-bottom:
        1px solid #d9dee7;
}

td {
    padding:
        11px 10px;

    font-size:
        13px;

    border-bottom:
        1px solid #eaecf0;

    vertical-align:
        middle;
}

tr:last-child td {
    border-bottom:
        none;
}

.row-ok {
    background:
        #f0fdf4;
}

.row-error {
    background:
        #fff5f5;
}

.row-ignored {
    background:
        #fffbea;
}

.status {
    display:
        inline-block;

    border:
        none;

    border-radius:
        6px;

    padding:
        5px 9px;

    font-size:
        12px;

    font-weight:
        700;

    cursor:
        pointer;
}

.status.ok {
    background:
        #dcfce7;

    color:
        #15803d;
}

.status.error {
    background:
        #fee2e2;

    color:
        #dc2626;
}

.status.ignored {
    background:
        #fef3c7;

    color:
        #a16207;
}

.url {
    max-width:
        600px;

    word-break:
        break-all;
}

.url a {
    color:
        #175cd3;

    text-decoration:
        none;
}

.url a:hover {
    text-decoration:
        underline;
}

.modal {
    display:
        none;

    position:
        fixed;

    z-index:
        1000;

    inset:
        0;

    background:
        rgba(0, 0, 0, 0.55);

    padding:
        40px;
}

.modal-content {
    background:
        #ffffff;

    max-width:
        1000px;

    max-height:
        90vh;

    overflow:
        auto;

    margin:
        auto;

    border-radius:
        8px;

    box-shadow:
        0 20px 60px
        rgba(0, 0, 0, 0.3);
}

.modal-header {
    display:
        flex;

    align-items:
        center;

    justify-content:
        space-between;

    padding:
        18px 24px;

    border-bottom:
        1px solid #d9dee7;
}

.modal-header h2 {
    margin:
        0;

    color:
        #dc2626;

    font-size:
        20px;
}

.close {
    border:
        none;

    background:
        transparent;

    font-size:
        28px;

    cursor:
        pointer;

    color:
        #667085;
}

.details {
    padding:
        18px 24px;

    display:
        grid;

    grid-template-columns:
        120px 1fr;

    row-gap:
        8px;

    font-size:
        14px;
}

.details strong {
    margin-right:
        10px;
}

.modal-content h3 {
    padding:
        0 24px;

    margin-top:
        5px;
}

.modal-content pre {
    margin:
        0 24px 24px;

    padding:
        18px;

    background:
        #101828;

    color:
        #f2f4f7;

    border-radius:
        6px;

    overflow:
        auto;

    white-space:
        pre-wrap;

    word-break:
        break-word;

    font-family:
        Consolas,
        monospace;

    font-size:
        13px;

    line-height:
        1.5;
}

@media (max-width: 1000px) {

    .container {
        padding:
            10px;
    }

    .header {
        padding:
            18px;
    }

    .summary {
        padding:
            15px;
        flex-wrap:
            wrap;
    }

    table {
        font-size:
            12px;
    }

    th,
    td {
        padding:
            8px;
        font-size:
            11px;
    }

}

</style>

</head>

<body>

<div class="header">

    <div class="title">
        FOR SAP - Resultado dos Testes
    </div>

    <div class="subtitle">
        Simulador SAP S/4HANA Private Edition
    </div>

    <div class="times">

        <div>
            <strong>
                Início:
            </strong>

            ${escapeHtml(
                testStartTime
                    ?.toLocaleString(
                        "pt-BR"
                    ) || "-"
            )}
        </div>

        <div>
            <strong>
                Fim:
            </strong>

            ${escapeHtml(
                testEndTime
                    ?.toLocaleString(
                        "pt-BR"
                    ) || "-"
            )}
        </div>

        <div>
            <strong>
                Servidor:
            </strong>

            ${escapeHtml(
                BASE_URL
            )}
        </div>

    </div>

</div>

<div class="summary">

    <div class="summary-card">
        <strong>
            ${total}
        </strong>

        <div class="summary-label">
            Total
        </div>
    </div>

    <div class="summary-card">
        <strong>
            ${passed}
        </strong>

        <div class="summary-label">
            OK
        </div>
    </div>

    <div class="summary-card">
        <strong>
            ${failed}
        </strong>

        <div class="summary-label">
            Erros
        </div>
    </div>

    <div class="summary-card">
        <strong>
            ${ignored}
        </strong>

        <div class="summary-label">
            Ignorados
        </div>
    </div>

</div>

<div class="container">

<table>

<thead>

<tr>

<th>
    Categoria
</th>

<th>
    Teste
</th>

<th>
    Método
</th>

<th>
    Esperado
</th>

<th>
    Recebido
</th>

<th>
    Resultado
</th>

<th>
    URL
</th>

</tr>

</thead>

<tbody>

${rows}

</tbody>

</table>

</div>

${bodies}

<script>

function showError(index) {

    const modal =
        document.getElementById(
            "error-" + index
        );

    if (modal) {
        modal.style.display =
            "block";
    }
}

function closeError(index) {

    const modal =
        document.getElementById(
            "error-" + index
        );

    if (modal) {
        modal.style.display =
            "none";
    }
}

window.addEventListener(
    "click",
    function(event) {

        if (
            event.target.classList
                .contains("modal")
        ) {

            event.target.style.display =
                "none";
        }

    }
);

</script>

</body>

</html>
`;
}

async function writeReport() {

    const html =
        generateHtml();

    await fs.writeFile(
        REPORT_FILE,
        html,
        "utf8"
    );

    console.log("");
    console.log(
        "=================================================="
    );

    console.log(
        "RELATÓRIO GERADO:"
    );

    console.log(
        REPORT_FILE
    );

    console.log(
        "=================================================="
    );

    console.log("");

    console.log(
        `file://${REPORT_FILE.replaceAll("\\", "/")}`
    );

    console.log("");
}

function openBrowser() {

    const command =
        process.platform === "win32"
            ? `start "" "${REPORT_FILE}"`
            : process.platform === "darwin"
                ? `open "${REPORT_FILE}"`
                : `xdg-open "${REPORT_FILE}"`;

    exec(
        command,
        error => {

            if (error) {

                console.log(
                    "Não foi possível abrir o navegador automaticamente."
                );

                console.log(
                    `Abra manualmente: file://${REPORT_FILE.replaceAll("\\", "/")}`
                );

                return;
            }

            console.log(
                "Relatório aberto no navegador padrão."
            );
        }
    );
}

/* ==================================================
   V2
   ================================================== */

async function testV2Metadata() {

    const url =
        `${V2}/$metadata`;

    const result =
        await request(
            "GET",
            url
        );

    record({
        category: "V2",
        test: "$metadata",
        method: "GET",
        url,
        expected: 200,
        received:
            result.status,
        responseBody:
            result.responseBody
    });
}

async function getSuppliersV2() {

    const url =
        `${V2}/A_Supplier`;

    const result =
        await request(
            "GET",
            url
        );

    const success =
        record({
            category: "V2",
            test:
                "Lista de fornecedores",
            method: "GET",
            url,
            expected: 200,
            received:
                result.status,
            responseBody:
                result.responseBody
        });

    if (!success) {
        return [];
    }

    return getV2Results(
        result.data
    );
}

async function testV2Individual(
    suppliers
) {

    const supplier =
        suppliers[0]?.Supplier;

    if (!supplier) {

        skip({
            category: "V2",
            test:
                "Fornecedor individual",
            reason:
                "Nenhum fornecedor disponível"
        });

        return;
    }

    const url =
        `${V2}/A_Supplier('${supplier}')`;

    const result =
        await request(
            "GET",
            url
        );

    record({
        category: "V2",
        test:
            "Fornecedor individual",
        method: "GET",
        url,
        expected: 200,
        received:
            result.status,
        responseBody:
            result.responseBody
    });
}

async function testV2Select() {

    const url =
        `${V2}/A_Supplier?$select=Supplier,SupplierName`;

    const result =
        await request(
            "GET",
            url
        );

    record({
        category: "V2",
        test: "$select",
        method: "GET",
        url,
        expected: 200,
        received:
            result.status,
        responseBody:
            result.responseBody
    });
}

async function testV2Filters(
    suppliers
) {

    const fields =
        Object.keys(
            suppliers[0] || {}
        ).filter(
            field =>
                field !== "__metadata"
        );

    if (!fields.length) {

        skip({
            category: "V2",
            test: "$filter",
            reason:
                "Nenhum campo disponível"
        });

        return;
    }

    for (const field of fields) {

        const item =
            suppliers.find(
                supplier =>
                    supplier[field] !==
                        null &&
                    supplier[field] !==
                        undefined &&
                    supplier[field] !==
                        ""
            );

        if (!item) {
            continue;
        }

        const value =
            item[field];

        if (
            typeof value !==
            "string"
        ) {
            continue;
        }

        const expression =
            `${field} eq '${value}'`;

        const url =
            `${V2}/A_Supplier?$filter=${encodeURIComponent(expression)}`;

        const result =
            await request(
                "GET",
                url
            );

        record({
            category: "V2",
            test:
                `$filter ${field}`,
            method: "GET",
            url,
            expected: 200,
            received:
                result.status,
            responseBody:
                result.responseBody
        });
    }
}

async function testV2OrderBy() {

    const url =
        `${V2}/A_Supplier?$orderby=SupplierName`;

    const result =
        await request(
            "GET",
            url
        );

    record({
        category: "V2",
        test: "$orderby",
        method: "GET",
        url,
        expected: 200,
        received:
            result.status,
        responseBody:
            result.responseBody
    });
}

async function testV2Skip() {

    const url =
        `${V2}/A_Supplier?$skip=2`;

    const result =
        await request(
            "GET",
            url
        );

    record({
        category: "V2",
        test: "$skip",
        method: "GET",
        url,
        expected: 200,
        received:
            result.status,
        responseBody:
            result.responseBody
    });
}

async function testV2Top() {

    const url =
        `${V2}/A_Supplier?$top=2`;

    const result =
        await request(
            "GET",
            url
        );

    record({
        category: "V2",
        test: "$top",
        method: "GET",
        url,
        expected: 200,
        received:
            result.status,
        responseBody:
            result.responseBody
    });
}

async function testV2SkipTop() {

    const url =
        `${V2}/A_Supplier?$skip=2&$top=2`;

    const result =
        await request(
            "GET",
            url
        );

    record({
        category: "V2",
        test:
            "$skip + $top",
        method: "GET",
        url,
        expected: 200,
        received:
            result.status,
        responseBody:
            result.responseBody
    });
}

async function testV2NotFound() {

    const supplier =
        "9999999999";

    const url =
        `${V2}/A_Supplier('${supplier}')`;

    const result =
        await request(
            "GET",
            url
        );

    record({
        category: "V2",
        test:
            "Fornecedor inexistente",
        method: "GET",
        url,
        expected: 404,
        received:
            result.status,
        responseBody:
            result.responseBody
    });
}

async function testV2Crud() {

    const supplier =
        String(
            Date.now()
        ).slice(-10);

    const collectionUrl =
        `${V2}/A_Supplier`;

    const entityUrl =
        `${V2}/A_Supplier('${supplier}')`;

    const createPayload = {

        Supplier:
            supplier,

        SupplierName:
            "FORNECEDOR TESTE FORSAP V2",

        SupplierFullName:
            "FORNECEDOR TESTE FORSAP V2 LTDA"
    };

    const create =
        await request(
            "POST",
            collectionUrl,
            {
                body:
                    createPayload
            }
        );

    record({
        category: "V2 CRUD",
        test:
            "CREATE fornecedor",
        method: "POST",
        url: collectionUrl,
        expected: 201,
        received:
            create.status,
        responseBody:
            create.responseBody
    });

    if (
        create.status !==
        201
    ) {
        return;
    }

    const read =
        await request(
            "GET",
            entityUrl
        );

    record({
        category: "V2 CRUD",
        test:
            "READ fornecedor",
        method: "GET",
        url: entityUrl,
        expected: 200,
        received:
            read.status,
        responseBody:
            read.responseBody
    });

    const patch =
        await request(
            "PATCH",
            entityUrl,
            {
                body: {
                    SupplierName:
                        "FORNECEDOR TESTE FORSAP V2 PATCH",

                    SupplierFullName:
                        "FORNECEDOR TESTE FORSAP V2 LTDA PATCH"
                }
            }
        );

    record({
        category: "V2 CRUD",
        test:
            "UPDATE fornecedor via PATCH",
        method: "PATCH",
        url: entityUrl,
        expected: 204,
        received:
            patch.status,
        responseBody:
            patch.responseBody
    });

    const readPatch =
        await request(
            "GET",
            entityUrl
        );

    record({
        category: "V2 CRUD",
        test:
            "READ após PATCH",
        method: "GET",
        url: entityUrl,
        expected: 200,
        received:
            readPatch.status,
        responseBody:
            readPatch.responseBody
    });

    const put =
        await request(
            "PUT",
            entityUrl,
            {
                body: {
                    SupplierName:
                        "FORNECEDOR TESTE FORSAP V2 PUT",

                    SupplierFullName:
                        "FORNECEDOR TESTE FORSAP V2 LTDA PUT"
                }
            }
        );

    record({
        category: "V2 CRUD",
        test:
            "UPDATE fornecedor via PUT",
        method: "PUT",
        url: entityUrl,
        expected: 204,
        received:
            put.status,
        responseBody:
            put.responseBody
    });

    const readPut =
        await request(
            "GET",
            entityUrl
        );

    record({
        category: "V2 CRUD",
        test:
            "READ após PUT",
        method: "GET",
        url: entityUrl,
        expected: 200,
        received:
            readPut.status,
        responseBody:
            readPut.responseBody
    });

    const merge =
        await request(
            "MERGE",
            entityUrl,
            {
                body: {
                    SupplierName:
                        "FORNECEDOR TESTE FORSAP V2 MERGE"
                }
            }
        );

    record({
        category: "V2 CRUD",
        test:
            "UPDATE fornecedor via MERGE",
        method: "MERGE",
        url: entityUrl,
        expected: 204,
        received:
            merge.status,
        responseBody:
            merge.responseBody
    });

    const readMerge =
        await request(
            "GET",
            entityUrl
        );

    record({
        category: "V2 CRUD",
        test:
            "READ após MERGE",
        method: "GET",
        url: entityUrl,
        expected: 200,
        received:
            readMerge.status,
        responseBody:
            readMerge.responseBody
    });

    const remove =
        await request(
            "DELETE",
            entityUrl
        );

    record({
        category: "V2 CRUD",
        test:
            "DELETE fornecedor",
        method: "DELETE",
        url: entityUrl,
        expected: 204,
        received:
            remove.status,
        responseBody:
            remove.responseBody
    });

    const readDeleted =
        await request(
            "GET",
            entityUrl
        );

    record({
        category: "V2 CRUD",
        test:
            "READ após DELETE",
        method: "GET",
        url: entityUrl,
        expected: 404,
        received:
            readDeleted.status,
        responseBody:
            readDeleted.responseBody
    });
}

/* ==================================================
   V4
   ================================================== */

async function testV4Metadata() {

    const url =
        `${V4}/$metadata`;

    const result =
        await request(
            "GET",
            url
        );

    record({
        category: "V4",
        test: "$metadata",
        method: "GET",
        url,
        expected: 200,
        received:
            result.status,
        responseBody:
            result.responseBody
    });
}

async function getSuppliersV4() {

    const url =
        `${V4}/A_Supplier`;

    const result =
        await request(
            "GET",
            url
        );

    const success =
        record({
            category: "V4",
            test:
                "Lista de fornecedores",
            method: "GET",
            url,
            expected: 200,
            received:
                result.status,
            responseBody:
                result.responseBody
        });

    if (!success) {
        return [];
    }

    return getV4Results(
        result.data
    );
}

async function testV4Individual(
    suppliers
) {

    const supplier =
        suppliers[0]?.Supplier;

    if (!supplier) {

        skip({
            category: "V4",
            test:
                "Fornecedor individual",
            reason:
                "Nenhum fornecedor disponível"
        });

        return;
    }

    const url =
        `${V4}/A_Supplier('${supplier}')`;

    const result =
        await request(
            "GET",
            url
        );

    record({
        category: "V4",
        test:
            "Fornecedor individual",
        method: "GET",
        url,
        expected: 200,
        received:
            result.status,
        responseBody:
            result.responseBody
    });
}

async function testV4Select() {

    const url =
        `${V4}/A_Supplier?$select=Supplier,SupplierName`;

    const result =
        await request(
            "GET",
            url
        );

    record({
        category: "V4",
        test: "$select",
        method: "GET",
        url,
        expected: 200,
        received:
            result.status,
        responseBody:
            result.responseBody
    });
}

async function testV4Filters(
    suppliers
) {

    const fields =
        Object.keys(
            suppliers[0] || {}
        ).filter(
            field =>
                field !== "__metadata"
        );

    if (!fields.length) {

        skip({
            category: "V4",
            test: "$filter",
            reason:
                "Nenhum campo disponível"
        });

        return;
    }

    for (const field of fields) {

        const item =
            suppliers.find(
                supplier =>
                    supplier[field] !==
                        null &&
                    supplier[field] !==
                        undefined &&
                    supplier[field] !==
                        ""
            );

        if (!item) {
            continue;
        }

        const value =
            item[field];

        if (
            typeof value !==
            "string"
        ) {
            continue;
        }

        const expression =
            `${field} eq '${value}'`;

        const url =
            `${V4}/A_Supplier?$filter=${encodeURIComponent(expression)}`;

        const result =
            await request(
                "GET",
                url
            );

        record({
            category: "V4",
            test:
                `$filter ${field}`,
            method: "GET",
            url,
            expected: 200,
            received:
                result.status,
            responseBody:
                result.responseBody
        });
    }
}

async function testV4OrderBy() {

    const url =
        `${V4}/A_Supplier?$orderby=SupplierName`;

    const result =
        await request(
            "GET",
            url
        );

    record({
        category: "V4",
        test: "$orderby",
        method: "GET",
        url,
        expected: 200,
        received:
            result.status,
        responseBody:
            result.responseBody
    });
}

async function testV4NotFound() {

    const supplier =
        "9999999999";

    const url =
        `${V4}/A_Supplier('${supplier}')`;

    const result =
        await request(
            "GET",
            url
        );

    record({
        category: "V4",
        test:
            "Fornecedor inexistente",
        method: "GET",
        url,
        expected: 404,
        received:
            result.status,
        responseBody:
            result.responseBody
    });
}

async function testV4Crud() {

    const supplier =
        String(
            Date.now()
        ).slice(-10);

    const collectionUrl =
        `${V4}/A_Supplier`;

    const entityUrl =
        `${V4}/A_Supplier('${supplier}')`;

    const createPayload = {

        Supplier:
            supplier,

        SupplierName:
            "FORNECEDOR TESTE FORSAP V4",

        SupplierFullName:
            "FORNECEDOR TESTE FORSAP V4 LTDA"
    };

    const create =
        await request(
            "POST",
            collectionUrl,
            {
                body:
                    createPayload
            }
        );

    record({
        category: "V4 CRUD",
        test:
            "CREATE fornecedor",
        method: "POST",
        url: collectionUrl,
        expected: 201,
        received:
            create.status,
        responseBody:
            create.responseBody
    });

    if (
        create.status !==
        201
    ) {
        return;
    }

    const read =
        await request(
            "GET",
            entityUrl
        );

    record({
        category: "V4 CRUD",
        test:
            "READ fornecedor",
        method: "GET",
        url: entityUrl,
        expected: 200,
        received:
            read.status,
        responseBody:
            read.responseBody
    });

    const patch =
        await request(
            "PATCH",
            entityUrl,
            {
                body: {
                    SupplierName:
                        "FORNECEDOR TESTE FORSAP V4 PATCH",

                    SupplierFullName:
                        "FORNECEDOR TESTE FORSAP V4 LTDA PATCH"
                }
            }
        );

    record({
        category: "V4 CRUD",
        test:
            "UPDATE fornecedor via PATCH",
        method: "PATCH",
        url: entityUrl,
        expected: 204,
        received:
            patch.status,
        responseBody:
            patch.responseBody
    });

    const readPatch =
        await request(
            "GET",
            entityUrl
        );

    record({
        category: "V4 CRUD",
        test:
            "READ após PATCH",
        method: "GET",
        url: entityUrl,
        expected: 200,
        received:
            readPatch.status,
        responseBody:
            readPatch.responseBody
    });

    const put =
        await request(
            "PUT",
            entityUrl,
            {
                body: {
                    SupplierName:
                        "FORNECEDOR TESTE FORSAP V4 PUT",

                    SupplierFullName:
                        "FORNECEDOR TESTE FORSAP V4 LTDA PUT"
                }
            }
        );

    record({
        category: "V4 CRUD",
        test:
            "UPDATE fornecedor via PUT",
        method: "PUT",
        url: entityUrl,
        expected: 204,
        received:
            put.status,
        responseBody:
            put.responseBody
    });

    const readPut =
        await request(
            "GET",
            entityUrl
        );

    record({
        category: "V4 CRUD",
        test:
            "READ após PUT",
        method: "GET",
        url: entityUrl,
        expected: 200,
        received:
            readPut.status,
        responseBody:
            readPut.responseBody
    });

    const remove =
        await request(
            "DELETE",
            entityUrl
        );

    record({
        category: "V4 CRUD",
        test:
            "DELETE fornecedor",
        method: "DELETE",
        url: entityUrl,
        expected: 204,
        received:
            remove.status,
        responseBody:
            remove.responseBody
    });

    const readDeleted =
        await request(
            "GET",
            entityUrl
        );

    record({
        category: "V4 CRUD",
        test:
            "READ após DELETE",
        method: "GET",
        url: entityUrl,
        expected: 404,
        received:
            readDeleted.status,
        responseBody:
            readDeleted.responseBody
    });
}

/* ==================================================
   MAIN
   ================================================== */

async function main() {

    testStartTime =
        new Date();

    console.log("");
    console.log(
        "=================================================="
    );
    console.log(
        " FOR SAP - SIMULADOR S/4HANA PRIVATE EDITION"
    );
    console.log(
        " TESTE ODATA V2 + V4"
    );
    console.log(
        "=================================================="
    );

    console.log(
        `Início: ${testStartTime.toLocaleString("pt-BR")}`
    );

    console.log(
        `Servidor: ${BASE_URL}`
    );

    console.log("");
    console.log(
        "========== ODATA V2 =========="
    );
    console.log("");

    await runTest(
        testV2Metadata
    );

    let suppliersV2 = [];

    try {

        suppliersV2 =
            await getSuppliersV2();

    } catch (error) {

        addResult({
            category: "V2",
            test:
                "Lista de fornecedores",
            method: "GET",
            url:
                `${V2}/A_Supplier`,
            expected: 200,
            received: "ERRO",
            responseBody: {
                error:
                    error?.message ||
                    String(error)
            },
            status: "ERRO"
        });
    }

    await runTest(
        () =>
            testV2Individual(
                suppliersV2
            )
    );

    await runTest(
        testV2Select
    );

    await runTest(
        () =>
            testV2Filters(
                suppliersV2
            )
    );

    await runTest(
        testV2OrderBy
    );

    await runTest(
        testV2Skip
    );

    await runTest(
        testV2Top
    );

    await runTest(
        testV2SkipTop
    );

    await runTest(
        testV2NotFound
    );

    await runTest(
        testV2Crud
    );

    console.log("");
    console.log(
        "========== ODATA V2 FINALIZADO =========="
    );
    console.log("");

    console.log(
        "========== ODATA V4 =========="
    );
    console.log("");

    await runTest(
        testV4Metadata
    );

    let suppliersV4 = [];

    try {

        suppliersV4 =
            await getSuppliersV4();

    } catch (error) {

        addResult({
            category: "V4",
            test:
                "Lista de fornecedores",
            method: "GET",
            url:
                `${V4}/A_Supplier`,
            expected: 200,
            received: "ERRO",
            responseBody: {
                error:
                    error?.message ||
                    String(error)
            },
            status: "ERRO"
        });
    }

    await runTest(
        () =>
            testV4Individual(
                suppliersV4
            )
    );

    await runTest(
        testV4Select
    );

    await runTest(
        () =>
            testV4Filters(
                suppliersV4
            )
    );

    await runTest(
        testV4OrderBy
    );

    await runTest(
        testV4NotFound
    );

    await runTest(
        testV4Crud
    );

    testEndTime =
        new Date();

    console.log("");
    console.log(
        "========== ODATA V4 FINALIZADO =========="
    );
    console.log("");

    const total =
        results.length;

    const passed =
        results.filter(
            item =>
                item.status ===
                "OK"
        ).length;

    const failed =
        results.filter(
            item =>
                item.status ===
                "ERRO"
        ).length;

    const ignored =
        results.filter(
            item =>
                item.status ===
                "IGNORADO"
        ).length;

    console.log(
        "=================================================="
    );

    console.log(
        " RESULTADO"
    );

    console.log(
        "=================================================="
    );

    console.log(
        `Total:     ${total}`
    );

    console.log(
        `OK:        ${passed}`
    );

    console.log(
        `Erros:     ${failed}`
    );

    console.log(
        `Ignorados: ${ignored}`
    );

    console.log(
        `Início:    ${testStartTime.toLocaleString("pt-BR")}`
    );

    console.log(
        `Fim:       ${testEndTime.toLocaleString("pt-BR")}`
    );

    console.log(
        "=================================================="
    );

    await writeReport();

    openBrowser();

    if (failed > 0) {

        process.exitCode =
            1;

    } else {

        process.exitCode =
            0;
    }
}

/* ==================================================
   EXECUÇÃO
   ================================================== */

main().catch(
    async error => {

        console.error("");
        console.error(
            "ERRO FATAL NO SCRIPT DE TESTE:"
        );

        console.error(
            error
        );

        testEndTime =
            new Date();

        try {
            await writeReport();
        } catch {
        }

        process.exitCode =
            1;
    }
);