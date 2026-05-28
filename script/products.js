import Fuse from 'https://cdn.jsdelivr.net/npm/fuse.js@7.0.0/dist/fuse.mjs';

class Products {
    selector = {
        products: "[data-js-products]",
        categoryHeader: "[data-js-header-category]",
        productsEmpty: "[data-js-products-empty]",
        productsGrid: "[data-js-products-grid]",
        pagination: "[data-js-pagination]",
        paginationPages: "[data-js-pagination-pages]",
        btnPaginationLeft: "[data-js-btn-left]",
        btnPaginationRight: "[data-js-btn-right]",
        productsFilter: "[data-js-products-filter]",
        filterContainer: "[data-js-filter-container]",
        filterOrders: "[data-js-accordion-body]",
        filterOrderOptions: "[data-js-order-checkbox]",
    }

    localStorageSelectors = {
        favorite: "favorite",
    }

    sessionStorageSelectors = {
        server: "server",
    }

    sortingSelectors = {
        "name-asc": (a, b) => a.name.localeCompare(b.name),
        "name-desc": (a, b) => b.name.localeCompare(a.name),
        "price-asc": (a, b) => a.price - b.price,
        "price-desc": (a, b) => b.price - a.price,
    }

    constructor() {
        this.productsElement = document.querySelector(this.selector.products);
        this.categoryHeader = document.querySelector(this.selector.categoryHeader);
        this.productsEmptyMessage = document.querySelector(this.selector.productsEmpty);
        this.productsGrid = this.productsElement.querySelector(this.selector.productsGrid);
        this.paginationContainer = this.productsElement.querySelector(this.selector.pagination);
        this.paginationPages = this.paginationContainer.querySelector(this.selector.paginationPages);
        this.pageElements = [];
        this.btnleft = this.paginationContainer.querySelector(this.selector.btnPaginationLeft);
        this.btnright = this.paginationContainer.querySelector(this.selector.btnPaginationRight);
        this.filterElement = this.productsElement.querySelector(this.selector.productsFilter);
        this.filterContainer = this.filterElement.querySelector(this.selector.filterContainer);
        this.filterOrders = document.querySelector(this.selector.filterOrders);
        this.filterOrderOptions = this.filterOrders.querySelectorAll(this.selector.filterOrderOptions);

        this.currentPage = 1;
        this.maxNumberOfPages = 1;
        this.maxProductsForPage = 12;

        this.filterFields = ["car_model", "year", "engine_badge", "engine_type", "engine_code", "power_hp"];
        this.filters = { car_model: [], year: [], engine_badge: [], engine_type: [], engine_code: [], power_hp: [] };
        this.filteredProducts = [];
        this.productOrder = "";

        this.products = [];

        this.initialize();
    }

    async initialize() {
        const category = this.getCategoryFromURL();
        this.categoryHeader.textContent = category;
        this.currentPage = this.getPageFromURL() || 1;

        const hasActiveServer = sessionStorage.getItem(this.sessionStorageSelectors.server);

        if(hasActiveServer === "online")
            this.products = await this.getProductsFromServer(category);
        else
            this.products = await this.getProductsFromLocal(category);

        if(category === "search") {
            const search = this.getSearchFromURL();
            this.products = this.getSearchProducts(search);
        }

        if(category === "favorites") {
            const productsFavorite = JSON.parse(localStorage.getItem(this.localStorageSelectors.favorite)) || [];
            console.log(productsFavorite);
            this.products = this.products.filter(product => productsFavorite.some(productFavorite => productFavorite.toString() === product.id.toString()));
            this.productsEmptyMessage.textContent = "No products in favorites!";
        }
        else {
            this.productsEmptyMessage.textContent = "No products found";
        }

        if(this.products.length > 0) {
            this.productsElement.classList.remove("is-empty");

            this.getFilterFromURL();

            this.getOrderFormURL();

            if(this.hasActiveFilter())
                this.applyFilters();
            else
                this.loadProducts();
            this.loadPagination();
            this.loadFilters();

            this.bindEvents();
        }
        else {
            this.productsElement.classList.add("is-empty");
            this.filterElement.classList.add("is-empty");

            if(category !== "search" && category !== "favorites")
                window.location.href = "404.html";
        }
    }

    async getProductsFromServer(category) {
        try {
            let response;
            if (category === "favorites" || category === "search")
                response = await fetch(`http://localhost:3000/products`);
            else
                response = await fetch(`http://localhost:3000/products?category=${category}`);

            const json = await response.json();

            return json.map(({ id, name, sku, oe_number, price, is_on_sale, discount_percentage, sale_price, category, images, manufacturer, compatibility, search_keywords }) => {
                return { id, name, sku, oe_number, price, is_on_sale, discount_percentage, sale_price, category, images, manufacturer, compatibility, search_keywords };
            });
        }
        catch (error) {
            window.location.href = "404.html";
        }
    }

    async getProductsFromLocal(category) {
        try {
            const response = await fetch(`server.json5`);
            const json = await response.json();
            let products = json?.products;

            if(category !== "search" && category !== "favorites")
                products = products.filter(product => product.category === category);

            return products.map(({ id, name, sku, oe_number, price, is_on_sale, discount_percentage, sale_price, category, images, manufacturer, compatibility, search_keywords }) => {
                return { id, name, sku, oe_number, price, is_on_sale, discount_percentage, sale_price, category, images, manufacturer, compatibility, search_keywords };
            });
        }
        catch (error) {
            window.location.href = "404.html";
        }
    }

    getSearchProducts(search) {
        const options = {
            keys: ["search_keywords"],
            threshold: 0.3,
            ignoreLocation: true,
            findAllMatches: true,
        }

        const fuse = new Fuse(this.products, options);

        const results = fuse.search(search)

        return results.map(result => result.item);
    }

    getSearchFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get("search");
    }

    getCategoryFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get("category") || urlParams.get("view");
    }

    getPageFromURL() {
        const urlParams = new URLSearchParams(window.location.search);

        this.maxNumberOfPages = Math.ceil(this.products.length / this.maxProductsForPage) || 1;

        const currentPage = Number(urlParams.get("page")) || 1;

        return Math.min(currentPage, this.maxNumberOfPages);
    }

    setPageFromURL() {
        const urlParams = new URLSearchParams(window.location.search);

        const page = Number(urlParams.get("page")) || 1;

        if(page !== this.currentPage) {
            urlParams.set("page", this.currentPage.toString());
            window.history.pushState({}, "", `${window.location.pathname}?${urlParams}`);
        }
    }

    getFilterFromURL() {
        const urlParams = new URLSearchParams(window.location.search);

        this.filterFields.forEach(filterFiled => {
            this.filters[filterFiled] = urlParams.get(filterFiled)?.split(",") || [];
        });
    }

    setFilterFromURL() {
        const urlParams = new URLSearchParams(window.location.search);

        this.filterFields.forEach(filterFiled => {
            urlParams.delete(filterFiled);

            if (this.filters[filterFiled].join(""))
                urlParams.set(filterFiled, this.filters[filterFiled].join(","));
        });

        window.history.replaceState({}, "", `${window.location.pathname}?${urlParams}`);
    }

    hasActiveFilter() {
        return this.filterFields.some(filterField => this.filters[filterField] && this.filters[filterField].length > 0);
    }

    loadProducts() {
        if (this.productsElement.classList.contains("is-empty")) return;

        let products = this.hasActiveFilter() ? [...this.filteredProducts] : [...this.products];

        const sortFunction = this.sortingSelectors[this.productOrder];

        if(sortFunction)
            products = products.sort(sortFunction);

        this.productsGrid.textContent = "";

        const startIndexPage = (this.currentPage - 1) * this.maxProductsForPage;
        const endIndexPage = startIndexPage + this.maxProductsForPage;

        const currentPageProducts = products.slice(startIndexPage, endIndexPage);

        const favoriteProducts = JSON.parse(localStorage.getItem(this.localStorageSelectors.favorite)) || [];

        currentPageProducts.forEach((product) => {
            const isFavorite = favoriteProducts.includes(product.id);

            const productCard = document.createElement("a");
            productCard.classList.add("product-card");
            productCard.setAttribute("href", "product-details.html?id=" + product.id);
            productCard.setAttribute("data-js-product-card", "");

            productCard.innerHTML = `
                        <div class="product-card__sale ${product.is_on_sale ? "is-sale" : ""}">
                            <h5 class="heading-H5">-${product.discount_percentage}%</h5>
                        </div>

                        <div class="product-card__image-wrapper">
                            <img class="product-card__img" src="${product.images[0]}" alt="${product.name}">
                        </div>

                        <div class="product-card__content">
                            <h4 class="heading-H4 product-card__title">${product.name}</h4>
                            <p class="paragraph-P4 product-card__description">${product.manufacturer + " - " + product.sku}</p>
                            <h3 class="heading-H3 product-card__price">${product.is_on_sale ? product.sale_price : product.price} ${product.currency || "MDL"}</h3>
                        </div>

                        <div class="product-card__actions">
                            <button class="btn-text-32 primary" data-js-btn-cart>Add to Cart</button>
                            <button class="btn-icon-32 primary">
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <use href="./assets/svg/icons.svg#icon-see"></use>
                                </svg>
                            </button>
                            <button class="btn-icon-32 ${isFavorite ? "is-active" : ""}" data-js-btn-favorite>
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <use href="./assets/svg/icons.svg#icon-favorite"></use>
                                </svg>
                            </button>
                        </div>
                    `;

            this.productsGrid.appendChild(productCard);
        })
    }

    loadPagination() {
        this.setPageFromURL();

        this.paginationPages.textContent = "";
        this.pageElements = [];

        const products = this.hasActiveFilter() ? this.filteredProducts : this.products;
        this.maxNumberOfPages = Math.ceil(products.length / this.maxProductsForPage) || 1;

        for (let i = 0; i < this.maxNumberOfPages; i++) {
            const page = document.createElement("span");
            page.classList.add("pagination__page");
            page.classList.toggle("is-active", i === (this.currentPage - 1));
            page.textContent = (i + 1).toString();

            this.paginationPages.appendChild(page);
            this.pageElements.push(page);
        }
    }

    changePage() {
        this.setPageFromURL();
        this.pageElements.forEach(page => page.classList.remove("is-active"));
        if (this.pageElements[this.currentPage - 1])
            this.pageElements[this.currentPage - 1].classList.add("is-active");

        this.loadProducts();
    }

    getFilters() {
        const filters = this.filterFields.reduce((filterArray, filterFiled) => {
            filterArray[filterFiled] = new Set();
            return filterArray;
        }, {});

        this.products.forEach(product => {
            if (!product.compatibility) return;

            this.filterFields.forEach(filter => {
                const filterValue = product.compatibility[filter];
                if (!filterValue) return;

                if(Array.isArray(filterValue)) {
                    filterValue.forEach(value => filters[filter].add(value));
                }
                else {
                    filters[filter].add(filterValue);
                }
            });
        });

        Object.keys(filters).forEach(filter => {
            filters[filter] = Array.from(filters[filter]).map(filter => filter.toString()).sort((a, b) => a.localeCompare(b, undefined, { numeric: true}));
        });

        return filters;
    }

    loadFilters() {
        this.filterContainer.textContent = "";
        const filters = this.getFilters();

        this.filterFields.forEach(filterField => {
            const accordion = document.createElement("div");
            accordion.classList.add("accordion");
            accordion.setAttribute("data-js-accordion", "");

            accordion.innerHTML = `
                        <button class="accordion__btn" aria-label="Title" data-js-btn-accordion>
                            <span class="heading-H4 accordion__header-title">${filterField.split("_").join(" ")}</span>
                            <svg class="accordion__icon" width="12" height="24" viewBox="0 0 12 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path fill-rule="evenodd" clip-rule="evenodd" d="M10.1569 12.7111L4.49994 18.3681L3.08594 16.9541L8.03594 12.0041L3.08594 7.05414L4.49994 5.64014L10.1569 11.2971C10.3444 11.4847 10.4497 11.739 10.4497 12.0041C10.4497 12.2693 10.3444 12.5236 10.1569 12.7111Z" fill="white"/>
                            </svg>
                        </button>

                        <div class="accordion__body-wrapper">
                            <div class="accordion__body">
                                <div class="accordion__body-content">
                                    <div class="accordion__body-content" data-js-accordion-body></div>
                                </div>
                            </div>
                        </div>

                        <div class="accordion__divider"></div>
                    `;

            const accordionBody = accordion.querySelector("[data-js-accordion-body]");

            filters[filterField].forEach(filter => {
                const filterOption = document.createElement("div");
                filterOption.classList.add("input-checkbox");

                const checked = this.filters[filterField].includes(filter);

                const clearFilter = filterField + "_" + filter.toString().split(" ").join("-").toLowerCase();

                filterOption.innerHTML = `
                            <input class="input-checkbox__input" type="checkbox" id="${clearFilter}" name="${filterField}" ${checked ? "checked" : ""} data-js-filter-type="${filterField}" data-js-filter-value="${filter}">
                            <label class="input-checkbox__label" for="${clearFilter}">
                                <span class="input-checkbox__checkbox">
                                    <svg class="input-checkbox__checkmark" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <use href="./assets/svg/icons.svg#icon-checkmark">
                                    </svg>
                                </span>
                                <span class="paragraph-P3-medium">${filter}</span>
                            </label>
                        `;

                accordionBody.appendChild(filterOption);
            })

            this.filterContainer.appendChild(accordion);
        })
    }

    applyFilters() {
        this.filteredProducts = this.products.filter(product => {
            const compatibility = product.compatibility;
            if(!compatibility) return false;

            return this.filterFields.every(filterField => this.filterType(filterField, compatibility));
        });

        this.setFilterFromURL();

        if(this.filteredProducts.length > 0) {
            this.productsElement.classList.remove("is-empty");
            this.currentPage = 1;
            this.loadProducts();
            this.loadPagination();
        }
        else
            this.productsElement.classList.add("is-empty");
    }

    filterType(filterType, productCompatibility) {
        if(this.filters[filterType].length === 0) return true;

        const filterValue = productCompatibility[filterType];
        if (!filterValue) return false;

        if(Array.isArray(filterValue)) {
            return filterValue.some(value => this.filters[filterType].includes(value.toString()));
        }
        else {
            return this.filters[filterType].includes(productCompatibility[filterType].toString())
        }
    }

    changeOrder(checkbox, order, shouldRender = false) {
        if (!checkbox || !order) return;

        if(this.productOrder === order) {
            checkbox.checked = false;
            this.productOrder = "";

            this.loadProducts();
            this.setOrderFormURL();
            return;
        }

        this.filterOrderOptions.forEach(filterOrderOption => {
            filterOrderOption.checked = false;
        });

        checkbox.checked = true;
        this.productOrder = order;

        if(shouldRender) {
            this.loadProducts();
            this.setOrderFormURL();
        }
    }

    getOrderFormURL() {
        const urlParams = new URLSearchParams(window.location.search);

        const order = urlParams.get("order");

        if(!order) return;

        const checkbox = this.filterOrders.querySelector(`[data-js-filter-value="${order}"]`);

        if(!checkbox) return;

        this.changeOrder(checkbox, order, false);
    }

    setOrderFormURL() {
        const urlParams = new URLSearchParams(window.location.search);

        if(!this.productOrder)
            urlParams.delete("order");
        else
            urlParams.set("order", this.productOrder);

        window.history.pushState({}, "", `${window.location.pathname}?${urlParams}`);
    }

    bindEvents() {
        this.btnleft.addEventListener("click", event => {
            event.preventDefault();

            this.currentPage = Math.max(1, this.currentPage - 1);

            this.changePage();
        });

        this.btnright.addEventListener("click", event => {
            event.preventDefault();

            this.currentPage = Math.min(this.currentPage + 1, this.maxNumberOfPages);

            this.changePage();
        });

        this.paginationPages.addEventListener("click", event => {
            event.preventDefault();
            const { target } = event;

            if (target.classList.contains("pagination__page")) {
                this.currentPage = Number(target.textContent) || this.currentPage;
                this.changePage();
            }
        });

        this.filterContainer.addEventListener("change", event => {
            const { target } = event;

            const isCheckbox = target.classList.contains("input-checkbox__input");

            if(!isCheckbox) return;

            const filterType = target.getAttribute("data-js-filter-type");
            const filterValue = target.getAttribute("data-js-filter-value");

            if(!filterType || !filterValue) return;

            const index = this.filters[filterType].indexOf(filterValue);

            if(index === -1) {
                this.filters[filterType].push(filterValue);
            } else {
                this.filters[filterType].splice(index, 1);
            }

            this.applyFilters();
        });

        this.filterOrders.addEventListener("change", event => {
            const { target } = event;

            const isCheckbox = target.classList.contains("input-checkbox__input");

            if(!isCheckbox) return;

            const filterValue = target.getAttribute("data-js-filter-value");

            if(!filterValue) return;

            this.changeOrder(target, filterValue, true);
        })

        window.addEventListener("popstate", () => {
            this.getOrderFormURL();

            this.getFilterFromURL();

            if(this.hasActiveFilter()) {
                this.applyFilters();
            }
            else {
                this.productsElement.classList.remove("is-empty");
                this.loadProducts();
                this.loadPagination();
            }

            this.loadFilters();
        });
    }
}

window.addEventListener("app-ready", () => {
    new Products();
})