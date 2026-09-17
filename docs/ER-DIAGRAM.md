# Fundsroom Industrial ERP - ER Diagram

## Entity Relationship Diagram

```mermaid
erDiagram

    USERS ||--o{ ENQUIRIES : creates

    CUSTOMERS ||--o{ ENQUIRIES : submits

    ENQUIRIES ||--o{ ENQUIRY_ITEMS : contains

    PRODUCTS ||--o{ ENQUIRY_ITEMS : requested

    ENQUIRIES ||--o| QUOTATIONS : generates

    CUSTOMERS ||--o{ QUOTATIONS : receives

    QUOTATIONS ||--o{ QUOTATION_ITEMS : contains

    PRODUCTS ||--o{ QUOTATION_ITEMS : priced

    QUOTATIONS ||--o| SALES_ORDERS : converts_to

    CUSTOMERS ||--o{ SALES_ORDERS : owns

    SALES_ORDERS ||--o{ SALES_ORDER_ITEMS : contains

    PRODUCTS ||--o{ SALES_ORDER_ITEMS : ordered

    PRODUCTS ||--|| INVENTORY : has

    SALES_ORDERS ||--o| DISPATCHES : fulfilled_by