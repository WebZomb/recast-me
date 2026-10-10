// Admin GraphQL 2026-07. Keep these operations independently schema-validatable.
export const ORDER_FIELDS = `id name createdAt updatedAt test cancelledAt displayFinancialStatus email tags
  customAttributes { key value }
  shippingAddress { name firstName lastName company address1 address2 city province provinceCode countryCodeV2 zip phone }
  lineItems(first: 250) { pageInfo { hasNextPage } nodes { id name sku quantity variant { id } customAttributes { key value } } }`;
export const SYNC_ORDERS_QUERY = `query RecastOrderChanges($after: String, $query: String!) {
  orders(first: 25, after: $after, sortKey: UPDATED_AT, query: $query) {
    pageInfo { hasNextPage endCursor }
    nodes { ${ORDER_FIELDS} }
  }
}`;
export const VERIFY_ORDER_QUERY = `query RecastOrderPayment($id: ID!) { order(id: $id) { ${ORDER_FIELDS} } }`;
