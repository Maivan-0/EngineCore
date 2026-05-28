class LoadProducts {
    selectors = {
        productsGrid: "[data-js-products-grid]",
    }

    localStorageSelectors = {
        favorite: "favorite",
    }

    sessionStorageSelectors = {
        server: "server",
    }

    constructor(productsSlider, categoryHeader, category) {
        this.productsSlider = productsSlider;
        this.productsGrid = productsSlider.querySelector(this.selectors.productsGrid);
        this.categoryHeader = categoryHeader;
        this.category = category;

        this.maxNumberOfProducts = 16;

        this.products = [];

        this.initialize();
    }

    async initialize() {
        const hasActiveServer = sessionStorage.getItem(this.sessionStorageSelectors.server);

        if(hasActiveServer === "online")
            this.products = await this.getProductsFromServer(this.category);
        else
            this.products = await this.getProductsFromLocal(this.category);

        this.categoryHeader.textContent =  this.category.replaceAll("-", " ");

        this.loadProducts();

        if(this.productsSlider)
            new CardSlider(this.productsSlider);
    }

    async getProductsFromServer(category) {
        try {
            const response = await fetch(`http://localhost:3000/products?category=${category}`);
            const json = await response.json();

            return json.map(({ id, name, sku, oe_number, price, is_on_sale, discount_percentage, sale_price, category, images, manufacturer }) => {
                return { id, name, sku, oe_number, price, is_on_sale, discount_percentage, sale_price, category, images, manufacturer };
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

            products = products.filter(product => product.category === category);

            return products.map(({ id, name, sku, oe_number, price, is_on_sale, discount_percentage, sale_price, category, images, manufacturer, compatibility, search_keywords }) => {
                return { id, name, sku, oe_number, price, is_on_sale, discount_percentage, sale_price, category, images, manufacturer, compatibility, search_keywords };
            });
        }
        catch (error) {
            window.location.href = "404.html";
        }
    }

    loadProducts() {
        this.productsGrid.textContent = "";

        const favoriteProducts = JSON.parse(localStorage.getItem(this.localStorageSelectors.favorite)) || [];

        this.productsToRender = this.products.slice(0, this.maxNumberOfProducts);

        this.productsToRender.forEach(product => {
            const isFavorite = favoriteProducts.includes(product.id.toString());

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
        });
    }
}

class CardSlider {
    selectors = {
        productsGrid: "[data-js-products-grid]",
        btnLeft: "[data-js-btn-left]",
        btnRight: "[data-js-btn-right]",
        card: ".product-card",
    }

    constructor(slider) {
        this.slider = slider;
        this.sliderContainer = slider.querySelector(this.selectors.productsGrid);
        this.btnLeft = slider.querySelector(this.selectors.btnLeft);
        this.btnRight = slider.querySelector(this.selectors.btnRight);

        this.gapCards = 20;

        this.bindEvents();
    }

    scrollStep() {
        const firstCard = this.slider.querySelector(this.selectors.card);
        if(!firstCard) return 280;
        return firstCard.getBoundingClientRect().width + this.gapCards;
    }

    bindEvents() {
        this.btnLeft.addEventListener('click', () => {
            this.sliderContainer.scrollLeft -= this.scrollStep();
        })

        this.btnRight.addEventListener('click', () => {
            this.sliderContainer.scrollLeft += this.scrollStep();
        })
    }
}

class SKUSearch {
    selectors = {
        formSKU: "[data-js-form-sku]",
        inputSKU: "[data-js-input-sku]",
        errorMessage: "[data-js-error-message]",
    }

    sessionStorageSelectors = {
        server: "server",
    }

    constructor() {
        this.formSKU = document.querySelector(this.selectors.formSKU);
        this.inputSKU = this.formSKU.querySelector(this.selectors.inputSKU);
        this.errorMessage = this.formSKU.querySelector(this.selectors.errorMessage);

        this.bindEvents();
    }

    async setSKUFromURL(sku) {
        const urlParams = new URLSearchParams();

        let id;

        const hasActiveServer = sessionStorage.getItem(this.sessionStorageSelectors.server);

        if(hasActiveServer === "online")
            id = await this.getIdFromServer(sku);
        else
            id = await this.getIdFromLocal(sku);

        if(id === undefined) {
            this.inputSKU.setAttribute("aria-invalid", "true");
            this.errorMessage.textContent = "Product not found!";
        }
        else {
            this.inputSKU.setAttribute("aria-invalid", "false");
            this.errorMessage.textContent = "";

            urlParams.set("id", id);
            window.location.href = `product-details.html?${urlParams.toString()}`;
        }
    }

    async getIdFromServer(sku) {
        try {
            const response = await fetch(`http://localhost:3000/products?sku=${sku}`);
            const json = await response.json();

            return json[0]?.id || undefined;
        }
        catch (error) {
            window.location.href = "404.html";
        }
    }

    async getIdFromLocal(sku) {
        try {
            const response = await fetch(`server.json5`);
            const json = await response.json();
            let products = json?.products;

            const product = products.find(product => product.sku === sku);

            return product?.id || undefined;
        }
        catch (error) {
            window.location.href = "404.html";
        }
    }

    bindEvents() {
        this.formSKU.addEventListener("submit", (event) => {
            event.preventDefault();

            const sku = this.inputSKU.value.trim().toUpperCase();

            if(sku)
                this.setSKUFromURL(sku);
        })
    }
}

window.addEventListener("app-ready", () => {
    const categoryHeaders = document.querySelectorAll("[data-js-products-header]");
    const productsSliders = document.querySelectorAll("[data-js-slider]");
    const category = ["engine", "brake-system", "suspension-steering"];

    category.forEach((category, index) => {
        if(categoryHeaders[index] && productsSliders[index])
            new LoadProducts(productsSliders[index], categoryHeaders[index], category);
    });

    new SKUSearch();
});