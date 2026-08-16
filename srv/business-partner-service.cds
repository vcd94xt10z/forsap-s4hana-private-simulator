using { forsap.s4hana as db } from '../db/schema';

@path: 'API_BUSINESS_PARTNER'
service API_BUSINESS_PARTNER_SIMULATOR {
    entity A_Supplier as projection on db.A_Supplier;
}

@protocol: 'odata'
@path: '/sap/opu/odata4/sap/api_business_partner/srvd_a2x/sap/businesspartner/0001'
service API_BUSINESS_PARTNER_V4 {
    entity A_Supplier as projection on db.A_Supplier;
}
