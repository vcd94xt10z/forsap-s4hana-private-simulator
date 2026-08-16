# forsap-s4hana-private-simulator

Simulador local de APIs OData do SAP S/4HANA Private Edition, iniciado com a API `API_BUSINESS_PARTNER` e a entidade `A_Supplier`.

## Pré-requisitos

- Node.js 22+
- SAP CDS Development Kit 10+

## Instalação

```powershell
npm install
```

## Execução

```powershell
npm run watch
```

## Endpoints atuais

OData V4 do CAP:

```text
http://localhost:4004/odata/v4/API_BUSINESS_PARTNER/A_Supplier
```

OData V2 compatível com a URL da API standard:

```text
http://localhost:4004/sap/opu/odata/sap/API_BUSINESS_PARTNER/$metadata
http://localhost:4004/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_Supplier
```

Exemplos:

```text
http://localhost:4004/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_Supplier?$select=Supplier,SupplierName
```

```text
http://localhost:4004/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_Supplier?$filter=SupplierName eq 'Fornecedor ABC'
```

```text
http://localhost:4004/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_Supplier?$filter=contains(SupplierName,'ABC')&$select=Supplier,SupplierName
```

```text
http://localhost:4004/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_Supplier?$orderby=SupplierName asc&$top=3
```

```text
http://localhost:4004/sap/opu/odata/sap/API_BUSINESS_PARTNER/A_Supplier?$inlinecount=allpages
```

O endpoint V2 é implementado diretamente no mesmo servidor HTTP e acessa o banco SQLite. Ele não faz uma chamada HTTP para o endpoint V4.
