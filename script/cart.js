class Cart {
    selectors = {
        cart: "[data-js-cart]",
        cartItems: "[data-js-carts]",
        summaryElement: "[data-js-summary-list]",
        totalElement: "[data-js-total]",
        btnDelete: "[data-js-btn-delete]",
        btnDecrement: "[data-js-btn-quantity-decrement]",
        btnIncrement: "[data-js-btn-quantity-increment]",
        inputQuantity: "[data-js-input-quantity]",
        reductionElement: "[data-js-reduction]",
        formPromo: "[data-js-form-promo]",
        inputPromo: "[data-js-input-promo]",
        errorMessage: "[data-js-error-message]",
        cartPopup: "[data-js-cart-popup]",
        popupMessage: "[data-js-popup-message]",
        btnGoToCheckOut: "[data-js-btn-go-to-check-out]",
    }

    localStorageSelectors = {
        cart: "cart",
        promo_code: "promo_code",
    }

    sessionStorageSelectors = {
        server: "server",
    }

    constructor() {
        this.cartElement = document.querySelector("[data-js-cart]");
        this.cartItemsElement = document.querySelector(this.selectors.cartItems);
        this.summaryListElement = document.querySelector(this.selectors.summaryElement);
        this.totalElement = document.querySelector(this.selectors.totalElement);
        this.reductionElement = document.querySelector(this.selectors.reductionElement);
        this.formPromo = document.querySelector(this.selectors.formPromo);
        this.inputPromo = document.querySelector(this.selectors.inputPromo);
        this.errorMessage = document.querySelector(this.selectors.errorMessage);
        this.cartPopup = document.querySelector(this.selectors.cartPopup);
        this.popupMessage = document.querySelector(this.selectors.popupMessage);
        this.btnGoToCheckOut = document.querySelector(this.selectors.btnGoToCheckOut);

        this.totals = 0;
        this.currentPercent = 0;
        this.usedPromoCode = false;

        this.products = [];

        this.initialize();
    }

    async initialize() {
        this.hasActiveServer = sessionStorage.getItem(this.sessionStorageSelectors.server);

        if(this.hasActiveServer === "online")
            this.products = await this.getProductsFromServer();
        else
            this.products = await this.getProductsFromLocal();

        if(this.products.length > 0)
            this.loadCarts();

        this.bindEvents();
    }

    async getProductsFromServer() {
        try {
            const response = await fetch(`http://localhost:3000/products`);
            const json = await response.json();

            return json.map(({ id, name, sku, oe_number, price, is_on_sale, discount_percentage, sale_price, category, images, manufacturer }) => {
                return { id, name, sku, oe_number, price, is_on_sale, discount_percentage, sale_price, category, images, manufacturer };
            });
        }
        catch(error) {
            window.location.href = "404.html";
        }
    }

    async getProductsFromLocal() {
        try {
            const response = await fetch(`server.json5`);
            const json = await response.json();
            let products = json?.products;

            return products.map(({ id, name, sku, oe_number, price, is_on_sale, discount_percentage, sale_price, category, images, manufacturer, compatibility, search_keywords }) => {
                return { id, name, sku, oe_number, price, is_on_sale, discount_percentage, sale_price, category, images, manufacturer, compatibility, search_keywords };
            });
        }
        catch (error) {
            window.location.href = "404.html";
        }
    }

    loadCarts() {
        this.cartItemsElement.textContent = "";

        const cartProducts = JSON.parse(localStorage.getItem(this.localStorageSelectors.cart)) || [];

        this.products = this.products.filter(product => {
            return cartProducts.some(cartProduct => product.id.toString() === cartProduct.id.toString());
        });

        this.products = this.products.map(product => {
            const cartProduct = cartProducts.find(cardProduct => product.id.toString() === cardProduct.id.toString());

            return {
                ...product,
                quantity: cartProduct ? cartProduct.quantity : 1,
            }
        });

        this.cartElement.classList.toggle("is-empty", this.products.length === 0);

        this.products.forEach(product => {
            const cartCard = document.createElement("a");
            cartCard.classList.add("cart-card");
            cartCard.setAttribute("href", "product-details.html?id=" + product.id);

            cartCard.innerHTML = `
                        <div class="cart-card__image-wrapper">
                            <img class="cart-card__img" src="${product.images[0]}" alt="${product.name}">
                        </div>

                        <div class="cart-card__body">
                            <div class="cart-card__content">
                                <h4 class="heading-H4 cart-card__title">${product.name}</h4>
                                <p class="paragraph-P4 cart-card__description">${product.manufacturer + " - " + product.sku}</p>
                                <h3 class="heading-H3 cart-card__price">${product.is_on_sale ? product.sale_price : product.price} ${product.currency || "MDL"}</h3>
                            </div>

                            <div class="cart-card__actions">
                                <button class="btn-icon-32 primary" aria-label="Trash" data-js-btn-delete>
                                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <use href="./assets/svg/icons.svg#icon-trash"></use>
                                    </svg>
                                </button>

                                <div class="cart-card__quantity">
                                    <button class="btn-icon-32" data-js-btn-quantity-decrement>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <use href="./assets/svg/icons.svg#icon-decrement"></use>
                                        </svg>
                                    </button>
                
                                    <div class="input-block input-block--number-32">
                                        <input class="input-block__field" type="number" id="quantity-${product.id}" min="1" max="9999" maxlength="4" value="${product.quantity}" data-js-input-quantity>
                                        <label class="input-block__label" for="quantity-${product.id}">quantity</label>
                                    </div>
                
                                    <button class="btn-icon-32" data-js-btn-quantity-increment>
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <use href="./assets/svg/icons.svg#icon-increment"></use>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    `;

            this.cartItemsElement.appendChild(cartCard);
        });

        this.loadTotals();
    }

    loadTotals() {
        this.summaryListElement.textContent = "";
        this.totals = 0;
        this.currency = this.products[0]?.currency || "MDL";

        this.products.forEach(product => {
            const cartSummary = document.createElement("div");
            cartSummary.classList.add("cart__row");

            const price = product.is_on_sale ? product.sale_price : product.price;

            cartSummary.innerHTML = `
                        <span class="paragraph-P3-medium cart__summary-label">${product.name}</span>
                        <span class="paragraph-P3-medium cart__summary-quantity">${product.quantity}</span>
                        <span class="paragraph-P3-medium cart__summary-price">${price * product.quantity} ${product.currency || "MDL"}</span>
                    `;

            this.totals += price * product.quantity;

            this.summaryListElement.appendChild(cartSummary);
        })

        this.updateReduction();
    }

    deleteCart(parentElement, href) {
        if (!parentElement || !href) return;

        let products = JSON.parse(localStorage.getItem(this.localStorageSelectors.cart)) || [];

        const url = new URL(href, window.location.origin);
        const id = url.searchParams.get("id");

        if (!id) return;

        products = products.filter(product => product.id.toString() !== id);
        this.products = this.products.filter(product => product.id.toString() !== id);

        localStorage.setItem(this.localStorageSelectors.cart, JSON.stringify(products));
        this.loadTotals();
        parentElement.remove();

        this.cartElement.classList.toggle("is-empty", this.products.length === 0);
    }

    updateCart(parentElement, href, quantity) {
        if (!parentElement || !href || !quantity) return;

        let products = JSON.parse(localStorage.getItem(this.localStorageSelectors.cart)) || [];

        const url = new URL(href, window.location.origin);
        const id = url.searchParams.get("id");

        if (!id) return;

        products = products.map(product => product.id.toString() === id ? { ...product, quantity: quantity } : product);
        this.products = this.products.map(product => product.id.toString() === id ? { ...product, quantity: quantity } : product);

        localStorage.setItem(this.localStorageSelectors.cart, JSON.stringify(products));
        this.loadTotals();
    }

    decrementIncrementQuantity(quantity, cardElement) {
        const inputQuantity = cardElement.querySelector(this.selectors.inputQuantity);
        const href = cardElement.getAttribute("href");

        if(!inputQuantity) return;

        let currentQuantity = parseInt(inputQuantity.value) || 1;
        currentQuantity = Math.max(1, currentQuantity + quantity);

        inputQuantity.value = currentQuantity;

        this.updateCart(cardElement, href, currentQuantity);
    }

    async getReductionFormServer(promoCode) {
        try {
            const response = await fetch(`http://localhost:3000/promo_codes?code=${promoCode}`);
            const json = await response.json();

            return json[0]?.value;
        }
        catch (error) {
            window.location.href = "404.html";
        }
    }

    async getReductionFormLocal(promoCode) {
        try {
            const response = await fetch(`server.json5`);
            const json = await response.json();
            let promoCodes = json?.promo_codes;

            return promoCodes.find(promo => promo.code === promoCode)?.value;
        }
        catch (error) {
            window.location.href = "404.html";
        }
    }

    async usePromoCode(promoCode) {
        if(this.usedPromoCode) return;

        let reduction = 0;

        if(this.hasActiveServer === "online")
            reduction = await this.getReductionFormServer(promoCode);
        else
            reduction = await this.getReductionFormLocal(promoCode);

        if(!reduction) {
            this.inputPromo.setAttribute("aria-invalid", "true");
            this.errorMessage.textContent = "Promo code could not be found";
        }
        else {
            this.inputPromo.setAttribute("aria-invalid", "false");
            this.errorMessage.textContent = "";
            this.usedPromoCode = true;
            this.currentPercent = reduction;

            localStorage.setItem(this.localStorageSelectors.promo_code, promoCode);

            this.updateReduction();

            this.popupMessage.textContent = "Promo Code Used";
            this.showCartPopup();
        }
    }

    async updateReduction() {
        if(this.currentPercent === 0 && !this.usedPromoCode) {
            const promoCode = localStorage.getItem(this.localStorageSelectors.promo_code);
            this.usedPromoCode = !!promoCode;

            if (!promoCode) {
                this.totalElement.textContent = this.totals + " " + this.currency;
                return;
            }

            if(this.hasActiveServer === "online")
                this.currentPercent = await this.getReductionFormServer(promoCode);
            else
                this.currentPercent = await this.getReductionFormLocal(promoCode);

            if (!this.currentPercent) this.currentPercent = 0;
        }

        const reduction = this.totals * (this.currentPercent / 100);

        this.reductionElement.textContent = reduction + " " + this.currency;
        this.totalElement.textContent = (this.totals - reduction) + " " + this.currency;
    }

    showCartPopup() {
        if (!this.cartPopup) return;

        if (this.popupTimeout)
            clearTimeout(this.popupTimeout);

        this.cartPopup.classList.remove('is-active');

        this.cartPopup.offsetWidth;

        this.cartPopup.classList.add('is-active');

        this.popupTimeout = setTimeout(() => {
            this.cartPopup.classList.remove('is-active');
            this.popupTimeout = null;
        }, 3000);
    }

    cleanCart() {
        localStorage.removeItem(this.localStorageSelectors.cart);
        localStorage.removeItem(this.localStorageSelectors.promo_code);

        this.products = [];

        this.totalElement.textContent = "0" + " " + this.currency;
        this.reductionElement.textContent = "0" + " " + this.currency;
        this.summaryListElement.textContent = "";

        this.totals = 0;
        this.currentPercent = 0;
        this.usedPromoCode = false;

        this.loadCarts();
    }

    bindEvents() {
        this.cartItemsElement.addEventListener("click", event => {
            const { target } = event;

            const cardElement = target.closest(".cart-card");
            const btnDelete = target.closest(this.selectors.btnDelete);
            const btnDecrement = target.closest(this.selectors.btnDecrement);
            const btnIncrement = target.closest(this.selectors.btnIncrement);
            const inputQuantity = target.closest(this.selectors.inputQuantity);
            const href = cardElement.getAttribute("href");

            if(btnDelete || inputQuantity || btnDecrement || btnIncrement) {
                event.preventDefault();
                event.stopPropagation();
            }

            if(btnDecrement) {
                this.decrementIncrementQuantity(-1, cardElement);
            }
            else if(btnIncrement) {
                this.decrementIncrementQuantity(1, cardElement);
            }
            else if (btnDelete) {
                this.deleteCart(cardElement, href);
            }
        })

        this.cartItemsElement.addEventListener("focusout", event => {
            const { target } = event;

            const cardElement = target.closest(".cart-card");
            const inputQuantity = target.closest(this.selectors.inputQuantity);
            const href = cardElement.getAttribute("href");

            if (inputQuantity) {
                event.preventDefault();
                event.stopPropagation();

                const quantity = parseInt(inputQuantity.value);

                if(isNaN(quantity) || quantity < 1)
                    inputQuantity.value = 1;
                else
                    inputQuantity.value = quantity;

                this.updateCart(cardElement, href, quantity);
            }
        })

        this.formPromo.addEventListener("submit", event => {
            event.preventDefault();

            const promoCode = this.inputPromo.value.trim().toUpperCase();

            if(promoCode) {
                this.formPromo.reset();
                this.usePromoCode(promoCode);
            }
        })

        this.btnGoToCheckOut.addEventListener("click", event => {
            event.preventDefault();

            const hasProductsInCart = localStorage.getItem(this.localStorageSelectors.cart);

            if(hasProductsInCart) {
                this.popupMessage.textContent = "Payment Successful";

                this.showCartPopup();
                this.cleanCart();
            }
        })
    }
}

window.addEventListener("app-ready", () => {
    new Cart();
})