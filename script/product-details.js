class Gallery {
    selectors = {
        mainImg: "[data-js-gallery-main-img]",
        galleryThumbs: "[data-js-gallery-thumbs]",
        galleryThumbItems: "[data-js-gallery-thumb-item]",
    }

    constructor(gallery) {
        this.mainImg = gallery.querySelector(this.selectors.mainImg);
        this.galleryThumbs = gallery.querySelector(this.selectors.galleryThumbs);
        this.galleryThumbItems = this.galleryThumbs.querySelectorAll(this.selectors.galleryThumbItems);

        this.initialize();
        this.bindEvents();
    }

    initialize() {
        const firstSrc = this.galleryThumbItems[0].querySelector("img").getAttribute("src");
        this.mainImg.setAttribute("src", firstSrc);
        this.galleryThumbItems[0].classList.add("is-active");
    }

    setCurrentImg(galleryThumbItem) {
        this.galleryThumbItems.forEach((item) => item.classList.remove("is-active"));
        galleryThumbItem.classList.add("is-active");
    }

    bindEvents() {
        this.galleryThumbs.addEventListener("click", event => {
            event.preventDefault();
            const { target } = event;

            const galleryThumbItem = target.closest(this.selectors.galleryThumbItems);

            if (galleryThumbItem) {
                const img = galleryThumbItem.querySelector("img");
                const src = img.getAttribute("src");

                if(src)
                    this.mainImg.src = src;

                this.setCurrentImg(galleryThumbItem);
            }
        })
    }
}

class Products {
    selectors = {
        productTitle: "[data-js-title]",
        productPrice: "[data-js-price]",
        productStock: "[data-js-stock]",
        productSpecification: "[data-js-specification]",
        productOthersSpecification: "[data-js-others-specification]",
        productManufacturer: "[data-js-manufacturer]",
        productManufacturerDetails: "[data-js-manufacturer-details]",
        productGallery: "[data-js-gallery]",
        productMainImg: "[data-js-gallery-main-img]",
        productThumbs: "[data-js-gallery-thumbs]",
        btnCart: "[data-js-btn-cart]",
        btnFavorite: "[data-js-btn-favorite]",
        btnDecrement: "[data-js-btn-quantity-decrement]",
        btnIncrement: "[data-js-btn-quantity-increment]",
        inputQuantity: "[data-js-input-quantity]",
        cartPopup: "[data-js-cart-popup]",
    }

    localStorageSelectors = {
        cart: "cart",
        favorite: "favorite",
    }

    sessionStorageSelectors = {
        server: "server",
    }

    constructor() {
        this.productTitle = document.querySelector(this.selectors.productTitle);
        this.productPrice = document.querySelector(this.selectors.productPrice);
        this.productStock = document.querySelector(this.selectors.productStock);
        this.productSpecification = document.querySelector(this.selectors.productSpecification);
        this.productOthersSpecification = document.querySelector(this.selectors.productOthersSpecification);
        this.productManufacturer = document.querySelector(this.selectors.productManufacturer);
        this.productManufacturerDetails = document.querySelector(this.selectors.productManufacturerDetails);
        this.productGallery = document.querySelector(this.selectors.productGallery);
        this.productMainImg = document.querySelector(this.selectors.productMainImg);
        this.productThumbs = document.querySelector(this.selectors.productThumbs);

        this.btnCart = document.querySelector(this.selectors.btnCart);
        this.btnFavorite = document.querySelector(this.selectors.btnFavorite);
        this.btnDecrement = document.querySelector(this.selectors.btnDecrement);
        this.btnIncrement = document.querySelector(this.selectors.btnIncrement);
        this.inputQuantity = document.querySelector(this.selectors.inputQuantity);

        this.cartPopup = document.querySelector(this.selectors.cartPopup);
        this.popupTimeout = null;

        this.initialize();
    }

    async initialize() {
        this.id = this.getIdFromURL();

        const hasActiveServer = sessionStorage.getItem(this.sessionStorageSelectors.server);

        if(hasActiveServer === "online")
            this.product = await this.getProductFromServer(this.id);
        else
            this.product = await this.getProductFromLocal(this.id);

        if(this.product) {
            this.setProductsParameters();
            this.bindEvents();
        }
        else
            window.location.href = "404.html";
    }

    async getProductFromServer(id) {
        try {
            const response = await fetch(`http://localhost:3000/products/${id}`);
            return await response.json();
        }
        catch(error) {
            window.location.href = "404.html";
        }
    }

    async getProductFromLocal(id) {
        try {
            const response = await fetch(`server.json5`);
            const json = await response.json();
            let products = json?.products;

            return products.find((product) => product.id.toString() === id.toString());
        }
        catch (error) {
            window.location.href = "404.html";
        }
    }

    getIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get("id");
    }

    setProductsParameters() {
        this.productTitle.textContent = this.product.name;
        this.productPrice.textContent = this.product.is_on_sale ? this.product.sale_price : this.product.price + " " + (this.product.currency || "MDL");
        this.productStock.classList.add(this.product.in_stock_qty > 0 ? "in-stock" : "out-of-stock");
        this.productManufacturer.textContent = this.product.manufacturer;
        this.productManufacturerDetails.textContent = this.product.manufacturer_details;

        this.setActions();
        this.setProductGallery();
        this.setSpecification(this.product.main_specifications, this.productSpecification);
        this.setSpecification(this.product.other_specifications, this.productOthersSpecification);
    }

    setActions() {
        const productsFavorite = JSON.parse(localStorage.getItem(this.localStorageSelectors.favorite)) || [];

        const isFavorite = productsFavorite.includes(this.id.toString());
        this.btnFavorite.classList.toggle("is-active", isFavorite);
    }

    setProductGallery() {
        this.productMainImg.setAttribute("src", this.product.images[0]);

        this.productThumbs.textContent = "";

        this.product.images.forEach(src => {
            const thumbItem = document.createElement("div");
            thumbItem.classList.add("gallery__thumb-item");
            thumbItem.setAttribute("data-js-gallery-thumb-item", "");

            thumbItem.innerHTML = `
                        <img class="gallery__img" src="${src}" alt="${this.product.name}">
                    `;

            this.productThumbs.appendChild(thumbItem);
        });

        new Gallery(this.productGallery);
    }

    setSpecification(specification, productSpecificationElement) {
        productSpecificationElement.textContent = "";

        Object.entries(specification).forEach(([ key, value ]) => {
            const specificationElement = document.createElement("div");
            specificationElement.classList.add("product-details__specification-row");

            specificationElement.innerHTML = `
                        <span class="paragraph-P3-medium product-details__specification-label">${key}</span>
                        <span class="paragraph-P3-medium product-details__specification-value">${value}</span>
                    `;

            productSpecificationElement.appendChild(specificationElement);
        })
    }

    showCartPopup() {
        if (!this.cartPopup) return;

        if (this.popupTimeout)
            clearTimeout(this.popupTimeout);

        this.cartPopup.classList.remove('is-active');

        void this.cartPopup.offsetWidth;

        this.cartPopup.classList.add('is-active');

        this.popupTimeout = setTimeout(() => {
            this.cartPopup.classList.remove('is-active');
            this.popupTimeout = null;
        }, 3000);
    }

    decrementIncrementQuantity(quantity) {
        let currentQuantity = parseInt(this.inputQuantity.value) || 1;
        currentQuantity = Math.max(1, currentQuantity + quantity);

        this.inputQuantity.value = currentQuantity;
    }

    bindEvents() {
        this.btnCart.addEventListener("click", () => {
            let productsCart = JSON.parse(localStorage.getItem(this.localStorageSelectors.cart)) || [];

            const quantityInput = parseInt(this.inputQuantity.value);

            const productCart = productsCart.find(product => product.id.toString() === this.id.toString());

            if(productCart) {
                productCart.quantity = quantityInput + parseInt(productCart.quantity);
            }
            else {
                productsCart.push({ id: this.id, quantity: quantityInput });
            }

            localStorage.setItem(this.localStorageSelectors.cart, JSON.stringify(productsCart));

            this.inputQuantity.value = 1;

            this.showCartPopup();
        })

        this.btnDecrement.addEventListener("click", () => {
            this.decrementIncrementQuantity(-1);
        })

        this.btnIncrement.addEventListener("click", () => {
            this.decrementIncrementQuantity(1);
        })

        this.inputQuantity.addEventListener("focusout", (event) => {
            event.preventDefault();

            const quantity = parseInt(this.inputQuantity.value);

            if(isNaN(quantity) || quantity < 1)
                this.inputQuantity.value = 1;
            else
                this.inputQuantity.value = quantity;
        })

        this.btnFavorite.addEventListener("click", () => {
            let productsFavorite = JSON.parse(localStorage.getItem(this.localStorageSelectors.favorite)) || [];

            let index = productsFavorite.indexOf(this.id.toString());

            if(index === -1) {
                productsFavorite.push(this.id.toString());
                this.btnFavorite.classList.add("is-active");
            }
            else {
                productsFavorite.splice(index, 1);
                this.btnFavorite.classList.remove("is-active");
            }

            localStorage.setItem(this.localStorageSelectors.favorite, JSON.stringify(productsFavorite));
        })
    }
}

window.addEventListener("app-ready", () => {
    new Products();
})
