import { useState } from "react"; 
import { Link, useSearchParams } from "react-router-dom"; 
import useFetch from "../hooks/useFetch"; 
import { getAdminProducts, deleteProduct } from "../api/adminService"; 
import { getCategories } from "../api/productService"; 
import { formatPrice } from "../utils/formatPrice"; 
import { optimizeImage } from "../utils/imageUrl"; 
import AsyncContent from "../components/AsyncContent"; 
import EmptyState from "../components/EmptyState"; 
import SearchBar from "../components/SearchBar"; 
import Pagination from "../components/Pagination"; 
import StockBadge from "../components/StockBadge"; 
import ConfirmDialog from "../components/ConfirmDialog"; 
// Products per page. To test paging with few products, 
// temporarily change this to 3. 
const PAGE_SIZE = 10; 
// The values must match what the server accepts. "" means "no filter". 
const SORT_OPTIONS = [ 
{ value: "", label: "Newest" }, 
{ value: "oldest", label: "Oldest" }, 
{ value: "name_asc", label: "Name: A to Z" }, 
{ value: "name_desc", label: "Name: Z to A" }, 
{ value: "price_asc", label: "Price: low to high" }, 
{ value: "price_desc", label: "Price: high to low" }, 
{ value: "stock_asc", label: "Stock: low to high" }, 
{ value: "stock_desc", label: "Stock: high to low" }, 
]; 
const STATUS_OPTIONS = [ 
  { value: "", label: "All products" }, 
  { value: "active", label: "Visible" }, 
  { value: "hidden", label: "Hidden" }, 
]; 
const STOCK_OPTIONS = [ 
  { value: "", label: "Any stock" }, 
  { value: "out", label: "Out of stock" }, 
  { value: "low", label: "Low stock" }, 
  { value: "ok", label: "Well stocked" }, 
]; 
 
// URL values can be edited by anyone, so only allowed values are used 
function pick(value, options) { 
  return options.some((option) => option.value === value) ? value : ""; 
} 
 
function readPage(value) { 
  const number = parseInt(value, 10); 
  if (!Number.isInteger(number) || number < 1) return 1; 
  return Math.min(number, 100000); 
} 
 
function AdminProducts() { 
  const [searchParams, setSearchParams] = useSearchParams(); 
 
  const search = (searchParams.get("search") || "").slice(0, 100); 
  const category = (searchParams.get("category") || "").slice(0, 50); 
  const status = pick(searchParams.get("status") || "", STATUS_OPTIONS); 
  const stock = pick(searchParams.get("stock") || "", STOCK_OPTIONS); 
  const sort = pick(searchParams.get("sort") || "", SORT_OPTIONS); 
  const page = readPage(searchParams.get("page")); 
 
  const products = useFetch( 
    () => 
      getAdminProducts({ 
        search, 
        category, 
        status, 
        stock, 
        sort, 
        page, 
        limit: PAGE_SIZE, 
      }), 
    [search, category, status, stock, sort, page] 
  ); 
  const categories = useFetch(() => getCategories(), []); 
 
  const [notice, setNotice] = useState(""); 
  const [toDelete, setToDelete] = useState(null); // the product being deleted 
  const [deleteBusy, setDeleteBusy] = useState(false); 
  const [deleteError, setDeleteError] = useState(""); 
 
  const list = products.data ? products.data.products : []; 
  const pagination = products.data ? products.data.pagination : null; 
  const threshold = products.data ? products.data.lowStockThreshold : 5; 
  const hasFilters = Boolean(search || category || status || stock); 
 
  // Changes some URL values. A new filter or sort goes back to page 1. 
  const updateParams = (changes, keepPage = false) => { 
    const next = new URLSearchParams(searchParams); 
    Object.entries(changes).forEach(([key, value]) => { 
      if (value) next.set(key, value); 
      else next.delete(key); 
    }); 
    if (!keepPage) next.delete("page"); 
    setSearchParams(next); 
    setNotice(""); 
  }; 
 
  const goToPage = (nextPage) => { 
    updateParams({ page: nextPage > 1 ? String(nextPage) : "" }, true); 
    window.scrollTo({ top: 0, behavior: "smooth" }); 
  }; 
 
  const clearAll = () => setSearchParams({}); 
 
  const cancelDelete = () => { 
    setToDelete(null); 
    setDeleteError(""); 
  }; 
 
  const confirmDelete = async () => { 
    setDeleteBusy(true); 
    setDeleteError(""); 
    try { 
      await deleteProduct(toDelete._id); 
      setNotice(`"${toDelete.name}" was deleted.`); 
      setToDelete(null); 
      // Deleted the last product on a later page: step back one page 
      if (list.length === 1 && page > 1) goToPage(page - 1); 
      else products.reload(); 
    } catch (err) { 
      setDeleteError(err.message); 
    } finally { 
      setDeleteBusy(false); 
    } 
  }; 
 
  const selectClass = "form-select form-select-sm w-auto"; 
 
  return ( 
    <> 
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 
mb-3"> 
        <div> 
          <h2 className="h4 mb-1">Products and inventory</h2> 
          <p className="text-muted mb-0"> 
            {pagination 
              ? `${pagination.total} product${ 
                  pagination.total === 1 ? "" : "s" 
                }` 
              : "Loading..."} 
          </p> 
        </div> 
        <Link to="/admin/products/new" className="btn btn-primary"> 
          Add product 
        </Link> 
      </div> 
 
      {notice && ( 
        <div className="alert alert-success" role="status"> 
          {notice} 
        </div> 
      )} 
 
      <div className="mb-3"> 
        <SearchBar 
          initialValue={search} 
          placeholder="Search by name or description..." 
          onSearch={(term) => updateParams({ search: term })} 
        /> 
 
        <div className="d-flex flex-wrap align-items-center gap-2 mt-3"> 
          <select 
            className={selectClass} 
            aria-label="Category" 
            value={category} 
            onChange={(e) => updateParams({ category: e.target.value })} 
          > 
            <option value="">All categories</option> 
            {(categories.data || []).map((name) => ( 
              <option key={name} value={name}> 
                {name} 
              </option> 
            ))} 
          </select> 
 
          <select 
            className={selectClass} 
            aria-label="Visibility" 
            value={status} 
            onChange={(e) => updateParams({ status: e.target.value })} 
          > 
            {STATUS_OPTIONS.map((o) => ( 
              <option key={o.value} value={o.value}> 
                {o.label} 
              </option> 
            ))} 
          </select> 
 
          <select 
            className={selectClass} 
            aria-label="Stock level" 
            value={stock} 
            onChange={(e) => updateParams({ stock: e.target.value })} 
          > 
            {STOCK_OPTIONS.map((o) => ( 
              <option key={o.value} value={o.value}> 
                {o.label} 
              </option> 
            ))} 
          </select> 
 
          <select 
            className={selectClass} 
            aria-label="Sort by" 
            value={sort} 
            onChange={(e) => updateParams({ sort: e.target.value })} 
          > 
            {SORT_OPTIONS.map((o) => ( 
              <option key={o.value} value={o.value}> 
                {o.label} 
              </option> 
            ))} 
          </select> 
 
          {hasFilters && ( 
            <button 
              type="button" 
              className="btn btn-link btn-sm text-decoration-none" 
              onClick={clearAll} 
            > 
              Clear filters 
            </button> 
          )} 
        </div> 
      </div> 
 
      <AsyncContent 
        loading={products.loading} 
        error={products.error} 
        onRetry={products.reload} 
        loadingMessage="Loading products..." 
        isEmpty={list.length === 0} 
        emptyState={ 
          <EmptyState 
            title={hasFilters ? "No matching products" : "No products yet"} 
            message={ 
              hasFilters 
                ? "Try different filters." 
                : "Add your first product to get started." 
            } 
            actionLabel={hasFilters ? "Clear filters" : "Add product"} 
            actionTo={hasFilters ? undefined : "/admin/products/new"} 
            onAction={hasFilters ? clearAll : undefined} 
          /> 
        } 
      > 
        <div className="card"> 
          <div className="table-responsive"> 
            <table className="table align-middle mb-0"> 
              <thead> 
                <tr> 
                  <th style={{ width: "64px" }}></th> 
                  <th>Product</th> 
                  <th className="text-end">Price</th> 
                  <th className="text-end">Stock</th> 
                  <th>Visibility</th> 
                  <th className="text-end">Actions</th> 
                </tr> 
              </thead> 
              <tbody> 
                {list.map((p) => ( 
                  <tr key={p._id}> 
                    <td> 
                      {p.image && p.image.url ? ( 
                        <img 
                          src={optimizeImage(p.image.url, 96)} 
                          alt="" 
                          width="48" 
                          height="48" 
                          className="rounded" 
                          style={{ objectFit: "cover" }} 
                        /> 
                      ) : ( 
                        <div 
                          className="bg-light border rounded d-flex align-items-center 
justify-content-center text-muted fw-semibold" 
                          style={{ width: "48px", height: "48px" }} 
                          aria-hidden="true" 
                        > 
                          {(p.name || "?").charAt(0).toUpperCase()} 
                        </div> 
                      )} 
                    </td> 
                    <td> 
                      <Link 
                        to={`/admin/products/${p._id}/edit`} 
                        className="fw-semibold text-decoration-none" 
                      > 
                        {p.name} 
                      </Link> 
                      <div className="small text-muted">{p.category}</div> 
                    </td> 
                    <td className="text-end">{formatPrice(p.price)}</td> 
                    <td className="text-end"> 
                      <div className="fw-semibold">{p.stock}</div> 
                      <StockBadge stock={p.stock} threshold={threshold} /> 
                    </td> 
                    <td> 
                      {p.isActive ? ( 
                        <span className="badge bg-light text-dark border"> 
                          Visible 
                        </span> 
                      ) : ( 
                        <span className="badge bg-secondary">Hidden</span> 
                      )} 
                    </td> 
                    <td className="text-end text-nowrap"> 
                      <Link 
                        to={`/admin/products/${p._id}/edit`} 
                        className="btn btn-sm btn-outline-primary me-2" 
                      > 
                        Edit 
                      </Link> 
                      <button 
                        type="button" 
                        className="btn btn-sm btn-outline-danger" 
                        onClick={() => setToDelete(p)} 
                      > 
                        Delete 
                      </button> 
                    </td> 
                  </tr> 
                ))} 
              </tbody> 
            </table> 
          </div> 
        </div> 
 
        {pagination && ( 
          <Pagination 
            page={pagination.page} 
            totalPages={pagination.totalPages} 
            onPageChange={goToPage} 
          /> 
        )} 
      </AsyncContent> 
 
      <ConfirmDialog 
        show={Boolean(toDelete)} 
        title="Delete this product?" 
        message={ 
          toDelete && ( 
            <> 
              <p className="mb-2"> 
                <strong>{toDelete.name}</strong> will be permanently removed, 
                together with its image. 
              </p> 
              <p className="mb-0 text-muted small"> 
                Past orders keep their own copy of the name and price. 
              </p> 
            </> 
          ) 
        } 
        confirmLabel="Delete product" 
        busy={deleteBusy} 
        error={deleteError} 
        onConfirm={confirmDelete} 
        onCancel={cancelDelete} 
      /> 
    </> 
  ); 
} 
 
export default AdminProducts;