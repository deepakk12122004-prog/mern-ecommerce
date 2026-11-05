import { Link } from "react-router-dom"; 
import useFetch from "../hooks/useFetch"; 
import { getAdminStats } from "../api/adminService"; 
import { formatPrice } from "../utils/formatPrice"; 
import { ORDER_STATUSES } from "../utils/orderStatus"; 
import AsyncContent from "../components/AsyncContent"; 
import StatCard from "../components/StatCard"; 
import StatusBadge from "../components/StatusBadge"; 
import StockBadge from "../components/StockBadge"; 
 
const shortId = (id) => id.slice(-6).toUpperCase(); 
 
// Only rendered once the numbers have arrived 
function Overview({ stats }) { 
  const { users, products, orders, lowStockThreshold } = stats; 
 
  return ( 
    <> 
      <div className="row g-3 mb-4"> 
        <div className="col-6 col-lg-3"> 
          <StatCard 
            label="Sales" 
            value={formatPrice(orders.sales)} 
            hint="All orders except cancelled" 
          /> 
        </div> 
        <div className="col-6 col-lg-3"> 
          <StatCard 
            label="Orders" 
            value={orders.total} 
            hint={`${orders.last7Days} in the last 7 days`} 
            to="/admin/orders" 
          /> 
        </div> 
        <div className="col-6 col-lg-3"> 
          <StatCard 
            label="Pending orders" 
            value={orders.byStatus.pending} 
            tone={orders.byStatus.pending > 0 ? "warning" : "default"} 
            hint="Waiting to be processed" 
            to="/admin/orders?status=pending" 
          /> 
        </div> 
        <div className="col-6 col-lg-3"> 
          <StatCard 
            label="Customers" 
            value={users.total} 
            hint={`${users.newLast7Days} new this week, ${users.admins} admin`} 
          /> 
        </div> 
        <div className="col-6 col-lg-3"> 
          <StatCard 
            label="Products" 
            value={products.active} 
            hint={`${products.hidden} hidden`} 
            to="/admin/products" 
          /> 
        </div> 
        <div className="col-6 col-lg-3"> 
          <StatCard 
            label="Low stock" 
            value={products.lowStock} 
            tone={products.lowStock > 0 ? "warning" : "default"} 
            hint={`1 to ${lowStockThreshold} left`} 
            to="/admin/products?stock=low" 
          /> 
        </div> 
        <div className="col-6 col-lg-3"> 
          <StatCard 
            label="Out of stock" 
            value={products.outOfStock} 
            tone={products.outOfStock > 0 ? "danger" : "default"} 
            hint="Visible products with 0 left" 
            to="/admin/products?stock=out" 
          /> 
        </div> 
        <div className="col-6 col-lg-3"> 
          <StatCard 
            label="Inventory value" 
            value={formatPrice(products.inventoryValue)} 
            hint={`${products.inventoryUnits} units on visible products`} 
          /> 
        </div> 
      </div> 
 
      <div className="row g-4 mb-4"> 
        <div className="col-12 col-lg-4"> 
          <div className="card h-100"> 
            <div className="card-body"> 
              <h2 className="h6 mb-3">Orders by status</h2> 
              <ul className="list-unstyled mb-0"> 
                {ORDER_STATUSES.map((status) => ( 
                  <li 
                    key={status} 
                    className="d-flex justify-content-between align-items-center mb-2" 
                  > 
                    <Link to={`/admin/orders?status=${status}`}> 
                      <StatusBadge status={status} /> 
                    </Link> 
                    <strong>{orders.byStatus[status]}</strong> 
                  </li> 
                ))} 
              </ul> 
            </div> 
          </div> 
        </div> 
 
        <div className="col-12 col-lg-8"> 
          <div className="card h-100"> 
            <div className="card-body"> 
              <h2 className="h6 mb-3">Needs restocking</h2> 
              {products.lowStockList.length === 0 ? ( 
                <p className="text-muted mb-0"> 
                  Every visible product is well stocked. 
                </p> 
              ) : ( 
                <div className="table-responsive"> 
                  <table className="table table-sm align-middle mb-0"> 
                    <thead> 
                      <tr> 
                        <th>Product</th> 
                        <th className="text-end">Stock</th> 
                        <th></th> 
                      </tr> 
                    </thead> 
                    <tbody> 
                      {products.lowStockList.map((p) => ( 
                        <tr key={p._id}> 
                          <td> 
                            <Link to={`/admin/products/${p._id}/edit`}> 
                              {p.name} 
                            </Link> 
                            <div className="small text-muted">{p.category}</div> 
                          </td> 
                          <td className="text-end">{p.stock}</td> 
                          <td className="text-end"> 
                            <StockBadge 
                              stock={p.stock} 
                              threshold={lowStockThreshold} 
                            /> 
                          </td> 
                        </tr> 
                      ))} 
                    </tbody> 
                  </table> 
                </div> 
              )} 
            </div> 
          </div> 
        </div> 
      </div> 
 
      <div className="row g-4"> 
        <div className="col-12 col-lg-8"> 
          <div className="card h-100"> 
            <div className="card-body"> 
              <div className="d-flex justify-content-between mb-3"> 
                <h2 className="h6 mb-0">Recent orders</h2> 
                <Link to="/admin/orders" className="small"> 
                  View all 
                </Link> 
              </div> 
              {orders.recent.length === 0 ? ( 
                <p className="text-muted mb-0">No orders yet.</p> 
              ) : ( 
                <div className="table-responsive"> 
                  <table className="table table-sm align-middle mb-0"> 
                    <thead> 
                      <tr> 
                        <th>Order</th> 
                        <th>Customer</th> 
                        <th className="text-end">Total</th> 
                        <th>Status</th> 
                      </tr> 
                    </thead> 
                    <tbody> 
                      {orders.recent.map((o) => ( 
                        <tr key={o._id}> 
                          <td> 
                            <Link to={`/admin/orders/${o._id}`}> 
                              #{shortId(o._id)} 
                            </Link> 
                            <div className="small text-muted"> 
                              {new Date(o.createdAt).toLocaleDateString()} 
                            </div> 
                          </td> 
                          <td>{o.user ? o.user.name : "Deleted user"}</td> 
                          <td className="text-end"> 
                            {formatPrice(o.totalPrice)} 
                          </td> 
                          <td> 
                            <StatusBadge status={o.status} /> 
                          </td> 
                        </tr> 
                      ))} 
                    </tbody> 
                  </table> 
                </div> 
              )} 
            </div> 
          </div> 
        </div> 
 
        <div className="col-12 col-lg-4"> 
          <div className="card h-100"> 
            <div className="card-body"> 
              <h2 className="h6 mb-3">Newest customers</h2> 
              <ul className="list-unstyled mb-0"> 
                {users.recent.map((u) => ( 
                  <li key={u._id} className="mb-2"> 
                    <div className="fw-semibold"> 
                      {u.name} 
                      {u.role === "admin" && ( 
                        <span className="badge bg-secondary ms-2">admin</span> 
                      )} 
                    </div> 
                    <div className="small text-muted">{u.email}</div> 
                  </li> 
                ))} 
              </ul> 
            </div> 
          </div> 
        </div> 
      </div> 
    </> 
  ); 
} 
 
function AdminOverview() { 
  const { data, loading, error, reload } = useFetch(() => getAdminStats(), []); 
 
  return ( 
    <AsyncContent 
      loading={loading} 
      error={error} 
      onRetry={reload} 
      loadingMessage="Loading dashboard..." 
> 
<Overview stats={data} /> 
</AsyncContent> 
); 
} 
export default AdminOverview;