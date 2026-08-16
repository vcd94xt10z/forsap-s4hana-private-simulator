import cds from "@sap/cds";
import express from "express";

import registerCatalogODataV2 from "./catalog-service-odatav2.js";
import registerCatalogODataV4 from "./catalog-service-odatav4.js";
import registerBusinessPartnerODataV2 from "./business-partner-service-odatav2.js";
import registerBusinessPartnerODataV4 from "./business-partner-service-odatav4.js";

cds.on("bootstrap", app => {
    app.use(express.json());

    registerCatalogODataV2(app);
    registerCatalogODataV4(app);
    registerBusinessPartnerODataV2(app);
    registerBusinessPartnerODataV4(app);
});

export default cds.server;
