class SlideMenu {
    constructor(slideMenu, btn, btnClose) {
        this.slideMenu = slideMenu;
        this.btn = btn;
        this.btnClose = btnClose;

        this.isOpen = false;

        this.handleScroll = () => this.closeMenu();
        this.handleClickOutside = (event) => this.checkClickOutside(event);

        this.initialize();
        this.bindEvents();
    }

    initialize() {
        this.btn.classList.remove('is-active');
        this.slideMenu.classList.remove('is-open');
    }

    updateDOM() {
        this.btn.classList.toggle('is-active', this.isOpen);
        this.slideMenu.classList.toggle('is-open', this.isOpen);
    }

    toggleMenu() {
        this.isOpen = !this.isOpen;
        this.updateDOM();

        if (this.isOpen) {
            window.addEventListener('scroll', this.handleScroll);
            document.addEventListener('click', this.handleClickOutside);
        } else {
            this.removeGlobalEvents();
        }
    }

    closeMenu() {
        this.isOpen = false;
        this.updateDOM();
        this.removeGlobalEvents();
    }

    removeGlobalEvents() {
        window.removeEventListener('scroll', this.handleScroll);
        document.removeEventListener('click', this.handleClickOutside);
    }

    checkClickOutside(event) {
        const clickedOutsideMenu = !this.slideMenu.contains(event.target);
        const clickedOutsideBtn = !this.btn.contains(event.target);

        if(clickedOutsideMenu && clickedOutsideBtn)
            this.closeMenu();
    }

    bindEvents() {
        this.btn.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();

            this.toggleMenu();
        });

        if(!this.btnClose) return;
        this.btnClose.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();

            this.closeMenu();
        })
    }
}

class Accordion {
    selectors = {
        accordion: "[data-js-accordion]",
    }

    constructor(accordionContainer) {
        this.accordionContainer = accordionContainer;
        this.accordions = accordionContainer.querySelectorAll(this.selectors.accordion);

        this.initialize();
        this.bindEvents();
    }

    initialize() {
        this.closeAllAccordions();
    }

    openAccordion(accordion) {
        const isAlreadyOpened = accordion.classList.contains("is-open");
        console.log(isAlreadyOpened);

        this.closeAllAccordions();

        if(!isAlreadyOpened)
            accordion.classList.add("is-open");
    }

    closeAllAccordions() {
        if(this.accordions.length === 0)
            this.selectAllAccordions();

        this.accordions.forEach(accordion => accordion.classList.remove("is-open"));
    }

    selectAllAccordions() {
        this.accordions = this.accordionContainer.querySelectorAll(this.selectors.accordion);
    }

    bindEvents() {
        this.accordionContainer.addEventListener("click", event => {
            const { target } = event;

            const btnAccordion = target.closest("[data-js-btn-accordion]");
            if (!btnAccordion) return;

            const accordion = btnAccordion.closest(this.selectors.accordion);

            if (accordion) {
                this.openAccordion(accordion);
            }
        });
    }
}

class Validate {
    selectors = {
        input: "[data-js-input]",
        error: "[data-js-error-message]",
    }

    regex = {
        text: /^[a-zA-Z]{2,}$/,
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        password: /^(?=.*[A-Za-z])(?=.*\d)\S{8,}$/,
        tel: /^\+?[0-9\s\-()]{7,15}$/,
    }

    errorMessage = {
        tooShort: () => 'Text is too short',
        tooLong: () => 'Text is too long',
        valueMissing: () => 'Required field',
        patternMismatch: (input) => input.title || 'Invalid format',
        typeMismatch: (input) => `Invalid ${input.type} format`,
    }

    constructor(formElement) {
        if (!formElement) return;

        this.formElement = formElement;
        this.btnsubmit = this.formElement.querySelector('button[type="submit"]');

        this.bindEvents();
    }

    validateField(input) {
        const parentElement = input.closest(this.selectors.input);
        const errorElement = parentElement.querySelector(this.selectors.error);

        const error = input.validity;
        const pattern = this.regex[input.type];

        const errorMessage = [];

        Object.entries(this.errorMessage).forEach(([key, value]) => {
            if(error[key])
                errorMessage.push(value(input));
        });

        if (input.value.trim() !== "" && pattern && !pattern.test(input.value)) {
            errorMessage.push(this.errorMessage.patternMismatch(input));
        }

        if(errorMessage.length > 0) {
            errorElement.textContent = errorMessage.join(' ');
            input.setAttribute('aria-invalid', 'true');
            return false;
        }
        else {
            errorElement.textContent = "";
            input.setAttribute('aria-invalid', 'false');
            return true;
        }
    }

    validateForm() {
        const inputElements = this.formElement.querySelectorAll('input, textarea');
        let isFormValid = true;

        inputElements.forEach((inputElement) => {
            const isFieldValid = this.validateField(inputElement);

            if(!isFieldValid)
                isFormValid = false;
        });

        this.formElement.reset();
        return isFormValid;
    }

    bindEvents() {
        this.formElement.addEventListener('focusout', event => {
            const { target } = event;
            if((target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') && target.closest(this.selectors.input)) {
                this.validateField(target);
            }
        });

        this.formElement.addEventListener('submit', event => {
            if (!this.validateForm()) {
                event.preventDefault();
                event.stopPropagation();
            }
        });
    }
}

class MenuBadgeManager {
    selectors = {
        headerCart: "[data-js-btn-header-cart]",
        headerFavorite: "[data-js-btn-header-favorite]",
        slideMenuCart: "[data-js-btn-slide-menu-cart]",
        slideMenuFavorite: "[data-js-btn-slide-menu-favorite]",
    }

    localStorageSelectors = {
        cart: "cart",
        favorite: "favorite",
    }

    constructor() {
        this.btnHeaderCart = document.querySelector(this.selectors.headerCart);
        this.btnHeaderFavorite = document.querySelector(this.selectors.headerFavorite);
        this.btnSlideMenuCart = document.querySelector(this.selectors.slideMenuCart);
        this.btnSlideMenuFavorite = document.querySelector(this.selectors.slideMenuFavorite);

        this.initialize();
        this.bindEvents();
    }

    initialize() {
        this.updateBadge(this.localStorageSelectors.cart, this.btnHeaderCart);
        this.updateBadge(this.localStorageSelectors.cart, this.btnSlideMenuCart);
        this.updateBadge(this.localStorageSelectors.favorite, this.btnHeaderFavorite);
        this.updateBadge(this.localStorageSelectors.favorite, this.btnSlideMenuFavorite);
    }

    updateBadge(localStorageName, btn) {
        if (!localStorageName || !btn) return;
        const btnPopIcon = btn.querySelector("[data-js-btn-pop-icon]");

        if(!btnPopIcon) return;

        const products = JSON.parse(localStorage.getItem(localStorageName)) || [];

        const length = products.length;

        if(length === 0) {
            btnPopIcon.classList.add("is-empty");
            btnPopIcon.textContent = 0;
        }
        else {
            btnPopIcon.classList.remove("is-empty");
            btnPopIcon.textContent = length;
        }
    }

    bindEvents() {
        window.addEventListener("cartOrFavoriteUpdated", () => {
            this.initialize();
        });

        window.addEventListener("storage", event => {
            if (this.localStorageSelectors.cart === event.key) {
                this.updateBadge(this.localStorageSelectors.cart, this.btnHeaderCart);
                this.updateBadge(this.localStorageSelectors.cart, this.btnSlideMenuCart);
            }
            else if (this.localStorageSelectors.favorite === event.key) {
                this.updateBadge(this.localStorageSelectors.favorite, this.btnHeaderFavorite);
                this.updateBadge(this.localStorageSelectors.favorite, this.btnSlideMenuFavorite);
            }
        });
    }
}

class SearchBar {
    selectors = {
        input: "[data-js-input-search]",
    }

    constructor(formSearch) {
        this.formSearch = formSearch;
        this.inputSearch = formSearch.querySelector(this.selectors.input);

        this.bindEvents();
    }

    setSearchFormURL(searchValue) {
        const urlParams = new URLSearchParams();

        urlParams.set("view", "search");
        urlParams.set("search", searchValue);
        window.location.href = `products.html?${urlParams.toString()}`;
    }

    bindEvents() {
        if(!this.formSearch || !this.inputSearch) return;

        this.formSearch.addEventListener("submit", event => {
            event.preventDefault();

            const searchValue = this.inputSearch.value.trim().toLowerCase();

            if (searchValue === "") return;

            this.setSearchFormURL(searchValue);
        })
    }
}

class CheckServer {
    sessionStorageSelectors = {
        server: "server",
    }

    async testServer() {
        try {
            const checkSessionStorage = sessionStorage.getItem(this.sessionStorageSelectors.server);

            if(checkSessionStorage === "online" || checkSessionStorage === "offline") {
                return checkSessionStorage === "online";
            }

            const response = await fetch("http://localhost:3000/", { method: "HEAD" });
            const isOnline = response.ok;

            sessionStorage.setItem(this.sessionStorageSelectors.server, isOnline ? "online" : "offline");
            return isOnline;
        }
        catch (error) {
            sessionStorage.setItem(this.sessionStorageSelectors.server, "offline");
            return false;
        }
    }
}

class SendEmail {
    selectors = {
        formEmail: "[data-js-form-email]",
        inputEmail: "[data-js-input-email]",
    }

    constructor() {
        this.formEmail = document.querySelector(this.selectors.formEmail);
        this.inputEmail = this.formEmail.querySelector(this.selectors.inputEmail);

        this.companyEmail = "hello@enginecore.md";

        this.bindEvents();
    }

    setEmail(email) {
        const defaultSubject = "Website Inquiry"
        const defaultBody = `Dear Support Team,\n\n` +
            `I hope this email finds you well.\n\n` +
            `I am contacting you regarding the products listed on your website. Please find my questions below:\n\n` +
            `You can reply directly to this email or reach me at: ${email}.\n\n` +
            `Thank you.`;

        const url = `mailto:${this.companyEmail}?subject=${encodeURIComponent(defaultSubject)}&body=${encodeURIComponent(defaultBody)}`;
        window.open(url, "_blank");
    }

    bindEvents() {
        this.formEmail.addEventListener("submit", event => {
            event.preventDefault();

            const clearEmail = this.inputEmail.value.trim();
            this.setEmail(clearEmail);
        })
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await new CheckServer().testServer();
    window.dispatchEvent(new CustomEvent('app-ready'));

    const btnHamburger = document.querySelector('[data-js-btn-hamburger]');
    const slideMenu = document.querySelector('[data-js-slide-menu]');

    if(btnHamburger && slideMenu)
        new SlideMenu(slideMenu, btnHamburger);

    const btnFilter = document.querySelector('[data-js-btn-filter]');
    const btnClose = document.querySelector('[data-js-btn-filter-close]');
    const filterMenu = document.querySelector('[data-js-products-filter]');

    if(btnFilter && btnClose && filterMenu)
        new SlideMenu(filterMenu, btnFilter, btnClose);

    const accordionContainers = document.querySelectorAll('[data-js-accordion-container]');
    accordionContainers.forEach(accordionContainer => new Accordion(accordionContainer));

    const formElements = document.querySelectorAll('[data-js-form]');
    formElements.forEach(formElement => new Validate(formElement));

    new MenuBadgeManager();

    const headerFormElement = document.querySelector('[data-js-header-search]');
    new SearchBar(headerFormElement);

    const slideMenuFormElement = document.querySelector('[data-js-slide-menu-search]');
    new SearchBar(slideMenuFormElement);

    new SendEmail();
});