import { useSearchParams } from "react-router-dom"; 
import useFetch from "../hooks/useFetch"; 
import { getProducts, getCategories } from "../api/productService"; 
import { useCart } from "../context/CartContext"; 
import AsyncContent from "../components/AsyncContent"; 
import ProductGrid from "../components/ProductGrid"; 
import SearchBar from "../components/SearchBar"; 
import PriceFilter from "../components/PriceFilter"; 
import Pagination from "../components/Pagination"; 
import EmptyState from "../components/EmptyState"; 
 
// Products per page. To test paging with only 8 products, 
// temporarily change this to 3. 
const PAGE_SIZE = 12; 
 
// The "value" of each option must match the sort names the server 
// accepts. "" means the default (newest first). 
const SORT_OPTIONS = [ 
  { value: "", label: "Newest" }, 
  { value: "oldest", label: "Oldest" }, 
  { value: "price_asc", label: "Price: low to high" }, 
  { value: "price_desc", label: "Price: high to low" }, 
  { value: "name_asc", label: "Name: A to Z" }, 
  { value: "name_desc", label: "Name: Z to A" }, 
]; 
const SORT_VALUES = SORT_OPTIONS.map((option) => option.value); 
 
// Anyone can edit the URL by hand, so every value is cleaned before 
// use. A bad value falls back to "no filter" instead of an error. 
function readPrice(value) { 
  if (!value) return ""; 
  const number = Number(value); 
  const valid = Number.isFinite(number) && number >= 0 && number <= 1000000; 
  return valid ? String(number) : ""; 
} 
 
function readPage(value) { 
  const number = parseInt(value, 10); 
  if (!Number.isInteger(number) || number < 1) return 1; 
  return Math.min(number, 100000); 
} 
 
function Products() { 
  // Everything the visitor chooses lives in the URL, for example 
  // /products?category=Home&sort=price_asc&page=2 
  // so the page survives a refresh and can be bookmarked or shared. 
  const [searchParams, setSearchParams] = useSearchParams(); 
 
  const search = (searchParams.get("search") || "").slice(0, 100); 
  const category = (searchParams.get("category") || "").slice(0, 50); 
  const minPrice = readPrice(searchParams.get("minPrice")); 
  const maxPrice = readPrice(searchParams.get("maxPrice")); 
  const sortParam = searchParams.get("sort") || ""; 
  const sort = SORT_VALUES.includes(sortParam) ? sortParam : ""; 
  const page = readPage(searchParams.get("page")); 
 
  const { addItem } = useCart(); 
 
  // Fetch again whenever any of these values change 
  const products = useFetch( 
    () => 
      getProducts({ 
        search, 
        category, 
        minPrice, 
        maxPrice, 
        sort, 
        page, 
        limit: PAGE_SIZE, 
      }), 
    [search, category, minPrice, maxPrice, sort, page] 
  ); 
  const categories = useFetch(() => getCategories(), []); 
 
  // Changes some URL values. A new filter or sort goes back to page 1. 
  const updateParams = (changes, keepPage = false) => { 
    const next = new URLSearchParams(searchParams); 
    Object.entries(changes).forEach(([key, value]) => { 
      if (value) next.set(key, value); 
      else next.delete(key); 
    }); 
    if (!keepPage) next.delete("page"); 
    setSearchParams(next); 
  }; 
 
  const goToPage = (nextPage) => { 
    updateParams({ page: nextPage > 1 ? String(nextPage) : "" }, true); 
    window.scrollTo({ top: 0, behavior: "smooth" }); 
  }; 
 
  const clearAll = () => setSearchParams({}); 
 
  const list = products.data ? products.data.products : []; 
  const pagination = products.data ? products.data.pagination : null; 
  const hasFilters = Boolean(search || category || minPrice || maxPrice); 
 
  // Asked for a page past the end (for example ?page=99) 
  const pageOutOfRange = Boolean( 
    pagination && pagination.total > 0 && list.length === 0 
  ); 
 
  let countText = "Loading products..."; 
  if (products.error) { 
    countText = ""; 
  } else if (!products.loading && pagination) { 
    const total = pagination.total; 
    const noun = total === 1 ? "product" : "products"; 
    if (list.length > 0) { 
      const first = (pagination.page - 1) * pagination.limit + 1; 
      const last = first + list.length - 1; 
      countText = `Showing ${first}-${last} of ${total} ${noun}`; 
    } else { 
      countText = `${total} ${noun} found`; 
    } 
  } 
 
  return ( 
    <div className="container py-4 py-lg-5"> 
      <div className="mb-3"> 
        <h1 className="h3 mb-1">Products</h1> 
        <p className="text-muted mb-0">{countText}</p> 
      </div> 
 
      {/* Search, category, price, sort */} 
      <div className="mb-4"> 
        <SearchBar 
          initialValue={search} 
          onSearch={(term) => updateParams({ search: term })} 
        /> 
 
        <div className="d-flex flex-wrap align-items-center gap-2 mt-3"> 
          <span className="filter-label me-1">Category</span> 
          <button 
            type="button" 
            aria-pressed={!category} 
            className={`btn btn-sm rounded-pill ${ 
              category ? "btn-outline-primary" : "btn-primary" 
            }`} 
            onClick={() => updateParams({ category: "" })} 
          > 
            All 
          </button> 
          {(categories.data || []).map((name) => ( 
            <button 
              key={name} 
              type="button" 
              aria-pressed={category === name} 
              className={`btn btn-sm rounded-pill ${ 
                category === name ? "btn-primary" : "btn-outline-primary" 
              }`} 
              onClick={() => updateParams({ category: name })} 
            > 
              {name} 
            </button> 
          ))} 
 
          {hasFilters && ( 
            <button 
              type="button" 
              className="btn btn-link btn-sm text-decoration-none ms-sm-auto" 
              onClick={clearAll} 
            > 
              Clear all filters 
            </button> 
          )} 
        </div> 
 
        <div className="row g-3 align-items-end mt-1"> 
          <div className="col-12 col-md-7 col-lg-6"> 
            <PriceFilter 
              minPrice={minPrice} 
              maxPrice={maxPrice} 
              onApply={(min, max) => 
                updateParams({ minPrice: min, maxPrice: max }) 
              } 
            /> 
          </div> 
          <div className="col-12 col-md-5 col-lg-3 ms-lg-auto"> 
            <label htmlFor="sort" className="filter-label d-block mb-1"> 
              Sort by 
            </label> 
            <select 
              id="sort" 
              className="form-select" 
              value={sort} 
              onChange={(e) => updateParams({ sort: e.target.value })} 
            > 
              {SORT_OPTIONS.map((option) => ( 
                <option key={option.value} value={option.value}> 
                  {option.label} 
                </option> 
              ))} 
            </select> 
          </div> 
        </div> 
      </div> 
 
      <AsyncContent 
        loading={products.loading} 
        error={products.error} 
        onRetry={products.reload} 
        loadingMessage="Loading products..." 
        isEmpty={list.length === 0} 
        emptyState={ 
          pageOutOfRange ? ( 
            <EmptyState 
              title="That page does not exist" 
              message="There are fewer pages of results than that." 
              actionLabel="Go to the first page" 
              onAction={() => goToPage(1)} 
            /> 
          ) : ( 
            <EmptyState 
              title="No products found" 
              message="Try a different search, category or price range." 
              actionLabel={hasFilters ? "Clear filters" : undefined} 
              onAction={clearAll} 
            /> 
          ) 
        } 
      > 
        <ProductGrid products={list} onAddToCart={addItem} /> 
        {pagination && ( 
          <Pagination 
            page={pagination.page} 
            totalPages={pagination.totalPages} 
            onPageChange={goToPage} 
          /> 
        )} 
      </AsyncContent> 
    </div> 
  ); 
} 
 
export default Products;