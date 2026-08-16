const CATALOG_PATH =
    "/sap/opu/odata/IWFND/CATALOGSERVICE;v=2";

const SERVICE_COLLECTION =
    `${CATALOG_PATH}/ServiceCollection`;

function getOrigin(req) {
    const protocol =
        req.headers["x-forwarded-proto"] ||
        req.protocol ||
        "http";

    const host =
        req.headers["x-forwarded-host"] ||
        req.get("host");

    return `${protocol}://${host}`;
}

function getServices(req) {
    const origin =
        getOrigin(req);

    return [
        {
            ID:
                "/IWFND/API_BUSINESS_PARTNER",
            Description:
                "Business Partner",
            Title:
                "API_BUSINESS_PARTNER",
            Author:
                "SAP",
            TechnicalServiceVersion:
                1,
            MetadataUrl:
                `${origin}/sap/opu/odata/sap/API_BUSINESS_PARTNER/$metadata`,
            TechnicalServiceName:
                "API_BUSINESS_PARTNER",
            ImageUrl:
                "",
            ServiceUrl:
                `${origin}/sap/opu/odata/sap/API_BUSINESS_PARTNER/`,
            UpdatedDate:
                "2026-08-16T00:00:00"
        }
    ];
}

function wantsJson(req) {
    const format =
        String(
            req.query.$format || ""
        ).toLowerCase();

    if (format === "json") {
        return true;
    }

    const accept =
        String(
            req.headers.accept || ""
        ).toLowerCase();

    return accept.includes(
        "application/json"
    );
}

function serviceDocument(req, res) {
    if (wantsJson(req)) {
        return res.json({
            d: {
                EntitySets: [
                    "ServiceCollection",
                    "EntitySetCollection",
                    "TagCollection",
                    "Annotations",
                    "Vocabularies",
                    "CatalogCollection"
                ]
            }
        });
    }

    res.type("application/xml");

    return res.send(
        `<?xml version="1.0" encoding="utf-8"?>` +
        `<service ` +
        `xml:base="${getOrigin(req)}${CATALOG_PATH}/" ` +
        `xmlns="http://www.w3.org/2007/app" ` +
        `xmlns:atom="http://www.w3.org/2005/Atom">` +
        `<workspace>` +
        `<atom:title>Catalog Service</atom:title>` +
        `<collection href="ServiceCollection">` +
        `<atom:title>ServiceCollection</atom:title>` +
        `</collection>` +
        `<collection href="EntitySetCollection">` +
        `<atom:title>EntitySetCollection</atom:title>` +
        `</collection>` +
        `<collection href="TagCollection">` +
        `<atom:title>TagCollection</atom:title>` +
        `</collection>` +
        `<collection href="Annotations">` +
        `<atom:title>Annotations</atom:title>` +
        `</collection>` +
        `<collection href="Vocabularies">` +
        `<atom:title>Vocabularies</atom:title>` +
        `</collection>` +
        `<collection href="CatalogCollection">` +
        `<atom:title>CatalogCollection</atom:title>` +
        `</collection>` +
        `</workspace>` +
        `</service>`
    );
}

function metadata(req, res) {
    const origin =
        getOrigin(req);

    res.type("application/xml");

    return res.send(
        `<?xml version="1.0" encoding="utf-8"?>` +
        `<edmx:Edmx ` +
        `xmlns:edmx="http://schemas.microsoft.com/ado/2007/06/edmx" ` +
        `xmlns:m="http://schemas.microsoft.com/ado/2007/08/dataservices/metadata" ` +
        `xmlns:sap="http://www.sap.com/Protocols/SAPData" ` +
        `Version="1.0">` +
        `<edmx:DataServices m:DataServiceVersion="2.0">` +
        `<Schema ` +
        `Namespace="CATALOGSERVICE" ` +
        `xml:lang="en" ` +
        `xmlns="http://schemas.microsoft.com/ado/2008/09/edm">` +

        `<EntityType Name="Service" sap:content-version="2">` +
        `<Key>` +
        `<PropertyRef Name="ID"/>` +
        `</Key>` +

        `<Property Name="ID" ` +
        `Type="Edm.String" ` +
        `Nullable="false" ` +
        `MaxLength="40" ` +
        `sap:label="Identifier" ` +
        `sap:creatable="false" ` +
        `sap:updatable="false" ` +
        `sap:filterable="false"/>` +

        `<Property Name="Description" ` +
        `Type="Edm.String" ` +
        `Nullable="false" ` +
        `MaxLength="60" ` +
        `m:FC_KeepInContent="true" ` +
        `m:FC_TargetPath="SyndicationTitle" ` +
        `sap:label="Description" ` +
        `sap:creatable="false" ` +
        `sap:updatable="false" ` +
        `sap:filterable="false"/>` +

        `<Property Name="Title" ` +
        `Type="Edm.String" ` +
        `Nullable="false" ` +
        `MaxLength="40" ` +
        `sap:label="External Name" ` +
        `sap:creatable="false" ` +
        `sap:updatable="false"/>` +

        `<Property Name="Author" ` +
        `Type="Edm.String" ` +
        `Nullable="false" ` +
        `MaxLength="12" ` +
        `m:FC_KeepInContent="true" ` +
        `m:FC_TargetPath="SyndicationAuthorName" ` +
        `sap:label="User Name" ` +
        `sap:creatable="false" ` +
        `sap:updatable="false"/>` +

        `<Property Name="TechnicalServiceVersion" ` +
        `Type="Edm.Int16" ` +
        `Nullable="false" ` +
        `sap:label="Technical Service Version" ` +
        `sap:creatable="false"/>` +

        `<Property Name="MetadataUrl" ` +
        `Type="Edm.String" ` +
        `Nullable="false" ` +
        `sap:creatable="false" ` +
        `sap:updatable="false" ` +
        `sap:filterable="false"/>` +

        `<Property Name="TechnicalServiceName" ` +
        `Type="Edm.String" ` +
        `Nullable="false" ` +
        `MaxLength="35" ` +
        `sap:label="Technical Service Name" ` +
        `sap:creatable="false"/>` +

        `<Property Name="ImageUrl" ` +
        `Type="Edm.String" ` +
        `Nullable="false" ` +
        `sap:creatable="false" ` +
        `sap:updatable="false" ` +
        `sap:filterable="false"/>` +

        `<Property Name="ServiceUrl" ` +
        `Type="Edm.String" ` +
        `Nullable="false" ` +
        `sap:creatable="false" ` +
        `sap:updatable="false" ` +
        `sap:filterable="false"/>` +

        `<Property Name="UpdatedDate" ` +
        `Type="Edm.DateTime" ` +
        `Nullable="false" ` +
        `Precision="0" ` +
        `m:FC_KeepInContent="true" ` +
        `m:FC_TargetPath="SyndicationUpdated" ` +
        `sap:label="Time Stamp" ` +
        `sap:creatable="false" ` +
        `sap:updatable="false" ` +
        `sap:filterable="false"/>` +

        `</EntityType>` +

        `<EntityType Name="EntitySet" sap:content-version="2">` +
        `<Key>` +
        `<PropertyRef Name="ID"/>` +
        `<PropertyRef Name="SrvIdentifier"/>` +
        `</Key>` +
        `<Property Name="ID" Type="Edm.String" Nullable="false"/>` +
        `<Property Name="SrvIdentifier" Type="Edm.String" Nullable="false"/>` +
        `<Property Name="Description" Type="Edm.String" Nullable="false"/>` +
        `<Property Name="TechnicalServiceName" Type="Edm.String" Nullable="false"/>` +
        `<Property Name="TechnicalServiceVersion" Type="Edm.String" Nullable="false"/>` +
        `</EntityType>` +

        `<EntityContainer Name="CATALOGSERVICE_Entities" ` +
        `m:IsDefaultEntityContainer="true">` +

        `<EntitySet Name="ServiceCollection" ` +
        `EntityType="CATALOGSERVICE.Service" ` +
        `sap:creatable="false" ` +
        `sap:updatable="false" ` +
        `sap:deletable="false" ` +
        `sap:searchable="true" ` +
        `sap:content-version="2"/>` +

        `<EntitySet Name="EntitySetCollection" ` +
        `EntityType="CATALOGSERVICE.EntitySet" ` +
        `sap:creatable="false" ` +
        `sap:updatable="false" ` +
        `sap:deletable="false" ` +
        `sap:content-version="2"/>` +

        `</EntityContainer>` +

        `<atom:link ` +
        `xmlns:atom="http://www.w3.org/2005/Atom" ` +
        `rel="self" ` +
        `href="${origin}${CATALOG_PATH}/$metadata"/>` +

        `<atom:link ` +
        `xmlns:atom="http://www.w3.org/2005/Atom" ` +
        `rel="latest-version" ` +
        `href="${origin}${CATALOG_PATH}/$metadata"/>` +

        `</Schema>` +
        `</edmx:DataServices>` +
        `</edmx:Edmx>`
    );
}

function serviceCollection(req, res) {
    const services =
        getServices(req);

    if (wantsJson(req)) {
        return res.json({
            d: {
                results: services
            }
        });
    }

    res.type("application/xml");

    const entries =
        services.map(service =>
            `<entry>` +
            `<id>${service.ID}</id>` +
            `<title>${service.Title}</title>` +
            `<updated>${service.UpdatedDate}</updated>` +
            `<author>` +
            `<name>${service.Author}</name>` +
            `</author>` +
            `<content type="application/xml">` +
            `<m:properties ` +
            `xmlns:m="http://schemas.microsoft.com/ado/2007/08/dataservices/metadata" ` +
            `xmlns:d="http://schemas.microsoft.com/ado/2007/08/dataservices">` +

            `<d:ID>${service.ID}</d:ID>` +
            `<d:Description>${service.Description}</d:Description>` +
            `<d:Title>${service.Title}</d:Title>` +
            `<d:Author>${service.Author}</d:Author>` +
            `<d:TechnicalServiceVersion>${service.TechnicalServiceVersion}</d:TechnicalServiceVersion>` +
            `<d:MetadataUrl>${service.MetadataUrl}</d:MetadataUrl>` +
            `<d:TechnicalServiceName>${service.TechnicalServiceName}</d:TechnicalServiceName>` +
            `<d:ImageUrl>${service.ImageUrl}</d:ImageUrl>` +
            `<d:ServiceUrl>${service.ServiceUrl}</d:ServiceUrl>` +
            `<d:UpdatedDate>${service.UpdatedDate}</d:UpdatedDate>` +

            `</m:properties>` +
            `</content>` +
            `</entry>`
        ).join("");

    return res.send(
        `<?xml version="1.0" encoding="utf-8"?>` +
        `<feed ` +
        `xmlns="http://www.w3.org/2005/Atom" ` +
        `xmlns:m="http://schemas.microsoft.com/ado/2007/08/dataservices/metadata">` +
        `<title>ServiceCollection</title>` +
        entries +
        `</feed>`
    );
}

function entitySetCollection(req, res) {
    const services =
        getServices(req);

    const entitySets = [
        {
            ID:
                "A_Supplier",
            SrvIdentifier:
                services[0].ID,
            Description:
                "Supplier",
            TechnicalServiceName:
                services[0].TechnicalServiceName,
            TechnicalServiceVersion:
                "1"
        }
    ];

    if (wantsJson(req)) {
        return res.json({
            d: {
                results: entitySets
            }
        });
    }

    res.type("application/xml");

    const entries =
        entitySets.map(item =>
            `<entry>` +
            `<id>${item.ID}</id>` +
            `<title>${item.ID}</title>` +
            `<content type="application/xml">` +
            `<m:properties ` +
            `xmlns:m="http://schemas.microsoft.com/ado/2007/08/dataservices/metadata" ` +
            `xmlns:d="http://schemas.microsoft.com/ado/2007/08/dataservices">` +
            `<d:ID>${item.ID}</d:ID>` +
            `<d:SrvIdentifier>${item.SrvIdentifier}</d:SrvIdentifier>` +
            `<d:Description>${item.Description}</d:Description>` +
            `<d:TechnicalServiceName>${item.TechnicalServiceName}</d:TechnicalServiceName>` +
            `<d:TechnicalServiceVersion>${item.TechnicalServiceVersion}</d:TechnicalServiceVersion>` +
            `</m:properties>` +
            `</content>` +
            `</entry>`
        ).join("");

    return res.send(
        `<?xml version="1.0" encoding="utf-8"?>` +
        `<feed xmlns="http://www.w3.org/2005/Atom">` +
        `<title>EntitySetCollection</title>` +
        entries +
        `</feed>`
    );
}

export default function registerCatalogODataV2(app) {
    app.get(
        CATALOG_PATH,
        serviceDocument
    );

    app.get(
        `${CATALOG_PATH}/$metadata`,
        metadata
    );

    app.get(
        SERVICE_COLLECTION,
        serviceCollection
    );

    app.get(
        `${SERVICE_COLLECTION}/$metadata`,
        metadata
    );

    app.get(
        `${CATALOG_PATH}/EntitySetCollection`,
        entitySetCollection
    );
}
