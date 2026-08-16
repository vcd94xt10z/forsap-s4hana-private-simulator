const SERVICE_ROOT =
    "/sap/opu/odata4/sap/api_business_partner/srvd_a2x/sap/businesspartner/0001";

const SERVICE_NAME =
    "API_BUSINESS_PARTNER";

export default function registerBusinessPartnerODataV4(app) {
    app.locals.forsapODataV4 = {
        serviceName:
            SERVICE_NAME,
        serviceRoot:
            SERVICE_ROOT
    };
}
