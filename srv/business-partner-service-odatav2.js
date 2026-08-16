import cds from "@sap/cds";
import { fileURLToPath } from "url";

const BASE_PATH =
    "/sap/opu/odata/sap/API_BUSINESS_PARTNER";

const ENTITY =
    "forsap.s4hana.A_Supplier";

const ENTITY_ROUTE =
    /^\/sap\/opu\/odata\/sap\/API_BUSINESS_PARTNER\/A_Supplier\('([^']+)'\)$/;

function errorResponse(code, message) {
    return {
        error: {
            code,
            message
        }
    };
}

async function getSupplier(db, supplier) {
    return db.run(
        SELECT.one
            .from(ENTITY)
            .where({
                Supplier: supplier
            })
    );
}

async function updateSupplier(req, res) {
    try {
        const db =
            await cds.connect.to("db");

        const supplier =
            req.params[0];

        const payload =
            req.body;

        if (
            !payload ||
            typeof payload !== "object" ||
            Array.isArray(payload)
        ) {
            return res.status(400).json(
                errorResponse(
                    "BAD_REQUEST",
                    "Request body inválido."
                )
            );
        }

        const existing =
            await getSupplier(
                db,
                supplier
            );

        if (!existing) {
            return res.status(404).json(
                errorResponse(
                    "NOT_FOUND",
                    `Fornecedor '${supplier}' não encontrado.`
                )
            );
        }

        const updateData =
            { ...payload };

        delete updateData.Supplier;
        delete updateData.__metadata;

        if (
            Object.keys(updateData).length > 0
        ) {
            await db.run(
                UPDATE(ENTITY)
                    .set(updateData)
                    .where({
                        Supplier: supplier
                    })
            );
        }

        return res.status(204).send();
    } catch (error) {
        console.error(error);

        return res.status(500).json(
            errorResponse(
                "INTERNAL_ERROR",
                error.message
            )
        );
    }
}

async function listSuppliers(req, res) {
    try {
        const db =
            await cds.connect.to("db");

        let query =
            SELECT.from(ENTITY);

        const {
            $select,
            $filter,
            $orderby,
            $top,
            $skip
        } = req.query;

        if ($select) {
            const columns =
                $select
                    .split(",")
                    .map(
                        field => field.trim()
                    )
                    .filter(Boolean);

            if (columns.length > 0) {
                query.columns(
                    ...columns
                );
            }
        }

        if ($filter) {
            const match =
                $filter.match(
                    /^([A-Za-z0-9_]+)\s+(eq|ne|gt|ge|lt|le)\s+'([^']*)'$/
                );

            if (match) {
                const [
                    ,
                    field,
                    operator,
                    value
                ] = match;

                const operators = {
                    eq: "=",
                    ne: "!=",
                    gt: ">",
                    ge: ">=",
                    lt: "<",
                    le: "<="
                };

                query.where({
                    [field]: {
                        [operators[operator]]:
                            value
                    }
                });
            }
        }

        if ($orderby) {
            const [
                field,
                direction = "asc"
            ] =
                $orderby
                    .split(",")[0]
                    .trim()
                    .split(/\s+/);

            query.orderBy({
                ref: [field],
                sort:
                    direction.toLowerCase() === "desc"
                        ? "desc"
                        : "asc"
            });
        }

        let suppliers =
            await db.run(query);

        const skip =
            $skip !== undefined
                ? Number($skip)
                : 0;

        const top =
            $top !== undefined
                ? Number($top)
                : undefined;

        if (
            !Number.isNaN(skip) &&
            skip >= 0
        ) {
            if (
                top !== undefined &&
                !Number.isNaN(top) &&
                top >= 0
            ) {
                suppliers =
                    suppliers.slice(
                        skip,
                        skip + top
                    );
            } else {
                suppliers =
                    suppliers.slice(skip);
            }
        }

        return res.status(200).json({
            d: {
                results: suppliers
            }
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json(
            errorResponse(
                "INTERNAL_ERROR",
                error.message
            )
        );
    }
}

async function getSupplierByRoute(req, res) {
    try {
        const db =
            await cds.connect.to("db");

        const supplier =
            req.params[0];

        const result =
            await getSupplier(
                db,
                supplier
            );

        if (!result) {
            return res.status(404).json(
                errorResponse(
                    "NOT_FOUND",
                    `Fornecedor '${supplier}' não encontrado.`
                )
            );
        }

        return res.status(200).json({
            d: result
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json(
            errorResponse(
                "INTERNAL_ERROR",
                error.message
            )
        );
    }
}

async function createSupplier(req, res) {
    try {
        const db =
            await cds.connect.to("db");

        const payload =
            req.body;

        if (
            !payload ||
            typeof payload !== "object" ||
            Array.isArray(payload)
        ) {
            return res.status(400).json(
                errorResponse(
                    "BAD_REQUEST",
                    "Request body inválido."
                )
            );
        }

        if (
            payload.Supplier === undefined ||
            payload.Supplier === null ||
            String(payload.Supplier).trim() === ""
        ) {
            return res.status(400).json(
                errorResponse(
                    "MISSING_KEY",
                    "O campo Supplier é obrigatório."
                )
            );
        }

        const supplier =
            String(payload.Supplier);

        const existing =
            await getSupplier(
                db,
                supplier
            );

        if (existing) {
            return res.status(400).json(
                errorResponse(
                    "DUPLICATE_ENTRY",
                    `O fornecedor '${supplier}' já existe.`
                )
            );
        }

        const entry =
            { ...payload };

        delete entry.__metadata;

        await db.run(
            INSERT.into(ENTITY)
                .entries(entry)
        );

        const created =
            await getSupplier(
                db,
                supplier
            );

        return res.status(201).json({
            d: created
        });
    } catch (error) {
        console.error(error);

        return res.status(500).json(
            errorResponse(
                "INTERNAL_ERROR",
                error.message
            )
        );
    }
}

async function deleteSupplier(req, res) {
    try {
        const db =
            await cds.connect.to("db");

        const supplier =
            req.params[0];

        const existing =
            await getSupplier(
                db,
                supplier
            );

        if (!existing) {
            return res.status(404).json(
                errorResponse(
                    "NOT_FOUND",
                    `Fornecedor '${supplier}' não encontrado.`
                )
            );
        }

        await db.run(
            DELETE.from(ENTITY)
                .where({
                    Supplier: supplier
                })
        );

        return res.status(204).send();
    } catch (error) {
        console.error(error);

        return res.status(500).json(
            errorResponse(
                "INTERNAL_ERROR",
                error.message
            )
        );
    }
}

export default function registerBusinessPartnerODataV2(app) {
    const metadataPath =
        fileURLToPath(
            new URL(
                "./external/OP_API_BUSINESS_PARTNER_SRV.edmx",
                import.meta.url
            )
        );

    app.get(
        `${BASE_PATH}/$metadata`,
        (req, res) => {
            res.type("application/xml");
            res.sendFile(metadataPath);
        }
    );

    app.get(
        `${BASE_PATH}/A_Supplier`,
        listSuppliers
    );

    app.get(
        ENTITY_ROUTE,
        getSupplierByRoute
    );

    app.post(
        `${BASE_PATH}/A_Supplier`,
        createSupplier
    );

    app.patch(
        ENTITY_ROUTE,
        updateSupplier
    );

    app.put(
        ENTITY_ROUTE,
        updateSupplier
    );

    app.use((req, res, next) => {
        if (
            req.method === "MERGE" &&
            ENTITY_ROUTE.test(req.path)
        ) {
            return updateSupplier(
                req,
                res
            );
        }

        return next();
    });

    app.delete(
        ENTITY_ROUTE,
        deleteSupplier
    );
}
