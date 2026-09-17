import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { prisma } from './prisma.js';
import {
  login,
  authenticate,
  authorize
} from './auth.js';

import {
  quotationLine,
  quotationTotal,
  nextNumber
} from './utils.js';

const app = express();

/* =========================================================
   MIDDLEWARE
========================================================= */

app.use(cors());
app.use(express.json());

/* =========================================================
   HEALTH
========================================================= */

app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'Fundsroom ERP API'
  });
});

/* =========================================================
   AUTHENTICATION
========================================================= */

app.post('/api/auth/login', login);

/* =========================================================
   PRODUCTS
========================================================= */

app.get(
  '/api/products',
  authenticate,
  async (req, res) => {
    try {
      const rows =
        await prisma.product.findMany({
          include: {
            inventory: true
          },
          orderBy: {
            code: 'asc'
          }
        });

      res.json(rows);
    } catch (e) {
      console.error(e);

      res.status(500).json({
        message: 'Unable to load products'
      });
    }
  }
);

/* =========================================================
   INVENTORY
========================================================= */

app.get(
  '/api/inventory',
  authenticate,
  async (req, res) => {
    try {
      const rows =
        await prisma.inventory.findMany({
          include: {
            product: true
          },
          orderBy: {
            product: {
              code: 'asc'
            }
          }
        });

      res.json(
        rows.map(item => ({
          ...item,
          available:
            item.physical - item.reserved
        }))
      );
    } catch (e) {
      console.error(e);

      res.status(500).json({
        message: 'Unable to load inventory'
      });
    }
  }
);

/* =========================================================
   CUSTOMERS
========================================================= */

app.get(
  '/api/customers',
  authenticate,
  async (req, res) => {
    try {
      const customers =
        await prisma.customer.findMany({
          orderBy: {
            companyName: 'asc'
          }
        });

      res.json(customers);
    } catch (e) {
      console.error(e);

      res.status(500).json({
        message: 'Unable to load customers'
      });
    }
  }
);

/* =========================================================
   ENQUIRIES
========================================================= */

app.get(
  '/api/enquiries',
  authenticate,
  async (req, res) => {
    try {
      const enquiries =
        await prisma.enquiry.findMany({
          include: {
            customer: true,
            items: {
              include: {
                product: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        });

      res.json(enquiries);
    } catch (e) {
      console.error(e);

      res.status(500).json({
        message: 'Unable to load enquiries'
      });
    }
  }
);

app.post(
  '/api/enquiries',
  authenticate,
  authorize('SALES'),
  async (req, res) => {
    try {
      const {
        customer,
        items,
        enquiryDate,
        requiredDate,
        notes
      } = req.body;

      /* Customer validation */

      if (
        !customer?.companyName ||
        !customer?.contactPerson ||
        !customer?.mobile ||
        !customer?.email ||
        !customer?.city
      ) {
        return res.status(400).json({
          message:
            'Complete customer details are required'
        });
      }

      /* Product validation */

      if (
        !Array.isArray(items) ||
        !items.length
      ) {
        return res.status(400).json({
          message:
            'At least one product is required'
        });
      }

      for (const item of items) {
        if (
          !Number.isInteger(
            Number(item.quantity)
          ) ||
          Number(item.quantity) <= 0
        ) {
          return res.status(400).json({
            message:
              'Quantities must be positive integers'
          });
        }
      }

      /* Transaction */

      const created =
        await prisma.$transaction(
          async tx => {
            const customerRecord =
              await tx.customer.create({
                data: customer
              });

            return tx.enquiry.create({
              data: {
                number: nextNumber('ENQ'),

                customerId:
                  customerRecord.id,

                enquiryDate:
                  new Date(
                    enquiryDate ||
                      Date.now()
                  ),

                requiredDate:
                  new Date(requiredDate),

                notes:
                  notes || null,

                items: {
                  create: items.map(
                    item => ({
                      productId:
                        Number(
                          item.productId
                        ),

                      quantity:
                        Number(
                          item.quantity
                        )
                    })
                  )
                }
              },

              include: {
                customer: true,

                items: {
                  include: {
                    product: true
                  }
                }
              }
            });
          }
        );

      res.status(201).json(created);

    } catch (e) {
      console.error(e);

      res.status(400).json({
        message: e.message
      });
    }
  }
);

/* =========================================================
   QUOTATIONS
========================================================= */

app.get(
  '/api/quotations',
  authenticate,
  async (req, res) => {
    try {
      const quotations =
        await prisma.quotation.findMany({
          include: {
            customer: true,

            enquiry: true,

            items: {
              include: {
                product: true
              }
            },

            salesOrder: true
          },

          orderBy: {
            createdAt: 'desc'
          }
        });

      res.json(quotations);

    } catch (e) {
      console.error(e);

      res.status(500).json({
        message:
          'Unable to load quotations'
      });
    }
  }
);

/* =========================================================
   CREATE QUOTATION
========================================================= */

app.post(
  '/api/quotations',
  authenticate,
  authorize('SALES'),
  async (req, res) => {
    try {
      const {
        enquiryId,
        validUntil,
        items
      } = req.body;

      /* Find enquiry */

      const enquiry =
        await prisma.enquiry.findUnique({
          where: {
            id: Number(enquiryId)
          },

          include: {
            customer: true
          }
        });

      if (!enquiry) {
        return res.status(404).json({
          message:
            'Enquiry not found'
        });
      }

      /* Lost enquiry cannot be quoted */

      if (enquiry.status === 'LOST') {
        return res.status(400).json({
          message:
            'Lost enquiry cannot be quoted'
        });
      }

      /* Items validation */

      if (
        !Array.isArray(items) ||
        !items.length
      ) {
        return res.status(400).json({
          message:
            'Quotation needs items'
        });
      }

      /* Product validation */

      const ids = items.map(
        item =>
          Number(item.productId)
      );

      const products =
        await prisma.product.findMany({
          where: {
            id: {
              in: ids
            }
          }
        });

      if (
        products.length !==
        ids.length
      ) {
        return res.status(400).json({
          message:
            'Invalid product'
        });
      }

      /* Normalize quotation items */

      const normalized =
        items.map(item => {
          const product =
            products.find(
              p =>
                p.id ===
                Number(
                  item.productId
                )
            );

          const quantity =
            Number(item.quantity);

          const unitPrice =
            Number(item.unitPrice);

          const discountPct =
            Number(
              item.discountPct || 0
            );

          const gstPct =
            Number(
              item.gstPct || 0
            );

          if (
            quantity <= 0 ||
            unitPrice < 0 ||
            discountPct < 0 ||
            discountPct > 100 ||
            gstPct < 0 ||
            gstPct > 100
          ) {
            throw new Error(
              'Invalid quotation values'
            );
          }

          return {
            productId: product.id,
            quantity,
            unitPrice,
            discountPct,
            gstPct,

            /*
              IMPORTANT:
              Amount is calculated on backend.
            */

            lineAmount:
              quotationLine(
                quantity,
                unitPrice,
                discountPct,
                gstPct
              )
          };
        });

      /* Backend total calculation */

      const total =
        quotationTotal(normalized);

      /* Database transaction */

      const quotation =
        await prisma.$transaction(
          async tx => {

            const result =
              await tx.quotation.create({
                data: {
                  number:
                    nextNumber('QUO'),

                  enquiryId:
                    enquiry.id,

                  customerId:
                    enquiry.customerId,

                  validUntil:
                    new Date(validUntil),

                  totalAmount:
                    total,

                  /*
                    New quotations start as DRAFT.
                  */

                  status: 'DRAFT',

                  items: {
                    create:
                      normalized
                  }
                }
              });

            /*
              Enquiry moves to QUOTED.
            */

            await tx.enquiry.update({
              where: {
                id: enquiry.id
              },

              data: {
                status: 'QUOTED'
              }
            });

            return tx.quotation.findUnique({
              where: {
                id: result.id
              },

              include: {
                customer: true,

                items: {
                  include: {
                    product: true
                  }
                },

                enquiry: true
              }
            });
          }
        );

      res.status(201).json(quotation);

    } catch (e) {
      console.error(e);

      res.status(400).json({
        message: e.message
      });
    }
  }
);

/* =========================================================
   QUOTATION STATUS
========================================================= */

/*
   Valid lifecycle:

   DRAFT
      ↓
   SENT
      ↓
   ACCEPTED
      ↓
   SALES ORDER

   OR

   SENT
      ↓
   REJECTED
*/

app.patch(
  '/api/quotations/:id/status',
  authenticate,
  authorize('SALES'),
  async (req, res) => {
    try {
      const id =
        Number(req.params.id);

      const { status } =
        req.body;

      const allowedStatuses = [
        'DRAFT',
        'SENT',
        'ACCEPTED',
        'REJECTED'
      ];

      if (
        !allowedStatuses.includes(
          status
        )
      ) {
        return res.status(400).json({
          message:
            'Invalid quotation status'
        });
      }

      const quotation =
        await prisma.quotation.findUnique({
          where: {
            id
          }
        });

      if (!quotation) {
        return res.status(404).json({
          message:
            'Quotation not found'
        });
      }

      /*
        Enforce business workflow.

        DRAFT → SENT
        SENT → ACCEPTED
        SENT → REJECTED
      */

      const validTransition =
        (
          quotation.status ===
            'DRAFT' &&
          status === 'SENT'
        ) ||
        (
          quotation.status ===
            'SENT' &&
          (
            status ===
              'ACCEPTED' ||
            status ===
              'REJECTED'
          )
        );

      if (!validTransition) {
        return res.status(400).json({
          message:
            `Invalid quotation transition: ${quotation.status} → ${status}`
        });
      }

      const updated =
        await prisma.quotation.update({
          where: {
            id
          },

          data: {
            status
          }
        });

      res.json(updated);

    } catch (e) {
      console.error(e);

      res.status(400).json({
        message: e.message
      });
    }
  }
);

/* =========================================================
   CONVERT ACCEPTED QUOTATION → SALES ORDER
========================================================= */

app.post(
  '/api/quotations/:id/convert',
  authenticate,
  authorize('SALES'),
  async (req, res) => {
    try {
      const quotationId =
        Number(req.params.id);

      const quotation =
        await prisma.quotation.findUnique({
          where: {
            id: quotationId
          },

          include: {
            items: true
          }
        });

      if (!quotation) {
        return res.status(404).json({
          message:
            'Quotation not found'
        });
      }

      /*
        Only ACCEPTED quotations
        can become sales orders.
      */

      if (
        quotation.status !==
        'ACCEPTED'
      ) {
        return res.status(400).json({
          message:
            'Only ACCEPTED quotations can create an order'
        });
      }

      /*
        Prevent duplicate conversion.
      */

      const existing =
        await prisma.salesOrder.findUnique({
          where: {
            quotationId:
              quotation.id
          }
        });

      if (existing) {
        return res.status(409).json({
          message:
            'This quotation already has a Sales Order',

          order: existing
        });
      }

      /*
        Create sales order.
      */

      const order =
        await prisma.salesOrder.create({
          data: {
            number:
              nextNumber('SO'),

            quotationId:
              quotation.id,

            customerId:
              quotation.customerId,

            totalAmount:
              quotation.totalAmount,

            items: {
              create:
                quotation.items.map(
                  item => ({
                    productId:
                      item.productId,

                    quantity:
                      item.quantity,

                    unitPrice:
                      item.unitPrice
                  })
                )
            }
          }
        });

      res.status(201).json(order);

    } catch (e) {
      console.error(e);

      /*
        Database unique constraint
        also protects against duplicates.
      */

      if (
        e.code === 'P2002'
      ) {
        return res.status(409).json({
          message:
            'Duplicate Sales Order prevented by database constraint'
        });
      }

      res.status(400).json({
        message: e.message
      });
    }
  }
);

/* =========================================================
   SALES ORDERS
========================================================= */

app.get(
  '/api/sales-orders',
  authenticate,
  async (req, res) => {
    try {
      const orders =
        await prisma.salesOrder.findMany({
          include: {
            customer: true,

            quotation: true,

            items: {
              include: {
                product: true
              }
            },

            dispatch: true
          },

          orderBy: {
            orderDate: 'desc'
          }
        });

      res.json(orders);

    } catch (e) {
      console.error(e);

      res.status(500).json({
        message:
          'Unable to load sales orders'
      });
    }
  }
);

/* =========================================================
   CONFIRM ORDER + RESERVE INVENTORY
========================================================= */

app.post(
  '/api/sales-orders/:id/confirm',
  authenticate,
  authorize('ADMIN'),
  async (req, res) => {
    try {
      const id =
        Number(req.params.id);

      const order =
        await prisma.salesOrder.findUnique({
          where: {
            id
          },

          include: {
            items: true
          }
        });

      if (!order) {
        return res.status(404).json({
          message:
            'Order not found'
        });
      }

      /*
        Only PENDING orders
        can be confirmed.
      */

      if (
        order.status !==
        'PENDING'
      ) {
        return res.status(400).json({
          message:
            `Cannot confirm ${order.status} order`
        });
      }

      /*
        Transaction + row locking.

        This protects against two admins
        reserving the same inventory
        simultaneously.
      */

      await prisma.$transaction(
        async tx => {

          for (
            const item
            of order.items
          ) {

            /*
              PostgreSQL row lock.
            */

            const locked =
              await tx.$queryRaw`
                SELECT
                  id,
                  physical,
                  reserved
                FROM "Inventory"
                WHERE "productId" = ${item.productId}
                FOR UPDATE
              `;

            if (!locked.length) {
              throw new Error(
                'Inventory record missing'
              );
            }

            const inventory =
              locked[0];

            const available =
              inventory.physical -
              inventory.reserved;

            /*
              Never allow reservation
              beyond available stock.
            */

            if (
              available <
              item.quantity
            ) {
              throw new Error(
                `Insufficient stock for product ${item.productId}. Available: ${available}`
              );
            }

            /*
              Reservation changes only
              RESERVED.

              Physical stock remains unchanged.
            */

            await tx.inventory.update({
              where: {
                id: inventory.id
              },

              data: {
                reserved: {
                  increment:
                    item.quantity
                }
              }
            });
          }

          /*
            Mark order confirmed
            only after every item succeeds.
          */

          await tx.salesOrder.update({
            where: {
              id
            },

            data: {
              status:
                'CONFIRMED'
            }
          });
        }
      );

      res.json({
        message:
          'Order confirmed and inventory reserved'
      });

    } catch (e) {
      console.error(e);

      res.status(400).json({
        message: e.message
      });
    }
  }
);

/* =========================================================
   DISPATCH ORDER
========================================================= */

app.post(
  '/api/sales-orders/:id/dispatch',
  authenticate,
  authorize('ADMIN'),
  async (req, res) => {
    try {
      const id =
        Number(req.params.id);

      const {
        vehicleNumber,
        driverName
      } = req.body;

      if (
        !vehicleNumber ||
        !driverName
      ) {
        return res.status(400).json({
          message:
            'Vehicle number and driver name are required'
        });
      }

      /*
        Entire dispatch operation
        is atomic.
      */

      const result =
        await prisma.$transaction(
          async tx => {

            const order =
              await tx.salesOrder.findUnique({
                where: {
                  id
                },

                include: {
                  items: true,
                  dispatch: true
                }
              });

            if (!order) {
              throw new Error(
                'Order not found'
              );
            }

            /*
              Only CONFIRMED orders
              can be dispatched.
            */

            if (
              order.status !==
              'CONFIRMED'
            ) {
              throw new Error(
                'Only CONFIRMED orders can be dispatched'
              );
            }

            /*
              Prevent duplicate dispatch.
            */

            if (order.dispatch) {
              throw new Error(
                'Duplicate dispatch prevented'
              );
            }

            /*
              Process each product.
            */

            for (
              const item
              of order.items
            ) {

              /*
                Lock inventory row.
              */

              const locked =
                await tx.$queryRaw`
                  SELECT
                    id,
                    physical,
                    reserved
                  FROM "Inventory"
                  WHERE "productId" = ${item.productId}
                  FOR UPDATE
                `;

              const inventory =
                locked[0];

              if (
                !inventory ||
                inventory.reserved <
                  item.quantity ||
                inventory.physical <
                  item.quantity
              ) {
                throw new Error(
                  'Dispatch exceeds reserved/physical quantity'
                );
              }

              /*
                Dispatch consumes inventory.

                Physical ↓
                Reserved ↓
              */

              await tx.inventory.update({
                where: {
                  id:
                    inventory.id
                },

                data: {
                  physical: {
                    decrement:
                      item.quantity
                  },

                  reserved: {
                    decrement:
                      item.quantity
                  }
                }
              });
            }

            /*
              Mark order dispatched.
            */

            await tx.salesOrder.update({
              where: {
                id
              },

              data: {
                status:
                  'DISPATCHED'
              }
            });

            /*
              Create dispatch record.
            */

            return tx.dispatch.create({
              data: {
                number:
                  nextNumber('DSP'),

                salesOrderId:
                  id,

                vehicleNumber,

                driverName
              }
            });
          }
        );

      res.status(201).json(result);

    } catch (e) {
      console.error(e);

      res.status(400).json({
        message: e.message
      });
    }
  }
);

/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */

app.use(
  (err, req, res, next) => {
    console.error(err);

    res.status(500).json({
      message:
        'Internal server error'
    });
  }
);

/* =========================================================
   SERVER START
========================================================= */

const port =
  process.env.PORT || 5000;

if (
  process.env.NODE_ENV !==
  'test'
) {
  app.listen(
    port,
    () => {
      console.log(
        `API running on http://localhost:${port}`
      );
    }
  );
}

export default app;