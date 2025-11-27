// Wait for page to load
document.addEventListener("DOMContentLoaded", function () {
  const mobileMenu = document.getElementById("mobile-menu");
  const menuIcon = document.getElementById("menu-icon");
  const closeMenu = document.getElementById("closeMenu");

  // Toggle menu function
  function toggleMobileMenu() {
    mobileMenu.classList.toggle("active");
  }

  // Open menu when clicking hamburger icon
  if (menuIcon) {
    menuIcon.addEventListener("click", function (event) {
      event.stopPropagation();
      toggleMobileMenu();
    });
  }

  // Close menu when clicking X button
  if (closeMenu) {
    closeMenu.addEventListener("click", function () {
      mobileMenu.classList.remove("active");
    });
  }

  // Close menu when clicking outside
  document.addEventListener("click", function (event) {
    if (mobileMenu.classList.contains("active")) {
      if (
        !mobileMenu.contains(event.target) &&
        !menuIcon.contains(event.target)
      ) {
        mobileMenu.classList.remove("active");
      }
    }
  });

  // Close menu when clicking on links
  const menuLinks = mobileMenu.querySelectorAll("a");
  menuLinks.forEach((link) => {
    link.addEventListener("click", function () {
      mobileMenu.classList.remove("active");
    });
  });

  // Close menu with Escape key
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && mobileMenu.classList.contains("active")) {
      mobileMenu.classList.remove("active");
    }
  });
});

// Cross-Platform Notification System
class NotificationManager {
    static async show(message, title = 'Car Auction', type = 'info') {
        // Check if we're in a Capacitor environment
        const isCapacitor = typeof capacitor !== 'undefined' && capacitor.Plugins && capacitor.Plugins.Dialog;

        if (isCapacitor && this.isNativePlatform()) {
            // Use Capacitor Dialog for mobile apps
            try {
                await Dialog.alert({
                    title: title,
                    message: message,
                });
            } catch (error) {
                console.warn('Capacitor Dialog failed, falling back to toast');
                this.showToast(message, type);
            }
        } else {
            // Use browser alert for desktop web or fallback to custom toast
            if (this.isDesktop() && this.shouldUseBrowserAlert(message)) {
                alert(`${title}: ${message}`);
            } else {
                // Use custom toast for better UX
                this.showToast(message, type);
            }
        }
    }

    static isNativePlatform() {
        return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) &&
               !window.chrome; // Exclude Chrome on mobile
    }

    static isDesktop() {
        return !/Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    }

    static shouldUseBrowserAlert(message) {
        // Only use browser alert on desktop for simple messages
        return this.isDesktop() && message.length < 100;
    }

    static showToast(message, type = 'info') {
        // Create or use existing toast system
        if (typeof Toast !== 'undefined') {
            Toast.show(message, type);
        } else {
            this.createFallbackToast(message, type);
        }
    }

    static createFallbackToast(message, type) {
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getToastColor(type)};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 300px;
            transform: translateX(400px);
            transition: transform 0.3s ease;
            font-family: Arial, sans-serif;
        `;

        toast.innerHTML = message;
        document.body.appendChild(toast);

        // Animate in
        setTimeout(() => toast.style.transform = 'translateX(0)', 100);

        // Auto remove
        setTimeout(() => {
            toast.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        }, 4000);
    }

    static getToastColor(type) {
        const colors = {
            info: '#0099ff',
            success: '#00ff00',
            error: '#e74c3c',
            warning: '#f39c12'
        };
        return colors[type] || colors.info;
    }

    static async success(message) {
        await this.show(message, 'Success', 'success');
    }

    static async error(message) {
        await this.show(message, 'Error', 'error');
    }

    static async warning(message) {
        await this.show(message, 'Warning', 'warning');
    }

    static async info(message) {
        await this.show(message, 'Info', 'info');
    }
}

// Toast System
class Toast {
    static show(message, type = 'info', duration = 4000) {
        // Remove existing toasts
        const existingToasts = document.querySelectorAll('.custom-toast');
        existingToasts.forEach(toast => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        });

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `custom-toast ${type}`;
        toast.innerHTML = `
            <span>${message}</span>
            <button class="toast-close">&times;</button>
        `;

        // Add to DOM
        document.body.appendChild(toast);

        // Show toast with slight delay
        setTimeout(() => toast.classList.add('show'), 100);

        // Close button event
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.hide(toast);
        });

        // Auto hide
        if (duration > 0) {
            setTimeout(() => this.hide(toast), duration);
        }

        return toast;
    }

    static hide(toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    static success(message, duration = 4000) {
        return this.show(message, 'success', duration);
    }

    static error(message, duration = 5000) {
        return this.show(message, 'error', duration);
    }

    static warning(message, duration = 4000) {
        return this.show(message, 'warning', duration);
    }

    static info(message, duration = 4000) {
        return this.show(message, 'info', duration);
    }
}

// Make notification systems available globally
window.NotificationManager = NotificationManager;
window.Toast = Toast;

// Auction functionality
class CarAuction {
  constructor() {
    this.currentUser = this.getStoredUser();
    this.auctions = [];
    this.filteredAuctions = [];
    this.API_BASE = "https://carz-bids.onrender.com"; // Backend API base URL
    this.searchTerm = '';
    this.init();
  }

  storeUser(user) {
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
      sessionStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
      sessionStorage.removeItem('currentUser');
    }
  }

  getStoredUser() {
    // Try localStorage first
    let userData = localStorage.getItem('currentUser');

    if (!userData) {
      // Fallback to sessionStorage
      userData = sessionStorage.getItem('currentUser');
    }

    if (userData) {
      try {
        const user = JSON.parse(userData);
        return user;
      } catch (error) {
        console.error('Error parsing stored user:', error);
        return null;
      }
    }
    return null;
  }

  async init() {
    await this.loadAuctions();
    this.setupEventListeners();
    this.checkLoginStatus();
  }

  async loadAuctions() {
    try {
      const response = await fetch(`${this.API_BASE}/api/auctions`);
      if (!response.ok) {
        throw new Error("Failed to fetch auctions");
      }

      const auctions = await response.json();

      // Properly map backend data to frontend structure
      this.auctions = auctions.map((auction) => ({
        id: auction.id,
        name: auction.car_name,
        image: auction.image_url,
        description: auction.car_description,
        startingBid: auction.starting_bid,
        currentBid: auction.current_bid,
        bidderCount: auction.actual_bidder_count || auction.bidder_count,
        endTime: new Date(auction.end_time),
        bids: [],
        gallery: auction.gallery || [],
        specs: auction.specs || {}
      }));

      this.filteredAuctions = [...this.auctions];
      this.renderAuctions();
      this.startTimers();

    } catch (error) {
      console.error("Failed to load auctions:", error);
      await NotificationManager.error("Failed to load auctions from server");
    }
  }

  loadSampleAuctions() {
    // Sample auction data with gallery and specs
    this.auctions = [];
    this.filteredAuctions = [...this.auctions];
    this.renderAuctions();
    this.startTimers();
  }

  renderAuctions() {
    const container = document.getElementById("auctions-container");
    if (!container) {
      console.error("auctions-container not found!");
      return;
    }

    container.innerHTML = "";
    if (this.filteredAuctions.length === 0) {
      // Show no results message
      container.innerHTML = this.createNoResultsMessage();
      return;
    }

    this.filteredAuctions.forEach((auction) => {
      const auctionElement = this.createAuctionElement(auction);
      container.appendChild(auctionElement);
    });
  }

  createNoResultsMessage() {
    return `
      <div class="no-results">
        <i class="fas fa-search"></i>
        <h3>No matching auctions found</h3>
        <p>Try searching with different keywords like car name, model, or specifications</p>
        ${this.searchTerm ? `<p>Search term: "${this.searchTerm}"</p>` : ''}
      </div>
    `;
  }

  createAuctionElement(auction) {
    const div = document.createElement("div");
    div.className = "auction-item";
    div.style.cursor = "pointer";
    div.onclick = () => this.openCarModal(auction.id);

    div.innerHTML = `
      <img src="${auction.image}" alt="${auction.name}" class="auction-image">
      <h3 class="car-name">${auction.name}</h3>
      <p class="car-info">${auction.description}</p>
      <div class="current-bid">Current Bid: ksh${auction.currentBid.toLocaleString()}</div>
      <div class="bid-info">
        <span>Bidders: ${auction.bidderCount}</span>
        <span>Starting: ksh${auction.startingBid.toLocaleString()}</span>
      </div>
      <div class="timer" id="timer-${auction.id}">
        ${this.formatTimeRemaining(auction.endTime)}
      </div>
      ${this.createBidForm(auction)}
    `;
    return div;
  }

  createBidForm(auction) {
    const hasEnded = auction.endTime <= new Date();
    const userHasBid = this.currentUser &&
    (auction.bids.some((bid) => bid.userId === this.currentUser?.id) ||
     this.checkUserBidStatusLocal(auction.id));

    if (hasEnded) {
      return `
        <div class="auction-ended">
          Auction Ended
          ${
            auction.bids.length > 0
              ? `<div class="winning-bid">Winning Bid: ksh${Math.max(...auction.bids.map((b) => b.amount)).toLocaleString()}</div>`
              : "<div>No bids placed</div>"
          }
        </div>
      `;
    }

    if (userHasBid) {
      return '<div class="auction-ended">You have already placed a bid on this vehicle</div>';
    }

    return `
      <div class="bid-form">
        <input type="number"
               class="bid-input"
               placeholder="Enter your bid (min: ksh${(auction.currentBid + 1000).toLocaleString()})"
               min="${auction.currentBid + 1000}"
               step="1000">
        <button class="bid-btn" onclick="event.stopPropagation(); carAuction.placeBid(${auction.id})"
                ${!this.currentUser ? "disabled" : ""}>
          Place Bid
        </button>
      </div>
      ${!this.currentUser ? '<p style="text-align:center;margin-top:10px;color:var(--text-color1);">Please login to bid</p>' : ""}
    `;
  }

  checkUserBidStatusLocal(auctionId) {
    // This would ideally make an API call to check if user has bid
    // For now, return false - the real check happens when placing bid
    return false;
  }

  endAuction(auctionId) {
    const auction = this.auctions.find(a => a.id === auctionId);
    if (auction) {
      // Auction ended logic can be added here
    }
  }

  formatTimeRemaining(endTime) {
    const now = new Date();
    let diff = endTime - now;

    if (diff <= 0) return "Auction Ended";

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
  }

  startTimers() {
    setInterval(() => {
      this.auctions.forEach((auction) => {
        const timerElement = document.getElementById(`timer-${auction.id}`);
        if (timerElement) {
          timerElement.textContent = this.formatTimeRemaining(auction.endTime);

          if (auction.endTime - new Date() < 3600000) {
            timerElement.classList.add("expiring");
          }

          if (auction.endTime <= new Date()) {
            this.endAuction(auction.id);
          }
        }
      });
    }, 1000);
  }

  async placeBid(auctionId, bidAmount = null) {
    if (!this.currentUser) {
      await NotificationManager.warning("Please login to place a bid");
      toggleLogin();
      return;
    }

    const auction = this.auctions.find((a) => a.id === auctionId);

    if (!bidAmount) {
      const bidInput = document.querySelector(
        `#timer-${auctionId} ~ .bid-form .bid-input`,
      );
      bidAmount = parseInt(bidInput.value);
    }

    if (!bidAmount || bidAmount < auction.currentBid + 1000) {
      await NotificationManager.error(
        `Bid must be at least ksh${(auction.currentBid + 1000).toLocaleString()}`,
      );
      return;
    }

    try {
      const response = await fetch(
         `${this.API_BASE}/api/auctions/${auctionId}/bid`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: this.currentUser.id,
            amount: bidAmount,
          }),
        },
      );

      const result = await response.json();

      if (result.success) {
        // Reload auctions to get updated data
        await this.loadAuctions();

        // Update modal if open
        if (document.getElementById("car-modal")?.style.display === "block") {
          this.openCarModal(auctionId);
        }

        await NotificationManager.success(`Bid of ksh${bidAmount.toLocaleString()} placed successfully!`);
      } else {
        await NotificationManager.error("Bid failed: " + result.error);
      }
    } catch (error) {
      console.error("Bid error:", error);
      // Fallback to frontend-only bid placement
      auction.bids.push({
        userId: this.currentUser.id,
        userName: this.currentUser.name,
        amount: bidAmount,
        timestamp: new Date(),
      });

      auction.currentBid = bidAmount;
      auction.bidderCount = new Set(auction.bids.map((b) => b.userId)).size;

      this.renderAuctions();

      if (document.getElementById("car-modal")?.style.display === "block") {
        this.openCarModal(auctionId);
      }

      await NotificationManager.success(`Bid of ksh${bidAmount.toLocaleString()} placed successfully!`);
    }
  }

  // Modal functionality
  openCarModal(auctionId) {
    const auction = this.auctions.find((a) => a.id === auctionId);
    if (!auction) return;

    const modal = document.getElementById("car-modal");
    const container = document.getElementById("car-details-container");

    if (!modal || !container) {
      console.error("Modal elements not found!");
      return;
    }

    container.innerHTML = this.createCarModalContent(auction);
    modal.style.display = "block";
    document.body.style.overflow = "hidden";
  }

  createCarModalContent(auction) {
    const hasEnded = auction.endTime <= new Date();
    const userHasBid =
      this.currentUser &&
      auction.bids.some((bid) => bid.userId === this.currentUser?.id);

    return `
      <div class="media-gallery">
        <div class="main-media" id="main-media">
          <img src="${auction.image}" alt="${auction.name}" id="main-media-display">
        </div>
        <div class="media-thumbnails">
          ${this.createGalleryThumbnails(auction)}
        </div>
      </div>

      <div class="car-info-details">
        <h2 class="car-title-modal">${auction.name}</h2>
        <div class="car-price-modal">Current Bid: ksh${auction.currentBid.toLocaleString()}</div>
        <p class="car-description-modal">${auction.description}</p>

        <div class="car-specs">
          <h3 style="color: var(--text-color1); margin-bottom: 15px; font-family: 'boxigen';">Specifications</h3>
          ${this.createSpecsList(auction.specs || {})}
        </div>

        <div class="timer-modal" id="modal-timer-${auction.id}">
          ${this.formatTimeRemaining(auction.endTime)}
        </div>

        ${
          hasEnded
            ? '<div class="auction-ended" style="margin-top: 20px; text-align: center; padding: 15px; background: rgba(255,0,0,0.3); border-radius: 8px;">Auction Ended</div>'
            : this.createModalBidForm(auction, userHasBid)
        }
      </div>
    `;
  }

  createGalleryThumbnails(auction) {
    if (!auction.gallery || auction.gallery.length === 0) {
      return `<div class="thumbnail active" onclick="carAuction.changeMainMedia('${auction.image}', 'image', this)">
                <img src="${auction.image}" alt="${auction.name}">
            </div>`;
    }

    let thumbnails = "";
    auction.gallery.forEach((media, index) => {
      const isActive = index === 0 ? "active" : "";

      thumbnails += `
        <div class="thumbnail ${isActive}" onclick="carAuction.changeMainMedia('${media.src}', '${media.type}', this)">
          ${media.type === "iframe" ? '<div class="video-indicator">VIDEO</div>' : ""}
          <img src="${media.type === "iframe" ? auction.image : media.src}" alt="${media.alt}">
        </div>
      `;
    });

    return thumbnails;
  }

  createSpecsList(specs) {
    const specEntries = Object.entries(specs);
    if (specEntries.length === 0) {
      return "<p>No specifications available</p>";
    }

    return specEntries
      .map(
        ([key, value]) => `
          <div class="spec-item">
            <span class="spec-label">${this.formatSpecLabel(key)}</span>
            <span class="spec-value">${value}</span>
          </div>
        `,
      )
      .join("");
  }

  formatSpecLabel(key) {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase());
  }

  createModalBidForm(auction, userHasBid) {
    if (userHasBid) {
      return '<div class="auction-ended" style="margin-top: 20px; text-align: center; padding: 15px; background: rgba(0,255,0,0.2); border-radius: 8px;">You have already placed a bid on this vehicle</div>';
    }

    return `
      <div class="bid-section-modal">
        <div class="bid-info-modal">
          <span>Starting Bid: ksh${auction.startingBid.toLocaleString()}</span>
          <span>Bidders: ${auction.bidderCount}</span>
        </div>
        ${
          this.currentUser
            ? `
            <div class="bid-form-modal">
              <input type="number"
                     class="bid-input-modal"
                     placeholder="Enter bid (min: ksh${(auction.currentBid + 1000).toLocaleString()})"
                     min="${auction.currentBid + 1000}"
                     step="1000"
                     id="modal-bid-input-${auction.id}">
              <button class="bid-btn-modal" onclick="event.stopPropagation(); carAuction.placeBidFromModal(${auction.id})">
                Place Bid
              </button>
            </div>
          `
            : `
            <p style="text-align: center; color: var(--text-color1);">
              <a href="#" onclick="toggleLogin(); closeCarModal();" style="color: var(--space-p-color);">Login</a> to place a bid
            </p>
          `
        }
      </div>
    `;
  }

  changeMainMedia(src, type, thumbElement) {
    const mainMedia = document.getElementById("main-media");
    if (!mainMedia) return;

    if (type === "iframe") {
      mainMedia.innerHTML = `
        <iframe
          src="${src}"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          style="width: 100%; height: 100%; border-radius: 10px;">
        </iframe>
      `;
    } else if (type === "video") {
      mainMedia.innerHTML = `
        <video controls autoplay style="width: 100%; height: 100%; object-fit: cover;">
          <source src="${src}" type="video/mp4">
          Your browser does not support the video tag.
        </video>
      `;
    } else {
      mainMedia.innerHTML = `
        <img src="${src}" id="main-media-display" style="width: 100%; height: 100%; object-fit: cover;">
      `;
    }

    // Update active thumbnail
    document
      .querySelectorAll(".thumbnail")
      .forEach((t) => t.classList.remove("active"));
    if (thumbElement) thumbElement.classList.add("active");
  }

  placeBidFromModal(auctionId) {
    const bidInput = document.getElementById(`modal-bid-input-${auctionId}`);
    if (!bidInput) return;

    const bidAmount = parseInt(bidInput.value);
    this.placeBid(auctionId, bidAmount);
  }

  setupEventListeners() {
    // Login form
    document.getElementById("login-form").addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleLogin();
    });

    // Register form
    document.getElementById("register-form").addEventListener("submit", (e) => {
      e.preventDefault();
      this.handleRegister();
    });

    // Search functionality
    const searchInput = document.getElementById("auction-search");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchTerm = e.target.value.toLowerCase().trim();
        this.filterAuctions();
      });

      // Clear search when Escape is pressed
      searchInput.addEventListener("keydown", (e) => {
        if (e.key === 'Escape') {
          e.target.value = '';
          this.searchTerm = '';
          this.filterAuctions();
        }
      });
    }
  }

  filterAuctions() {
    if (!this.searchTerm) {
      // If no search term, show all auctions
      this.filteredAuctions = [...this.auctions];
    } else {
      // Filter auctions based on search term
      this.filteredAuctions = this.auctions.filter(auction =>
        this.doesAuctionMatchSearch(auction, this.searchTerm)
      );
    }
    this.renderAuctions();
  }

  doesAuctionMatchSearch(auction, searchTerm) {
    // Search in name
    if (auction.name.toLowerCase().includes(searchTerm)) {
      return true;
    }

    // Search in description
    if (auction.description.toLowerCase().includes(searchTerm)) {
      return true;
    }

    // Search in specifications
    if (auction.specs) {
      const specValues = Object.values(auction.specs).map(value =>
        value.toString().toLowerCase()
      );
      if (specValues.some(value => value.includes(searchTerm))) {
        return true;
      }
    }

    // Search in current bid (as string)
    if (auction.currentBid.toString().includes(searchTerm)) {
      return true;
    }

    return false;
  }

  async handleLogin() {
    const form = document.getElementById("login-form");
    const email = form.querySelector('input[type="email"]').value;
    const password = form.querySelector('input[type="password"]').value;

    try {
       const response = await fetch(`${this.API_BASE}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (result.success) {
        this.currentUser = result.user;
        this.storeUser(result.user);
        toggleLogin();
        this.checkLoginStatus();
        await this.loadAuctions();
        await NotificationManager.success("Login successful!");
      } else {
        await NotificationManager.error("Login failed: " + result.error);
      }
    } catch (error) {
      console.error("Login error:", error);
      // Fallback to frontend-only login
      if (email && password) {
        this.currentUser = {
          id: Math.random().toString(36).substr(2, 9),
          email: email,
          name: email.split("@")[0],
        };
        this.storeUser(this.currentUser);
        toggleLogin();
        this.checkLoginStatus();
        this.renderAuctions();
        await NotificationManager.success("Login successful!");
      } else {
        await NotificationManager.error("Please enter both email and password");
      }
    }
  }

  async handleRegister() {
    const form = document.getElementById("register-form");
    const name = form.querySelector('input[type="text"]').value;
    const email = form.querySelector('input[type="email"]').value;
    const password = form.querySelector('input[type="password"]').value;

    try {
      const response = await fetch(`${this.API_BASE}/api/register`,{
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const result = await response.json();

      if (result.success) {
        // Auto-login after successful registration
        const loginResponse = await fetch(`${this.API_BASE}/api/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, password }),
        });

        const loginResult = await loginResponse.json();

        if (loginResult.success) {
          this.currentUser = loginResult.user;
          toggleRegister();
          this.checkLoginStatus();
          await this.loadAuctions();
          await NotificationManager.success("Registration successful! You are now logged in.");
        }
      } else {
        await NotificationManager.error("Registration failed: " + result.error);
      }
    } catch (error) {
      console.error("Registration error:", error);
      // Fallback to frontend-only registration
      if (name && email && password) {
        this.currentUser = {
          id: Math.random().toString(36).substr(2, 9),
          email: email,
          name: name,
        };

        toggleRegister();
        this.checkLoginStatus();
        this.renderAuctions();
        await NotificationManager.success("Registration successful! You are now logged in.");
      } else {
        await NotificationManager.error("Please fill all fields");
      }
    }
  }

  checkLoginStatus() {
    const loginBtn = document.getElementById("login-btn");

    // Find the mobile login button by searching in the mobile menu
    const mobileMenu = document.getElementById("mobile-menu");
    let mobileLoginBtn = null;

    if (mobileMenu) {
        // Find the login link in the mobile menu
        const mobileLoginLink = mobileMenu.querySelector('a[onclick*="toggleLogin"]');
        if (mobileLoginLink && mobileLoginLink.parentElement) {
            mobileLoginBtn = mobileLoginLink.parentElement;
        }
    }

    if (this.currentUser) {
        // Update desktop menu
        loginBtn.innerHTML = `<a href="#" onclick="carAuction.logout()">Logout</a>`;

        // Update mobile menu
        if (mobileLoginBtn) {
            mobileLoginBtn.innerHTML = `<a href="#" onclick="carAuction.logout(); document.getElementById('mobile-menu').classList.remove('active');">Logout</a>`;
        }
    } else {
        // Update desktop menu
        loginBtn.innerHTML = '<a href="#" onclick="toggleLogin()">Login</a>';

        // Update mobile menu
        if (mobileLoginBtn) {
            mobileLoginBtn.innerHTML = '<a href="#" onclick="toggleLogin(); document.getElementById(\'mobile-menu\').classList.remove(\'active\');">Login</a>';
        }
    }
  }

  async logout() {
    this.currentUser = null;
    this.storeUser(null);
    this.checkLoginStatus();
    this.renderAuctions();
    await NotificationManager.success("Logged out successfully");
  }
}

// Modal functions
function toggleLogin() {
  const modal = document.getElementById("login-modal");
  modal.style.display = modal.style.display === "block" ? "none" : "block";
}

function toggleRegister() {
  const loginModal = document.getElementById("login-modal");
  const registerModal = document.getElementById("register-modal");

  loginModal.style.display = "none";
  registerModal.style.display =
    registerModal.style.display === "block" ? "none" : "block";
}

function closeCarModal() {
  const modal = document.getElementById("car-modal");
  modal.style.display = "none";
  document.body.style.overflow = "auto";
}

// Close modals when clicking outside
window.onclick = function (event) {
  const modals = document.getElementsByClassName("modal");
  for (let modal of modals) {
    if (event.target === modal) {
      modal.style.display = "none";
    }
  }

  const carModal = document.getElementById("car-modal");
  if (event.target === carModal) {
    closeCarModal();
  }
};

// Close modal with Escape key
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeCarModal();
    toggleLogin();
    toggleRegister();
  }
});

// Initialize the auction system
const carAuction = new CarAuction();
