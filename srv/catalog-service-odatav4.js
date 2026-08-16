const CATALOG_PATH =
    "/sap/opu/odata4/iwfnd/config/default/iwfnd/catalog/0002";

const BASE_URL =
    "http://localhost:4004";

const services = [
    {
        RepositoryId: "DEFAULT",
        ServiceId: "API_BUSINESS_PARTNER",
        ServiceVersion: "0001",
        ServiceType: null,
        IsReleasedC2: true,
        ServiceAlias: "",
        Description: "Business Partner",
        ServiceUrl:
            "/sap/opu/odata4/sap/api_business_partner/srvd_a2x/sap/businesspartner/0001/"
    }
];

function buildCatalog() {
    return {
        "@odata.context":
            "$metadata#ServiceGroups(DefaultSystem(Services()))",
        "@odata.metadataEtag":
            "W/\"FORSAP-CATALOG-V4\"",
        value: [
            {
                GroupId:
                    "API_BUSINESS_PARTNER",
                Description:
                    "Business Partner",
                DefaultSystem: {
                    SystemAlias:
                        "DEFAULT",
                    Description:
                        "Default System",
                    Services:
                        services
                }
            }
        ]
    };
}

function serviceGroups(req, res) {
    const result = buildCatalog();

    const filter =
        String(req.query.$filter || "");

    if (
        filter &&
        /ServiceId\s+eq\s+'/i.test(filter)
    ) {
        const match =
            filter.match(
                /ServiceId\s+eq\s+'([^']+)'/i
            );

        if (
            match &&
            match[1] !== "API_BUSINESS_PARTNER"
        ) {
            result.value[0].DefaultSystem.Services = [];
        }
    }

    return res.json(result);
}

function metadata(req, res) {
    res.type("application/xml");

    return res.send(
        `<?xml version="1.0" encoding="utf-8"?>` +
        `<edmx:Edmx Version="4.0" ` +
        `xmlns:edmx="http://docs.oasis-open.org/odata/ns/edmx">` +
        `<edmx:DataServices>` +
        `<Schema Namespace="IWFND.CATALOG" ` +
        `xmlns="http://docs.oasis-open.org/odata/ns/edm">` +
        `<EntityType Name="ServiceGroup">` +
        `<Key><PropertyRef Name="GroupId"/></Key>` +
        `<Property Name="GroupId" Type="Edm.String" Nullable="false"/>` +
        `<Property Name="Description" Type="Edm.String"/>` +
        `</EntityType>` +
        `<EntityContainer Name="CatalogContainer">` +
        `<EntitySet Name="ServiceGroups" ` +
        `EntityType="IWFND.CATALOG.ServiceGroup"/>` +
        `</EntityContainer>` +
        `</Schema>` +
        `</edmx:DataServices>` +
        `</edmx:Edmx>`
    );
}

export default function registerCatalogODataV4(app) {
    app.get(
        `${CATALOG_PATH}/$metadata`,
        metadata
    );

    app.get(
        `${CATALOG_PATH}/ServiceGroups`,
        serviceGroups
    );
}
