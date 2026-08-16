import fs from "node:fs/promises";
import path from "node:path";
import { exec } from "node:child_process";
import { fileURLToPath } from "node:url";

const BASE_URL = process.env.BASE_URL || "http://localhost:4004";

const V2_PATH = "/sap/opu/odata/sap/API_BUSINESS_PARTNER";
const V4_PATH = "/sap/opu/odata4/sap/api_business_partner/srvd_a2x/sap/businesspartner/0001";

const V2 = `${BASE_URL}${V2_PATH}`;
const V4 = `${BASE_URL}${V4_PATH}`;

const TEST_DIR = path.dirname(fileURLToPath(import.meta.url));
const RESULTS_FILE = path.join(TEST_DIR, "results.json");
const REPORT_URL = `${BASE_URL}/test/report.html`;

const results = [];

function addResult({
    category,
    test,
    method,
    url,
    expected,
    received,
    responseBody,
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

async function request(method, url, options = {}) {
    try {
        const response = await fetch(url, {
            method,
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                ...(options.headers || {})
            },
            body:
                options.body === undefined
                    ? undefined
                    : JSON.stringify(options.body)
        });

        const text = await response.text();

        let data = null;

        if (text) {
            try {
                data = JSON.parse(text);
            } catch {
                data = text;
            }
        }

        return {
            status: response.status,
            data,
            responseBody: data
        };

    } catch (error) {
        return {
            status: null,
            data: null,
            responseBody: error?.message || "Erro de conexão"
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
    const success = received === expected;

    addResult({
        category,
        test,
        method,
        url,
        expected,
        received: received ?? "ERRO",
        responseBody,
        status: success ? "OK" : "ERRO"
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
        test: `${test} (${reason})`,
        method,
        url,
        expected: "-",
        received: "-",
        responseBody: null,
        status: "IGNORADO"
    });
}

function getV2Results(data) {
    return data?.d?.results ?? [];
}

function getV4Results(data) {
    return data?.value ?? [];
}

async function testV2Metadata() {
    const url = `${V2}/$metadata`;

    const result = await request("GET", url);

    record({
        category: "V2",
        test: "$metadata",
        method: "GET",
        url,
        expected: 200,
        received: result.status,
        responseBody: result.responseBody
    });
}

async function getSuppliersV2() {
    const url = `${V2}/A_Supplier`;

    const result = await request("GET", url);

    const success = record({
        category: "V2",
        test: "Lista de fornecedores",
        method: "GET",
        url,
        expected: 200,
        received: result.status,
        responseBody: result.responseBody
    });

    if (!success) {
        return [];
    }

    return getV2Results(result.data);
}

async function testV2Individual(suppliers) {
    const supplier = suppliers[0]?.Supplier;

    if (!supplier) {
        skip({
            category: "V2",
            test: "Fornecedor individual",
            reason: "Nenhum fornecedor disponível"
        });

        return;
    }

    const url = `${V2}/A_Supplier('${supplier}')`;

    const result = await request("GET", url);

    record({
        category: "V2",
        test: `Fornecedor individual ${supplier}`,
        method: "GET",
        url,
        expected: 200,
        received: result.status,
        responseBody: result.responseBody
    });
}

async function testV2Select() {
    const url =
        `${V2}/A_Supplier?$select=Supplier,SupplierName`;

    const result = await request("GET", url);

    record({
        category: "V2",
        test: "$select",
        method: "GET",
        url,
        expected: 200,
        received: result.status,
        responseBody: result.responseBody
    });
}

async function testV2Filters(suppliers) {
    const fields = Object.keys(
        suppliers[0] || {}
    ).filter(
        field =>
            field !== "__metadata" &&
            suppliers.some(
                item =>
                    item[field] !== null &&
                    item[field] !== undefined &&
                    item[field] !== ""
            )
    );

    if (!fields.length) {
        skip({
            category: "V2",
            test: "$filter",
            reason: "Nenhum campo disponível"
        });

        return;
    }

    for (const field of fields) {
        const sample = suppliers.find(
            item =>
                item[field] !== null &&
                item[field] !== undefined &&
                item[field] !== ""
        )?.[field];

        if (typeof sample !== "string") {
            continue;
        }

        const filter =
            `${field} eq '${sample}'`;

        const url =
            `${V2}/A_Supplier?$filter=${encodeURIComponent(filter)}`;

        const result = await request("GET", url);

        record({
            category: "V2",
            test: `$filter ${field}`,
            method: "GET",
            url,
            expected: 200,
            received: result.status,
            responseBody: result.responseBody
        });
    }
}

async function testV2OrderBy() {
    const url =
        `${V2}/A_Supplier?$orderby=SupplierName`;

    const result = await request("GET", url);

    record({
        category: "V2",
        test: "$orderby",
        method: "GET",
        url,
        expected: 200,
        received: result.status,
        responseBody: result.responseBody
    });
}

async function testV2Skip() {
    const url =
        `${V2}/A_Supplier?$skip=2`;

    const result = await request("GET", url);

    record({
        category: "V2",
        test: "$skip",
        method: "GET",
        url,
        expected: 200,
        received: result.status,
        responseBody: result.responseBody
    });
}

async function testV2Top() {
    const url =
        `${V2}/A_Supplier?$top=2`;

    const result = await request("GET", url);

    record({
        category: "V2",
        test: "$top",
        method: "GET",
        url,
        expected: 200,
        received: result.status,
        responseBody: result.responseBody
    });
}

async function testV2SkipTop() {
    const url =
        `${V2}/A_Supplier?$skip=2&$top=2`;

    const result = await request("GET", url);

    record({
        category: "V2",
        test: "$skip + $top",
        method: "GET",
        url,
        expected: 200,
        received: result.status,
        responseBody: result.responseBody
    });
}

async function testV2NotFound(suppliers) {
    const existing = new Set(
        suppliers.map(
            item => String(item.Supplier)
        )
    );

    let supplier = "9999999999";

    while (existing.has(supplier)) {
        supplier = String(
            Number(supplier) + 1
        );
    }

    const url =
        `${V2}/A_Supplier('${supplier}')`;

    const result = await request("GET", url);

    record({
        category: "V2",
        test: "Fornecedor inexistente",
        method: "GET",
        url,
        expected: 404,
        received: result.status,
        responseBody: result.responseBody
    });
}

async function testV2Crud() {
    const supplier =
        String(Date.now())
            .slice(-10)
            .padStart(10, "9");

    const collectionUrl =
        `${V2}/A_Supplier`;

    const entityUrl =
        `${V2}/A_Supplier('${supplier}')`;

    const payload = {
        Supplier: supplier,
        SupplierName: "FORNECEDOR TESTE FORSAP",
        SupplierFullName:
            "FORNECEDOR TESTE FORSAP LTDA"
    };

    const create = await request(
        "POST",
        collectionUrl,
        {
            body: payload
        }
    );

    record({
        category: "V2 CRUD",
        test: "CREATE fornecedor",
        method: "POST",
        url: collectionUrl,
        expected: 201,
        received: create.status,
        responseBody: create.responseBody
    });

    const read = await request(
        "GET",
        entityUrl
    );

    record({
        category: "V2 CRUD",
        test: "READ fornecedor",
        method: "GET",
        url: entityUrl,
        expected: 200,
        received: read.status,
        responseBody: read.responseBody
    });

    const updatePayload = {
        SupplierName:
            "FORNECEDOR TESTE FORSAP ATUALIZADO",
        SupplierFullName:
            "FORNECEDOR TESTE FORSAP LTDA ATUALIZADO"
    };

    const update = await request(
        "PATCH",
        entityUrl,
        {
            body: updatePayload
        }
    );

    record({
        category: "V2 CRUD",
        test: "UPDATE fornecedor",
        method: "PATCH",
        url: entityUrl,
        expected: 204,
        received: update.status,
        responseBody: update.responseBody
    });

    const readUpdated = await request(
        "GET",
        entityUrl
    );

    record({
        category: "V2 CRUD",
        test: "READ após UPDATE",
        method: "GET",
        url: entityUrl,
        expected: 200,
        received: readUpdated.status,
        responseBody: readUpdated.responseBody
    });

    const remove = await request(
        "DELETE",
        entityUrl
    );

    record({
        category: "V2 CRUD",
        test: "DELETE fornecedor",
        method: "DELETE",
        url: entityUrl,
        expected: 204,
        received: remove.status,
        responseBody: remove.responseBody
    });

    const readDeleted = await request(
        "GET",
        entityUrl
    );

    record({
        category: "V2 CRUD",
        test: "READ após DELETE",
        method: "GET",
        url: entityUrl,
        expected: 404,
        received: readDeleted.status,
        responseBody: readDeleted.responseBody
    });
}

async function testV4Metadata() {
    const url = `${V4}/$metadata`;

    const result = await request("GET", url);

    record({
        category: "V4",
        test: "$metadata",
        method: "GET",
        url,
        expected: 200,
        received: result.status,
        responseBody: result.responseBody
    });
}

async function getSuppliersV4() {
    const url = `${V4}/A_Supplier`;

    const result = await request("GET", url);

    const success = record({
        category: "V4",
        test: "Lista de fornecedores",
        method: "GET",
        url,
        expected: 200,
        received: result.status,
        responseBody: result.responseBody
    });

    if (!success) {
        return [];
    }

    return getV4Results(result.data);
}

async function testV4Individual(suppliers) {
    const supplier = suppliers[0]?.Supplier;

    if (!supplier) {
        skip({
            category: "V4",
            test: "Fornecedor individual",
            reason: "Nenhum fornecedor disponível"
        });

        return;
    }

    const url =
        `${V4}/A_Supplier('${supplier}')`;

    const result = await request("GET", url);

    record({
        category: "V4",
        test: `Fornecedor individual ${supplier}`,
        method: "GET",
        url,
        expected: 200,
        received: result.status,
        responseBody: result.responseBody
    });
}

async function testV4Select() {
    const url =
        `${V4}/A_Supplier?$select=Supplier,SupplierName`;

    const result = await request("GET", url);

    record({
        category: "V4",
        test: "$select",
        method: "GET",
        url,
        expected: 200,
        received: result.status,
        responseBody: result.responseBody
    });
}

async function testV4Filters(suppliers) {
    const fields = Object.keys(
        suppliers[0] || {}
    ).filter(
        field =>
            suppliers.some(
                item =>
                    item[field] !== null &&
                    item[field] !== undefined &&
                    item[field] !== ""
            )
    );

    if (!fields.length) {
        skip({
            category: "V4",
            test: "$filter",
            reason: "Nenhum campo disponível"
        });

        return;
    }

    for (const field of fields) {
        const sample = suppliers.find(
            item =>
                item[field] !== null &&
                item[field] !== undefined &&
                item[field] !== ""
        )?.[field];

        if (typeof sample !== "string") {
            continue;
        }

        const filter =
            `${field} eq '${sample}'`;

        const url =
            `${V4}/A_Supplier?$filter=${encodeURIComponent(filter)}`;

        const result = await request("GET", url);

        record({
            category: "V4",
            test: `$filter ${field}`,
            method: "GET",
            url,
            expected: 200,
            received: result.status,
            responseBody: result.responseBody
        });
    }
}

async function testV4OrderBy() {
    const url =
        `${V4}/A_Supplier?$orderby=SupplierName`;

    const result = await request("GET", url);

    record({
        category: "V4",
        test: "$orderby",
        method: "GET",
        url,
        expected: 200,
        received: result.status,
        responseBody: result.responseBody
    });
}

async function testV4NotFound(suppliers) {
    const existing = new Set(
        suppliers.map(
            item => String(item.Supplier)
        )
    );

    let supplier = "9999999999";

    while (existing.has(supplier)) {
        supplier = String(
            Number(supplier) + 1
        );
    }

    const url =
        `${V4}/A_Supplier('${supplier}')`;

    const result = await request("GET", url);

    record({
        category: "V4",
        test: "Fornecedor inexistente",
        method: "GET",
        url,
        expected: 404,
        received: result.status,
        responseBody: result.responseBody
    });
}

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function serializeResponseBody(body) {
    if (
        body === null ||
        body === undefined
    ) {
        return "";
    }

    if (typeof body === "string") {
        try {
            return JSON.stringify(
                JSON.parse(body),
                null,
                2
            );
        } catch {
            return body;
        }
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

function resultIcon(status) {
    if (status === "OK") {
        return "✓ OK";
    }

    if (status === "ERRO") {
        return "✕ ERRO";
    }

    return "⚠ IGNORADO";
}

function resultClass(status) {
    if (status === "OK") {
        return "ok";
    }

    if (status === "ERRO") {
        return "error";
    }

    return "skip";
}

function formatDateTime(date) {
    return date.toLocaleString("pt-BR");
}

async function writeResults(testStartTime, testEndTime) {
    const passed = results.filter(
        item => item.status === "OK"
    ).length;

    const failed = results.filter(
        item => item.status === "ERRO"
    ).length;

    const skipped = results.filter(
        item => item.status === "IGNORADO"
    ).length;

    const output = {
        metadata: {
            project:
                "FORSAP S/4HANA Private Simulator",
            server:
                BASE_URL,
            startTime:
                testStartTime.toISOString(),
            endTime:
                testEndTime.toISOString()
        },
        summary: {
            total:
                results.length,
            ok:
                passed,
            errors:
                failed,
            ignored:
                skipped
        },
        results
    };

    await fs.mkdir(
        TEST_DIR,
        {
            recursive: true
        }
    );

    await fs.writeFile(
        RESULTS_FILE,
        JSON.stringify(
            output,
            null,
            2
        ),
        "utf8"
    );
}

function openInDefaultBrowser(url) {
    if (process.platform !== "win32") {
        return;
    }

    exec(
        `start "" "${url}"`,
        () => {}
    );
}

async function runTest(testFunction) {
    try {
        await testFunction();
    } catch (error) {
        addResult({
            category: "EXECUÇÃO",
            test: testFunction.name,
            method: "-",
            url: "-",
            expected: "-",
            received: "ERRO",
            responseBody: error?.stack || error?.message || String(error),
            status: "ERRO"
        });
    }
}

async function main() {
    const testStartTime = new Date();

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
            test: "Lista de fornecedores",
            method: "GET",
            url: `${V2}/A_Supplier`,
            expected: 200,
            received: "ERRO",
            responseBody:
                error?.stack ||
                error?.message ||
                String(error),
            status: "ERRO"
        });
    }

    await runTest(
        () => testV2Individual(suppliersV2)
    );

    await runTest(
        testV2Select
    );

    await runTest(
        () => testV2Filters(suppliersV2)
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
        () => testV2NotFound(suppliersV2)
    );

    await runTest(
        testV2Crud
    );

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
            test: "Lista de fornecedores",
            method: "GET",
            url: `${V4}/A_Supplier`,
            expected: 200,
            received: "ERRO",
            responseBody:
                error?.stack ||
                error?.message ||
                String(error),
            status: "ERRO"
        });
    }

    await runTest(
        () => testV4Individual(suppliersV4)
    );

    await runTest(
        testV4Select
    );

    await runTest(
        () => testV4Filters(suppliersV4)
    );

    await runTest(
        testV4OrderBy
    );

    await runTest(
        () => testV4NotFound(suppliersV4)
    );
const testEndTime = new Date();

    await writeResults(
        testStartTime,
        testEndTime
    );

    console.log(
        "Resultado dos testes:"
    );

    console.log(
        REPORT_URL
    );

    console.log(
        "Abrindo resultado no navegador padrão..."
    );

    openInDefaultBrowser(
        REPORT_URL
    );

    const failed = results.filter(
        item => item.status === "ERRO"
    ).length;

    if (failed > 0) {
        process.exitCode = 1;
    }
}

main();
