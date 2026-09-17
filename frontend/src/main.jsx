import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const API = 'http://localhost:5000/api';

/* =========================================================
   API HELPER
========================================================= */

const request = async (path, opts = {}) => {
  const token = localStorage.getItem('token');

  const res = await fetch(API + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),
      ...(opts.headers || {})
    }
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(
      data.message || 'Request failed'
    );
  }

  return data;
};

/* =========================================================
   LOGIN
========================================================= */

function Login({ onLogin }) {
  const [email, setEmail] =
    useState('admin@fundsroom.com');

  const [password, setPassword] =
    useState('Admin@123');

  const [error, setError] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  async function loginWith(
    selectedEmail,
    selectedPassword
  ) {
    setError('');
    setLoading(true);

    try {
      const result = await request(
        '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify({
            email: selectedEmail,
            password: selectedPassword
          })
        }
      );

      localStorage.setItem(
        'token',
        result.token
      );

      localStorage.setItem(
        'user',
        JSON.stringify(result.user)
      );

      onLogin(result.user);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function submit(e) {
    e.preventDefault();

    await loginWith(
      email,
      password
    );
  }

  function useAdmin() {
    setEmail('admin@fundsroom.com');
    setPassword('Admin@123');

    loginWith(
      'admin@fundsroom.com',
      'Admin@123'
    );
  }

  function useSales() {
    setEmail('sales@fundsroom.com');
    setPassword('Sales@123');

    loginWith(
      'sales@fundsroom.com',
      'Sales@123'
    );
  }

  return (
    <div className="login">

      <div className="loginCard">

        <div className="brand">
          FUNDSROOM <span>ERP</span>
        </div>

        <div className="loginBadge">
          INDUSTRIAL OPERATIONS PLATFORM
        </div>

        <h1>
          Operations Console
        </h1>

        <p className="loginSubtitle">
          Manage the complete business journey from
          <strong>
            {' '}
            Enquiry → Quotation → Order → Reservation → Dispatch
          </strong>
        </p>

        <form onSubmit={submit}>

          <label>
            Email Address
          </label>

          <input
            type="email"
            value={email}
            onChange={e =>
              setEmail(e.target.value)
            }
            placeholder="Enter email"
            required
          />

          <label>
            Password
          </label>

          <input
            type="password"
            value={password}
            onChange={e =>
              setPassword(e.target.value)
            }
            placeholder="Enter password"
            required
          />

          <button
            className="primaryButton"
            disabled={loading}
          >
            {loading
              ? 'Signing in...'
              : 'Sign in to ERP'}
          </button>

        </form>

        {error && (
          <div className="error">
            {error}
          </div>
        )}

        <div className="demoAccounts">

          <div className="demoTitle">
            DEMO ACCESS
          </div>

          <div className="demoAccount">

            <div>
              <strong>
                Administrator
              </strong>

              <small>
                Inventory, reservation & dispatch
              </small>

              <code>
                admin@fundsroom.com
              </code>

              <code>
                Admin@123
              </code>
            </div>

            <button
              type="button"
              className="demoButton"
              onClick={useAdmin}
              disabled={loading}
            >
              Login as Admin
            </button>

          </div>

          <div className="demoAccount">

            <div>
              <strong>
                Sales User
              </strong>

              <small>
                Customer enquiries & quotations
              </small>

              <code>
                sales@fundsroom.com
              </code>

              <code>
                Sales@123
              </code>
            </div>

            <button
              type="button"
              className="demoButton"
              onClick={useSales}
              disabled={loading}
            >
              Login as Sales
            </button>

          </div>

        </div>

        <div className="loginFooter">
          JWT Authentication • Role Based Access Control
        </div>

      </div>

    </div>
  );
}

/* =========================================================
   MAIN APPLICATION
========================================================= */

function App() {

  const [user, setUser] =
    useState(
      JSON.parse(
        localStorage.getItem('user') ||
        'null'
      )
    );

  const [tab, setTab] =
    useState('enquiries');

  const [enquiries, setEnquiries] =
    useState([]);

  const [quotations, setQuotations] =
    useState([]);

  const [orders, setOrders] =
    useState([]);

  const [inventory, setInventory] =
    useState([]);

  const [error, setError] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [showEnq, setShowEnq] =
    useState(false);

  const [showQuote, setShowQuote] =
    useState(false);

  const [showDispatch, setShowDispatch] =
    useState(null);

  const [search, setSearch] =
    useState('');

  const [statusFilter, setStatusFilter] =
    useState('ALL');

  const [form, setForm] =
    useState({
      companyName: '',
      contactPerson: '',
      mobile: '',
      email: '',
      city: '',
      requiredDate: '',
      notes: '',
      productId: '1',
      quantity: 10
    });

  const [qform, setQform] =
    useState({
      enquiryId: '',
      validUntil: '',
      productId: '1',
      quantity: 1,
      unitPrice: 45000,
      discountPct: 0,
      gstPct: 18
    });

  /* =======================================================
     LOAD DATA
  ======================================================= */

  async function load() {

    try {

      setLoading(true);

      const [
        enquiriesData,
        quotationsData,
        ordersData,
        inventoryData
      ] = await Promise.all([
        request('/enquiries'),
        request('/quotations'),
        request('/sales-orders'),
        request('/inventory')
      ]);

      setEnquiries(
        enquiriesData
      );

      setQuotations(
        quotationsData
      );

      setOrders(
        ordersData
      );

      setInventory(
        inventoryData
      );

      setError('');

    } catch (err) {

      setError(err.message);

    } finally {

      setLoading(false);

    }
  }

  useEffect(() => {

    if (user) {
      load();
    }

  }, [user]);

  /* =======================================================
     STATISTICS
  ======================================================= */

  const stats = useMemo(() => {

    const lowStock =
      inventory.filter(
        x => x.available <= 50
      ).length;

    const quotationValue =
      quotations.reduce(
        (sum, x) =>
          sum +
          Number(
            x.totalAmount || 0
          ),
        0
      );

    const pendingOrders =
      orders.filter(
        x => x.status === 'PENDING'
      ).length;

    const confirmedOrders =
      orders.filter(
        x => x.status === 'CONFIRMED'
      ).length;

    const dispatchedOrders =
      orders.filter(
        x => x.status === 'DISPATCHED'
      ).length;

    return {
      enquiries:
        enquiries.length,

      quotations:
        quotations.length,

      quotationValue,

      pendingOrders,

      confirmedOrders,

      dispatchedOrders,

      lowStock
    };

  }, [
    enquiries,
    quotations,
    orders,
    inventory
  ]);

  /* =======================================================
     FILTERS
  ======================================================= */

  const filteredEnquiries =
    enquiries.filter(x => {

      const text =
        `${x.number} ${
          x.customer?.companyName || ''
        } ${
          x.customer?.contactPerson || ''
        }`.toLowerCase();

      const matchesSearch =
        text.includes(
          search.toLowerCase()
        );

      const matchesStatus =
        statusFilter === 'ALL' ||
        x.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });

  const filteredQuotations =
    quotations.filter(x => {

      const text =
        `${x.number} ${
          x.customer?.companyName || ''
        } ${
          x.enquiry?.number || ''
        }`.toLowerCase();

      const matchesSearch =
        text.includes(
          search.toLowerCase()
        );

      const matchesStatus =
        statusFilter === 'ALL' ||
        x.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });

  const filteredOrders =
    orders.filter(x => {

      const text =
        `${x.number} ${
          x.customer?.companyName || ''
        } ${
          x.quotation?.number || ''
        }`.toLowerCase();

      const matchesSearch =
        text.includes(
          search.toLowerCase()
        );

      const matchesStatus =
        statusFilter === 'ALL' ||
        x.status === statusFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });

  /* =======================================================
     CREATE ENQUIRY
  ======================================================= */

  async function createEnq(e) {

    e.preventDefault();

    try {

      await request(
        '/enquiries',
        {
          method: 'POST',

          body: JSON.stringify({
            customer: {
              companyName:
                form.companyName,

              contactPerson:
                form.contactPerson,

              mobile:
                form.mobile,

              email:
                form.email,

              city:
                form.city
            },

            requiredDate:
              form.requiredDate,

            notes:
              form.notes,

            items: [
              {
                productId:
                  Number(
                    form.productId
                  ),

                quantity:
                  Number(
                    form.quantity
                  )
              }
            ]
          })
        }
      );

      setShowEnq(false);

      setForm({
        companyName: '',
        contactPerson: '',
        mobile: '',
        email: '',
        city: '',
        requiredDate: '',
        notes: '',
        productId: '1',
        quantity: 10
      });

      await load();

    } catch (err) {

      setError(err.message);

    }
  }

  /* =======================================================
     CREATE QUOTATION
  ======================================================= */

  async function createQuote(e) {

    e.preventDefault();

    try {

      await request(
        '/quotations',
        {
          method: 'POST',

          body: JSON.stringify({
            enquiryId:
              Number(
                qform.enquiryId
              ),

            validUntil:
              qform.validUntil,

            items: [
              {
                productId:
                  Number(
                    qform.productId
                  ),

                quantity:
                  Number(
                    qform.quantity
                  ),

                unitPrice:
                  Number(
                    qform.unitPrice
                  ),

                discountPct:
                  Number(
                    qform.discountPct
                  ),

                gstPct:
                  Number(
                    qform.gstPct
                  )
              }
            ]
          })
        }
      );

      setShowQuote(false);

      await load();

      setTab('quotations');

    } catch (err) {

      setError(err.message);

    }
  }

  /* =======================================================
     SEND QUOTATION
  ======================================================= */

  async function sendQuotation(id) {

    try {

      await request(
        `/quotations/${id}/status`,
        {
          method: 'PATCH',

          body: JSON.stringify({
            status: 'SENT'
          })
        }
      );

      await load();

    } catch (err) {

      setError(err.message);

    }
  }

  /* =======================================================
     ACCEPT QUOTATION
  ======================================================= */

  async function accept(id) {

    try {

      await request(
        `/quotations/${id}/status`,
        {
          method: 'PATCH',

          body: JSON.stringify({
            status: 'ACCEPTED'
          })
        }
      );

      await load();

    } catch (err) {

      setError(err.message);

    }
  }

  /* =======================================================
     REJECT QUOTATION
  ======================================================= */

  async function rejectQuotation(id) {

    try {

      await request(
        `/quotations/${id}/status`,
        {
          method: 'PATCH',

          body: JSON.stringify({
            status: 'REJECTED'
          })
        }
      );

      await load();

    } catch (err) {

      setError(err.message);

    }
  }

  /* =======================================================
     CONVERT TO ORDER
  ======================================================= */

  async function convert(id) {

    try {

      await request(
        `/quotations/${id}/convert`,
        {
          method: 'POST'
        }
      );

      await load();

      setTab('orders');

    } catch (err) {

      setError(err.message);

    }
  }

  /* =======================================================
     CONFIRM + RESERVE
  ======================================================= */

  async function confirm(id) {

    try {

      await request(
        `/sales-orders/${id}/confirm`,
        {
          method: 'POST'
        }
      );

      await load();

    } catch (err) {

      setError(err.message);

    }
  }

  /* =======================================================
     DISPATCH
  ======================================================= */

  async function dispatch(e) {

    e.preventDefault();

    try {

      await request(
        `/sales-orders/${showDispatch.id}/dispatch`,
        {
          method: 'POST',

          body: JSON.stringify({
            vehicleNumber:
              e.target.vehicle.value,

            driverName:
              e.target.driver.value
          })
        }
      );

      setShowDispatch(null);

      await load();

    } catch (err) {

      setError(err.message);

    }
  }

  /* =======================================================
     LOGOUT
  ======================================================= */

  function logout() {

    localStorage.removeItem(
      'token'
    );

    localStorage.removeItem(
      'user'
    );

    setUser(null);
  }

  if (!user) {
    return (
      <Login
        onLogin={setUser}
      />
    );
  }

  /* =======================================================
     APPLICATION UI
  ======================================================= */

  return (
    <div className="app">

      {/* HEADER */}

      <header>

        <div className="brand">
          FUNDSROOM <span>ERP</span>
        </div>

        <div className="headerCenter">

          <span className="systemStatus">
            <i></i>
            SYSTEM OPERATIONAL
          </span>

        </div>

        <div className="user">

          <div className="userInfo">

            <strong>
              {user.name}
            </strong>

            <span>
              {user.role}
            </span>

          </div>

          <button
            className="ghost"
            onClick={load}
            disabled={loading}
          >
            {loading
              ? 'Refreshing...'
              : '↻ Refresh'}
          </button>

          <button
            className="ghost"
            onClick={logout}
          >
            Logout
          </button>

        </div>

      </header>

      <div className="layout">

        {/* SIDEBAR */}

        <aside>

          <div className="sideSection">

            <div className="sideLabel">
              WORKSPACE
            </div>

            <button
              className={
                tab === 'enquiries'
                  ? 'nav active'
                  : 'nav'
              }
              onClick={() => {

                setTab('enquiries');

                setSearch('');

                setStatusFilter(
                  'ALL'
                );

              }}
            >
              <span>◈</span>
              Customer Enquiries
            </button>

            <button
              className={
                tab === 'quotations'
                  ? 'nav active'
                  : 'nav'
              }
              onClick={() => {

                setTab('quotations');

                setSearch('');

                setStatusFilter(
                  'ALL'
                );

              }}
            >
              <span>◇</span>
              Quotations
            </button>

            <button
              className={
                tab === 'orders'
                  ? 'nav active'
                  : 'nav'
              }
              onClick={() => {

                setTab('orders');

                setSearch('');

                setStatusFilter(
                  'ALL'
                );

              }}
            >
              <span>▣</span>
              Sales Orders
            </button>

          </div>

          {/* INVENTORY */}

          <div className="inventoryPanel">

            <div className="sideLabel">
              INVENTORY SNAPSHOT
            </div>

            {inventory
              .slice(0, 6)
              .map(item => (

                <div
                  className="stock"
                  key={item.id}
                >

                  <div>

                    <span>
                      {item.product.code}
                    </span>

                    <small>
                      {item.product.name}
                    </small>

                  </div>

                  <div className="stockValue">

                    <b>
                      {item.available}
                    </b>

                    <span
                      className={
                        item.available <= 50
                          ? 'stockLow'
                          : 'stockGood'
                      }
                    >
                      {item.available <= 50
                        ? 'LOW'
                        : 'AVAILABLE'}
                    </span>

                  </div>

                </div>

              ))}

            {stats.lowStock > 0 && (

              <div className="stockAlert">
                ⚠ {stats.lowStock}
                {' '}
                product(s) need attention
              </div>

            )}

          </div>

          <div className="sidebarFooter">

            <span>
              CURRENT ROLE
            </span>

            <strong>
              {user.role}
            </strong>

          </div>

        </aside>

        {/* MAIN */}

        <main>

          {error && (

            <div className="error banner">

              <span>
                ⚠ {error}
              </span>

              <button
                onClick={() =>
                  setError('')
                }
              >
                ×
              </button>

            </div>

          )}

          {/* ============================================
              ENQUIRIES
          ============================================ */}

          {tab === 'enquiries' && (

            <>

              <PageHeader
                title="Customer Enquiries"
                subtitle="Capture customer requirements and move them into the quotation pipeline."
                action={
                  user.role === 'SALES' && (
                    <button
                      className="primaryButton"
                      onClick={() =>
                        setShowEnq(true)
                      }
                    >
                      + New Enquiry
                    </button>
                  )
                }
              />

              <MetricStrip
                items={[
                  {
                    label: 'TOTAL ENQUIRIES',
                    value:
                      stats.enquiries
                  },

                  {
                    label: 'QUOTED',
                    value:
                      enquiries.filter(
                        x =>
                          x.status ===
                          'QUOTED'
                      ).length
                  },

                  {
                    label: 'NEW',
                    value:
                      enquiries.filter(
                        x =>
                          x.status ===
                          'NEW'
                      ).length
                  }
                ]}
              />

              <Toolbar
                search={search}
                setSearch={setSearch}
                filter={statusFilter}
                setFilter={setStatusFilter}
                options={[
                  'ALL',
                  'NEW',
                  'QUOTED',
                  'WON',
                  'LOST'
                ]}
              />

              {filteredEnquiries.length === 0 ? (

                <EmptyState
                  title="No enquiries found"
                  text={
                    search
                      ? 'Try another search term or status filter.'
                      : 'Start the sales workflow by creating a customer enquiry.'
                  }
                  action={
                    user.role === 'SALES' && (
                      <button
                        className="primaryButton"
                        onClick={() =>
                          setShowEnq(true)
                        }
                      >
                        + Create First Enquiry
                      </button>
                    )
                  }
                />

              ) : (

                <div className="cards">

                  {filteredEnquiries.map(
                    x => (

                      <div
                        className="card"
                        key={x.id}
                      >

                        <div className="row">

                          <div>

                            <span className="documentLabel">
                              ENQUIRY
                            </span>

                            <b>
                              {x.number}
                            </b>

                          </div>

                          <Status
                            status={
                              x.status
                            }
                          />

                        </div>

                        <h3>
                          {
                            x.customer
                              .companyName
                          }
                        </h3>

                        <p className="customerMeta">
                          {
                            x.customer
                              .contactPerson
                          }
                          {' · '}
                          {
                            x.customer.city
                          }
                          {' · '}
                          {
                            x.customer.mobile
                          }
                        </p>

                        <div className="items">

                          {x.items.map(
                            item => (

                              <span
                                key={
                                  item.id
                                }
                              >
                                {
                                  item
                                    .product
                                    .name
                                }
                                {' × '}
                                {
                                  item.quantity
                                }
                              </span>

                            )
                          )}

                        </div>

                        <div className="cardFooter">

                          <span>
                            Required:{' '}
                            <strong>
                              {
                                formatDate(
                                  x.requiredDate
                                )
                              }
                            </strong>
                          </span>

                          {user.role ===
                            'SALES' && (

                            <button
                              className="small"
                              onClick={() => {

                                setQform({
                                  ...qform,

                                  enquiryId:
                                    x.id,

                                  productId:
                                    String(
                                      x
                                        .items[0]
                                        .productId
                                    ),

                                  quantity:
                                    x
                                      .items[0]
                                      .quantity,

                                  unitPrice:
                                    Number(
                                      x
                                        .items[0]
                                        .product
                                        .basePrice
                                    ),

                                  validUntil:
                                    ''
                                });

                                setShowQuote(
                                  true
                                );

                              }}
                            >
                              Create Quotation →
                            </button>

                          )}

                        </div>

                      </div>

                    )
                  )}

                </div>

              )}

            </>

          )}

          {/* ============================================
              QUOTATIONS
          ============================================ */}

          {tab === 'quotations' && (

            <>

              <PageHeader
                title="Quotations"
                subtitle="Manage commercial proposals through the controlled quotation lifecycle."
              />

              <MetricStrip
                items={[
                  {
                    label: 'TOTAL QUOTATIONS',
                    value:
                      stats.quotations
                  },

                  {
                    label: 'DRAFT',
                    value:
                      quotations.filter(
                        x =>
                          x.status ===
                          'DRAFT'
                      ).length
                  },

                  {
                    label: 'SENT',
                    value:
                      quotations.filter(
                        x =>
                          x.status ===
                          'SENT'
                      ).length
                  },

                  {
                    label: 'ACCEPTED',
                    value:
                      quotations.filter(
                        x =>
                          x.status ===
                          'ACCEPTED'
                      ).length
                  }
                ]}
              />

              <Toolbar
                search={search}
                setSearch={setSearch}
                filter={statusFilter}
                setFilter={setStatusFilter}
                options={[
                  'ALL',
                  'DRAFT',
                  'SENT',
                  'ACCEPTED',
                  'REJECTED'
                ]}
              />

              {filteredQuotations.length ===
              0 ? (

                <EmptyState
                  title="No quotations found"
                  text="Quotations created from customer enquiries will appear here."
                />

              ) : (

                <div className="cards">

                  {filteredQuotations.map(
                    x => (

                      <div
                        className="card quotationCard"
                        key={x.id}
                      >

                        <div className="row">

                          <div>

                            <span className="documentLabel">
                              QUOTATION
                            </span>

                            <b>
                              {x.number}
                            </b>

                          </div>

                          <Status
                            status={
                              x.status
                            }
                          />

                        </div>

                        <h3>
                          {
                            x.customer
                              .companyName
                          }
                        </h3>

                        <p className="customerMeta">
                          Source Enquiry:{' '}
                          <strong>
                            {
                              x.enquiry
                                .number
                            }
                          </strong>
                        </p>

                        <div className="quoteAmount">

                          <small>
                            TOTAL VALUE
                          </small>

                          <strong>
                            ₹
                            {Number(
                              x.totalAmount
                            ).toLocaleString(
                              'en-IN',
                              {
                                minimumFractionDigits: 2
                              }
                            )}
                          </strong>

                        </div>

                        <div className="cardFooter">

                          <span>
                            Valid until:{' '}
                            <strong>
                              {
                                formatDate(
                                  x.validUntil
                                )
                              }
                            </strong>
                          </span>

                          {user.role ===
                            'SALES' && (

                            <div className="actions">

                              {/* DRAFT → SENT */}

                              {x.status ===
                                'DRAFT' && (

                                <button
                                  className="small"
                                  onClick={() =>
                                    sendQuotation(
                                      x.id
                                    )
                                  }
                                >
                                  Send Quotation →
                                </button>

                              )}

                              {/* SENT → ACCEPTED / REJECTED */}

                              {x.status ===
                                'SENT' && (

                                <>

                                  <button
                                    className="small"
                                    onClick={() =>
                                      accept(
                                        x.id
                                      )
                                    }
                                  >
                                    ✓ Accept
                                  </button>

                                  <button
                                    className="small dangerButton"
                                    onClick={() =>
                                      rejectQuotation(
                                        x.id
                                      )
                                    }
                                  >
                                    Reject
                                  </button>

                                </>

                              )}

                              {/* ACCEPTED → ORDER */}

                              {x.status ===
                                'ACCEPTED' &&
                                !x.salesOrder && (

                                <button
                                  className="small"
                                  onClick={() =>
                                    convert(
                                      x.id
                                    )
                                  }
                                >
                                  Convert to Order →
                                </button>

                              )}

                              {x.salesOrder && (

                                <span className="muted">
                                  ✓ Order:{' '}
                                  {
                                    x
                                      .salesOrder
                                      .number
                                  }
                                </span>

                              )}

                            </div>

                          )}

                        </div>

                      </div>

                    )
                  )}

                </div>

              )}

            </>

          )}

          {/* ============================================
              SALES ORDERS
          ============================================ */}

          {tab === 'orders' && (

            <>

              <PageHeader
                title="Sales Orders"
                subtitle="Confirm orders, reserve inventory atomically and dispatch fulfilled orders."
              />

              <MetricStrip
                items={[
                  {
                    label: 'PENDING',
                    value:
                      stats.pendingOrders
                  },

                  {
                    label: 'CONFIRMED',
                    value:
                      stats.confirmedOrders
                  },

                  {
                    label: 'DISPATCHED',
                    value:
                      stats.dispatchedOrders
                  },

                  {
                    label: 'LOW STOCK',
                    value:
                      stats.lowStock
                  }
                ]}
              />

              <Toolbar
                search={search}
                setSearch={setSearch}
                filter={statusFilter}
                setFilter={setStatusFilter}
                options={[
                  'ALL',
                  'PENDING',
                  'CONFIRMED',
                  'DISPATCHED',
                  'CANCELLED'
                ]}
              />

              {filteredOrders.length ===
              0 ? (

                <EmptyState
                  title="No sales orders found"
                  text="Accepted quotations converted into sales orders will appear here."
                />

              ) : (

                <div className="cards">

                  {filteredOrders.map(
                    x => (

                      <div
                        className="card orderCard"
                        key={x.id}
                      >

                        <div className="row">

                          <div>

                            <span className="documentLabel">
                              SALES ORDER
                            </span>

                            <b>
                              {x.number}
                            </b>

                          </div>

                          <Status
                            status={
                              x.status
                            }
                          />

                        </div>

                        <h3>
                          {
                            x.customer
                              .companyName
                          }
                        </h3>

                        <p className="customerMeta">
                          Quotation:{' '}
                          <strong>
                            {
                              x
                                .quotation
                                .number
                            }
                          </strong>
                        </p>

                        <div className="items">

                          {x.items.map(
                            item => {

                              const inv =
                                inventory.find(
                                  v =>
                                    v.productId ===
                                    item.productId
                                );

                              return (

                                <span
                                  key={
                                    item.id
                                  }
                                >
                                  {
                                    item
                                      .product
                                      .name
                                  }
                                  {' × '}
                                  {
                                    item.quantity
                                  }
                                  {' · '}
                                  Available:{' '}
                                  <strong>
                                    {
                                      inv?.available ??
                                      '—'
                                    }
                                  </strong>
                                </span>

                              );

                            }
                          )}

                        </div>

                        <div className="cardFooter">

                          <span>

                            {x.status ===
                              'PENDING' &&
                              'Awaiting inventory confirmation'}

                            {x.status ===
                              'CONFIRMED' &&
                              '✓ Stock reserved successfully'}

                            {x.status ===
                              'DISPATCHED' &&
                              `✓ Vehicle: ${
                                x.dispatch
                                  ?.vehicleNumber ||
                                '—'
                              }`}

                          </span>

                          <div className="actions">

                            {user.role ===
                              'ADMIN' &&
                              x.status ===
                                'PENDING' && (

                              <button
                                className="small"
                                onClick={() =>
                                  confirm(
                                    x.id
                                  )
                                }
                              >
                                ✓ Confirm & Reserve
                              </button>

                            )}

                            {user.role ===
                              'ADMIN' &&
                              x.status ===
                                'CONFIRMED' && (

                              <button
                                className="small"
                                onClick={() =>
                                  setShowDispatch(
                                    x
                                  )
                                }
                              >
                                Dispatch →
                              </button>

                            )}

                            {x.dispatch && (

                              <span className="muted">
                                Dispatch recorded
                              </span>

                            )}

                          </div>

                        </div>

                      </div>

                    )
                  )}

                </div>

              )}

            </>

          )}

        </main>

      </div>

      {/* =================================================
          ENQUIRY MODAL
      ================================================= */}

      {showEnq && (

        <Modal
          title="Create Customer Enquiry"
          subtitle="Capture the customer requirement"
          close={() =>
            setShowEnq(false)
          }
        >

          <form
            className="modalForm"
            onSubmit={createEnq}
          >

            <div className="formSectionTitle">
              CUSTOMER INFORMATION
            </div>

            <div className="grid2">

              <input
                required
                placeholder="Company Name"
                value={
                  form.companyName
                }
                onChange={e =>
                  setForm({
                    ...form,
                    companyName:
                      e.target.value
                  })
                }
              />

              <input
                required
                placeholder="Contact Person"
                value={
                  form.contactPerson
                }
                onChange={e =>
                  setForm({
                    ...form,
                    contactPerson:
                      e.target.value
                  })
                }
              />

              <input
                required
                placeholder="Mobile Number"
                value={
                  form.mobile
                }
                onChange={e =>
                  setForm({
                    ...form,
                    mobile:
                      e.target.value
                  })
                }
              />

              <input
                required
                type="email"
                placeholder="Email Address"
                value={
                  form.email
                }
                onChange={e =>
                  setForm({
                    ...form,
                    email:
                      e.target.value
                  })
                }
              />

              <input
                required
                placeholder="City"
                value={
                  form.city
                }
                onChange={e =>
                  setForm({
                    ...form,
                    city:
                      e.target.value
                  })
                }
              />

            </div>

            <div className="formSectionTitle">
              REQUIREMENT
            </div>

            <div className="grid2">

              <div>

                <label>
                  Required Date
                </label>

                <input
                  required
                  type="date"
                  value={
                    form.requiredDate
                  }
                  onChange={e =>
                    setForm({
                      ...form,
                      requiredDate:
                        e.target.value
                    })
                  }
                />

              </div>

              <div>

                <label>
                  Product
                </label>

                <select
                  value={
                    form.productId
                  }
                  onChange={e =>
                    setForm({
                      ...form,
                      productId:
                        e.target.value
                    })
                  }
                >

                  {inventory.map(
                    item => (

                      <option
                        key={
                          item.productId
                        }
                        value={
                          item.productId
                        }
                      >
                        {
                          item.product.code
                        }
                        {' – '}
                        {
                          item.product.name
                        }
                      </option>

                    )
                  )}

                </select>

              </div>

            </div>

            <input
              required
              type="number"
              min="1"
              placeholder="Required Quantity"
              value={
                form.quantity
              }
              onChange={e =>
                setForm({
                  ...form,
                  quantity:
                    e.target.value
                })
              }
            />

            <textarea
              placeholder="Additional notes / customer requirements"
              value={
                form.notes
              }
              onChange={e =>
                setForm({
                  ...form,
                  notes:
                    e.target.value
                })
              }
            />

            <button className="primaryButton">
              Create Enquiry
            </button>

          </form>

        </Modal>

      )}

      {/* =================================================
          QUOTATION MODAL
      ================================================= */}

      {showQuote && (

        <Modal
          title="Create Quotation"
          subtitle="Prepare a commercial proposal"
          close={() =>
            setShowQuote(false)
          }
        >

          <form
            className="modalForm"
            onSubmit={createQuote}
          >

            <div className="formSectionTitle">
              QUOTATION DETAILS
            </div>

            <select
              required
              value={
                qform.enquiryId
              }
              onChange={e =>
                setQform({
                  ...qform,
                  enquiryId:
                    e.target.value
                })
              }
            >

              <option value="">
                Select enquiry
              </option>

              {enquiries.map(
                item => (

                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.number}
                    {' – '}
                    {
                      item
                        .customer
                        .companyName
                    }
                  </option>

                )
              )}

            </select>

            <label>
              Valid Until
            </label>

            <input
              required
              type="date"
              value={
                qform.validUntil
              }
              onChange={e =>
                setQform({
                  ...qform,
                  validUntil:
                    e.target.value
                })
              }
            />

            <div className="formSectionTitle">
              PRODUCT & PRICING
            </div>

            <select
              value={
                qform.productId
              }
              onChange={e => {

                const item =
                  inventory.find(
                    v =>
                      v.productId ===
                      Number(
                        e.target.value
                      )
                  );

                setQform({
                  ...qform,

                  productId:
                    e.target.value,

                  unitPrice:
                    Number(
                      item.product
                        .basePrice
                    )
                });

              }}
            >

              {inventory.map(
                item => (

                  <option
                    key={
                      item.productId
                    }
                    value={
                      item.productId
                    }
                  >
                    {
                      item.product.code
                    }
                    {' – '}
                    {
                      item.product.name
                    }
                  </option>

                )
              )}

            </select>

            <div className="grid2">

              <div>

                <label>
                  Quantity
                </label>

                <input
                  type="number"
                  min="1"
                  value={
                    qform.quantity
                  }
                  onChange={e =>
                    setQform({
                      ...qform,
                      quantity:
                        e.target.value
                    })
                  }
                />

              </div>

              <div>

                <label>
                  Unit Price (₹)
                </label>

                <input
                  type="number"
                  min="0"
                  value={
                    qform.unitPrice
                  }
                  onChange={e =>
                    setQform({
                      ...qform,
                      unitPrice:
                        e.target.value
                    })
                  }
                />

              </div>

            </div>

            <div className="grid2">

              <div>

                <label>
                  Discount %
                </label>

                <input
                  type="number"
                  min="0"
                  max="100"
                  value={
                    qform.discountPct
                  }
                  onChange={e =>
                    setQform({
                      ...qform,
                      discountPct:
                        e.target.value
                    })
                  }
                />

              </div>

              <div>

                <label>
                  GST %
                </label>

                <input
                  type="number"
                  min="0"
                  max="100"
                  value={
                    qform.gstPct
                  }
                  onChange={e =>
                    setQform({
                      ...qform,
                      gstPct:
                        e.target.value
                    })
                  }
                />

              </div>

            </div>

            <div className="pricePreview">

              <strong>
                Pricing controlled by backend
              </strong>

              <span>
                Final quotation amount is calculated
                and validated by the Node.js backend.
              </span>

            </div>

            <button className="primaryButton">
              Generate Quotation
            </button>

          </form>

        </Modal>

      )}

      {/* =================================================
          DISPATCH MODAL
      ================================================= */}

      {showDispatch && (

        <Modal
          title={`Dispatch ${showDispatch.number}`}
          subtitle="Record vehicle and driver details"
          close={() =>
            setShowDispatch(null)
          }
        >

          <form
            className="modalForm"
            onSubmit={dispatch}
          >

            <div className="dispatchNotice">

              <strong>
                INVENTORY TRANSACTION
              </strong>

              <span>
                Physical stock will decrease and
                reserved stock will be released
                after successful dispatch.
              </span>

            </div>

            <input
              name="vehicle"
              required
              placeholder="Vehicle Number"
            />

            <input
              name="driver"
              required
              placeholder="Driver Name"
            />

            <button className="primaryButton">
              Confirm Dispatch
            </button>

          </form>

        </Modal>

      )}

    </div>
  );
}

/* =========================================================
   PAGE HEADER
========================================================= */

function PageHeader({
  title,
  subtitle,
  action
}) {

  return (

    <div className="top">

      <div>

        <div className="eyebrow">
          FUNDSROOM OPERATIONS
        </div>

        <h2>
          {title}
        </h2>

        <p>
          {subtitle}
        </p>

      </div>

      {action}

    </div>

  );
}

/* =========================================================
   METRIC STRIP
========================================================= */

function MetricStrip({ items }) {

  return (

    <div className="metricStrip">

      {items.map(
        (item, index) => (

          <div
            className="metric"
            key={index}
          >

            <span>
              {item.label}
            </span>

            <strong>
              {item.value}
            </strong>

          </div>

        )
      )}

    </div>

  );
}

/* =========================================================
   TOOLBAR
========================================================= */

function Toolbar({
  search,
  setSearch,
  filter,
  setFilter,
  options
}) {

  return (

    <div className="toolbar">

      <div className="searchBox">

        <span>
          ⌕
        </span>

        <input
          value={search}
          onChange={e =>
            setSearch(
              e.target.value
            )
          }
          placeholder="Search by number, customer..."
        />

      </div>

      <select
        value={filter}
        onChange={e =>
          setFilter(
            e.target.value
          )
        }
      >

        {options.map(
          option => (

            <option
              key={option}
              value={option}
            >
              {option === 'ALL'
                ? 'All statuses'
                : option}
            </option>

          )
        )}

      </select>

    </div>

  );
}

/* =========================================================
   STATUS
========================================================= */

function Status({ status }) {

  return (

    <span
      className={
        `pill status-${String(
          status
        ).toLowerCase()}`
      }
    >
      {status}
    </span>

  );

}

/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({
  title,
  text,
  action
}) {

  return (

    <div className="emptyState">

      <div className="emptyIcon">
        ◇
      </div>

      <h3>
        {title}
      </h3>

      <p>
        {text}
      </p>

      {action}

    </div>

  );

}

/* =========================================================
   MODAL
========================================================= */

function Modal({
  title,
  subtitle,
  close,
  children
}) {

  return (

    <div
      className="overlay"
      onMouseDown={e => {

        if (
          e.target ===
          e.currentTarget
        ) {
          close();
        }

      }}
    >

      <div className="modal">

        <div className="modalHeader">

          <div>

            <div className="eyebrow">
              ERP WORKFLOW
            </div>

            <h2>
              {title}
            </h2>

            {subtitle && (

              <p>
                {subtitle}
              </p>

            )}

          </div>

          <button
            className="ghost closeButton"
            onClick={close}
          >
            ×
          </button>

        </div>

        {children}

      </div>

    </div>

  );

}

/* =========================================================
   DATE HELPER
========================================================= */

function formatDate(value) {

  if (!value) {
    return '—';
  }

  return new Date(
    value
  ).toLocaleDateString(
    'en-IN',
    {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }
  );

}

/* =========================================================
   START REACT
========================================================= */

createRoot(
  document.getElementById('root')
).render(
  <App />
);