class ProductButtonHandler {
    selectors = {
        productCard: "[data-js-product-card]",
        btnCart: "[data-js-btn-cart]",
        btnFavorite: "[data-js-btn-favorite]",
        cartPopup: "[data-js-cart-popup]",
    }

    localStorageSelectors = {
        cart: "cart",
        favorite: "favorite",
    }

    constructor(productsContainer) {
        this.productsContainer = productsContainer;
        this.cartPopup = document.querySelector(this.selectors.cartPopup);

        this.popupTimeout = null;

        this.bindEvents();
    }

    setLocalStorage(localStorageName, href, btn, quantity) {
        if (!localStorageName || !href || !btn) return;

        const products = JSON.parse(localStorage.getItem(localStorageName)) || [];

        const url = new URL(href, window.location.origin);
        const id = url.searchParams.get("id");

        if (!id) return;

        const index = products.findIndex(product => {
            return typeof product === "object" ? product.id === id : product === id;
        });

        if(quantity > 0) {
            if(index === -1) {
                products.push({ id: id, quantity: quantity });
            }
            else {
                products[index].quantity = quantity + parseInt(products[index].quantity);
            }
        }
        else {
            if(index === -1) {
                products.push(id);
                btn.classList.add("is-active");
            }
            else {
                products.splice(index, 1);
                btn.classList.remove("is-active");
            }
        }

        localStorage.setItem(localStorageName, JSON.stringify(products));
        window.dispatchEvent(new CustomEvent("cartOrFavoriteUpdated"));
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

    bindEvents() {
        this.productsContainer.addEventListener("click", event => {
            const { target } = event;

            const cartBtn = target.closest(this.selectors.btnCart);
            const favoriteBtn = target.closest(this.selectors.btnFavorite);
            const href = target.closest(this.selectors.productCard)?.getAttribute("href");

            if(cartBtn) {
                event.preventDefault();
                event.stopPropagation();

                this.setLocalStorage(this.localStorageSelectors.cart, href, cartBtn, 1);
                this.showCartPopup();
            }

            if(favoriteBtn) {
                event.preventDefault();
                event.stopPropagation();

                this.setLocalStorage(this.localStorageSelectors.favorite, href, favoriteBtn, null);
            }
        })
    }
}

window.addEventListener("app-ready", function() {
    const productsGrids = document.querySelectorAll("[data-js-products-grid]");

    productsGrids.forEach(productsGrid => new ProductButtonHandler(productsGrid));
});