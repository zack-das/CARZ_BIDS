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

  // Close menu with
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && mobileMenu.classList.contains("active")) {
      mobileMenu.classList.remove("active");
    }
  });
});

// Auction functionality
class CarAuction {
  constructor() {
    this.currentUser = null;
    this.auctions = [];
    this.filteredAuctions = [];
    this.API_BASE = "http://localhost:3001/api";
    this.searchTerm = '';
    this.priceFilter = '';
    this.timeFilter = '';
    this.init();
  }

  async init() {
    await this.loadAuctions();
    this.setupEventListeners();
    this.setupSearchFunctionality();
    this.checkLoginStatus();
  }

  async loadAuctions() {
    try {
      const response = await fetch(`${this.API_BASE}/auctions`);
      if (response.ok) {
        const dbAuctions = await response.json();


        this.auctions = [
          ...transformedDbAuctions,
          ...this.getOriginalSampleAuctions()
        ];
      } else {
        // If no database, use only original sample auctions
        this.auctions = this.getOriginalSampleAuctions();
      }
    } catch (error) {
      console.error("Failed to load auctions from database:", error);
      // Use only original sample auctions if database fails
      this.auctions = this.getOriginalSampleAuctions();
    }

    this.filterAuctions();
  }


  getOriginalSampleAuctions() {
    return [
      {
        id: 1,
        name: "Pagani Huayra",
        image: "/img/imgi_265_18015-MC20BluInfinito-scaled-e1707920217641.jpg",
        description: "Mid-engine sports car produced by Italian automaker Pagani",
        startingBid: 2500000,
        currentBid: 2650000,
        bidderCount: 8,
        endTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        bids: [],
        gallery: [
          {
            type: "image",
            src: "/img/imgi_265_18015-MC20BluInfinito-scaled-e1707920217641.jpg",
            alt: "Pagani Huayra Front",
          },
          {
            type: "image",
            src: "/img/imgi_265_18015-MC20BluInfinito-scaled-e1707920217641.jpg",
            alt: "Pagani Huayra Side",
          },
          {
            type: "iframe",
            src: "https://www.youtube.com/embed/1rYKERKZOgc",
            alt: "Pagani Huayra Interior",
          },
        ],
        specs: {
          engine: "6.0L V12",
          horsepower: "730 hp",
          torque: "740 lb-ft",
          acceleration: "2.8s 0-60 mph",
          topSpeed: "238 mph",
          transmission: "7-speed automatic",
        },
      },
      {
        id: 2,
        name: "Porsche Taycan Turbo",
        image: "/img/imgi_263_prosche-electric-car-01.jpg",
        description: "All-electric luxury sports sedan",
        startingBid: 185000,
        currentBid: 210000,
        bidderCount: 12,
        endTime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        bids: [],
        gallery: [
          {
            type: "image",
            src: "/img/imgi_263_prosche-electric-car-01.jpg",
            alt: "Porsche Taycan Front",
          },
          {
            type: "iframe",
            src: "https://www.youtube.com/embed/Oi-xWqXnufI",
            alt: "Porsche Taycan Interior",
          },
        ],
        specs: {
          engine: "Dual Electric Motors",
          horsepower: "750 hp",
          torque: "774 lb-ft",
          acceleration: "2.6s 0-60 mph",
          topSpeed: "161 mph",
          range: "201 miles",
        },
      },
      {
        id: 3,
        name: "Nissan Leaf",
        image:
          "/img/imgi_253_250308-all-new-nissan-leaf-dynamic-pictures-01.jpg",
        description: "Compact all-electric hatchback",
        startingBid: 28000,
        currentBid: 31500,
        bidderCount: 5,
        endTime: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        bids: [],
        gallery: [
          {
            type: "iframe",
            src: "https://www.youtube.com/embed/TDklt0vweyA",
            alt: "Nissan Leaf Front",
          },
        ],
        specs: {
          engine: "Electric Motor",
          horsepower: "147 hp",
          torque: "236 lb-ft",
          acceleration: "7.4s 0-60 mph",
          topSpeed: "89 mph",
          range: "149 miles",
        },
      },
      {
        id: 4,
        name: "Rolls Royce Phantom",
        image: "/img/imgi_247_rolls_royce_phantom_top_10.jpg",
        description: "Full-sized luxury saloon car",
        startingBid: 450000,
        currentBid: 485000,
        bidderCount: 6,
        endTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        bids: [],
        gallery: [
          {
            type: "iframe",
            src: "https://www.youtube.com/embed/FzO6KdXHeeU",
            alt: "Rolls Royce Phantom",
          },
        ],
        specs: {
          engine: "6.75L V12",
          horsepower: "563 hp",
          torque: "664 lb-ft",
          acceleration: "5.1s 0-60 mph",
          topSpeed: "155 mph",
          transmission: "8-speed automatic",
        },
      }
    ];
  }


  generateSampleSpecs(carName) {
    const specs = {
      "Toyota Camry 2022": {
        engine: "2.5L 4-cylinder",
        horsepower: "203 hp",
        torque: "184 lb-ft",
        acceleration: "7.9s 0-60 mph",
        topSpeed: "135 mph",
        transmission: "8-speed automatic",
        fuelEconomy: "32 mpg combined"
      },
      "Ford Mustang GT": {
        engine: "5.0L V8",
        horsepower: "450 hp",
        torque: "410 lb-ft",
        acceleration: "4.3s 0-60 mph",
        topSpeed: "155 mph",
        transmission: "10-speed automatic",
        fuelEconomy: "19 mpg combined"
      },
      "Honda Civic 2021": {
        engine: "2.0L 4-cylinder",
        horsepower: "158 hp",
        torque: "138 lb-ft",
        acceleration: "7.5s 0-60 mph",
        topSpeed: "130 mph",
        transmission: "CVT automatic",
        fuelEconomy: "35 mpg combined"
      }
    };

    return specs[carName] || {
      engine: "Not specified",
      horsepower: "Not specified",
      transmission: "Not specified"
    };
  }



  filterAuctions() {
    let filtered = [...this.auctions];



    // Apply price filter
    if (this.priceFilter) {
      filtered = filtered.filter(auction => {
        const currentBid = auction.currentBid;

        switch (this.priceFilter) {
          case '0-50000':
            return currentBid <= 50000;
          case '50000-100000':
            return currentBid > 50000 && currentBid <= 100000;
          case '100000-500000':
            return currentBid > 100000 && currentBid <= 500000;
          case '500000+':
            return currentBid > 500000;
          default:
            return true;
        }
      });
    }

    // Apply time filter
    if (this.timeFilter) {
      const now = new Date();
      filtered = filtered.filter(auction => {
        const timeRemaining = auction.endTime - now;

        switch (this.timeFilter) {
          case 'ending-soon':
            return timeRemaining <= 24 * 60 * 60 * 1000; // 24 hours
          case 'ending-week':
            return timeRemaining <= 7 * 24 * 60 * 60 * 1000; // 7 days
          default:
            return true;
        }
      });
    }

    this.filteredAuctions = filtered;
    this.renderFilteredAuctions();
    this.updateResultsInfo();
  }

  renderFilteredAuctions() {
    const container = document.getElementById('auctions-container');

    if (!container) {
      console.error('auctions-container not found!');
      return;
    }

    if (this.filteredAuctions.length === 0) {
      container.innerHTML = `
        <div class="no-results">
          <h3>No cars found matching your search</h3>
          <p>Try adjusting your search terms or filters</p>
          <button onclick="carAuction.clearFilters()" class="bid-btn" style="margin-top: 10px;">
            Clear All Filters
          </button>
        </div>
      `;
      return;
    }

    container.innerHTML = '';
    this.filteredAuctions.forEach(auction => {
      const auctionElement = this.createAuctionElement(auction);
      container.appendChild(auctionElement);
    });

    this.startTimers();
  }





  createAuctionElement(auction) {
    const div = document.createElement("div");
    div.className = "auction-item";
    div.style.cursor = "pointer";
    div.onclick = () => this.openCarModal(auction.id);

    // Highlight search terms in name and description
    let displayName = auction.name;
    let displayDescription = auction.description;


    div.innerHTML = `
            <img src="${auction.image}" alt="${auction.name}" class="auction-image">
            <h3 class="car-name">${displayName}</h3>
            <p class="car-info">${displayDescription}</p>
            <div class="current-bid">Current Bid: KSH ${auction.currentBid.toLocaleString()}</div>
            <div class="bid-info">
                <span>Bidders: ${auction.bidderCount}</span>
                <span>Starting: KSH ${auction.startingBid.toLocaleString()}</span>
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
    const userHasBid =
      this.currentUser &&
      auction.bids.some((bid) => bid.userId === this.currentUser?.id);

    if (hasEnded) {
      return `
                <div class="auction-ended">
                    Auction Ended
                    ${
                      auction.bids.length > 0
                        ? `<div class="winning-bid">Winning Bid: KSH ${Math.max(...auction.bids.map((b) => b.amount)).toLocaleString()}</div>`
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
                       placeholder="Enter your bid (min: KSH ${(auction.currentBid + 1000).toLocaleString()})"
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
      alert("Please login to place a bid");
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
      alert(
        `Bid must be at least $${(auction.currentBid + 1000).toLocaleString()}`,
      );
      return;
    }

    try {
      const response = await fetch(
        `${this.API_BASE}/auctions/${auctionId}/bid`,
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

        alert(`Bid of $${bidAmount.toLocaleString()} placed successfully!`);
      } else {
        alert("Bid failed: " + result.error);
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

      this.filterAuctions();

      if (document.getElementById("car-modal")?.style.display === "block") {
        this.openCarModal(auctionId);
      }

      alert(`Bid of $${bidAmount.toLocaleString()} placed successfully!`);
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
                <div class="car-price-modal">Current Bid: KSH ${auction.currentBid.toLocaleString()}</div>
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
                    <span>Starting Bid: KSH ${auction.startingBid.toLocaleString()}</span>
                    <span>Bidders: ${auction.bidderCount}</span>
                </div>
                ${
                  this.currentUser
                    ? `
                    <div class="bid-form-modal">
                        <input type="number"
                               class="bid-input-modal"
                               placeholder="Enter bid (min: Ksh${(auction.currentBid + 1000).toLocaleString()})"
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
    const loginForm = document.getElementById("login-form");
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleLogin();
      });
    }

    // Register form
    const registerForm = document.getElementById("register-form");
    if (registerForm) {
      registerForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.handleRegister();
      });
    }
  }

  async handleLogin() {

    const form = document.getElementById("login-form");
    const email = form.querySelector('input[type="email"]').value;
    const password = form.querySelector('input[type="password"]').value;

    try {
      const response = await fetch(`${this.API_BASE}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();

      if (result.success) {
        this.currentUser = result.user;
        toggleLogin();
        this.checkLoginStatus();
        await this.loadAuctions();
        alert("Login successful!");
      } else {
        alert("Login failed: " + result.error);
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

        toggleLogin();
        this.checkLoginStatus();
        this.filterAuctions();
        alert("Login successful!");
      } else {
        alert("Please enter both email and password");
      }
    }
  }

  async handleRegister() {

    const form = document.getElementById("register-form");
    const name = form.querySelector('input[type="text"]').value;
    const email = form.querySelector('input[type="email"]').value;
    const password = form.querySelector('input[type="password"]').value;

    try {
      const response = await fetch(`${this.API_BASE}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const result = await response.json();

      if (result.success) {
        // Auto-login after successful registration
        const loginResponse = await fetch(`${this.API_BASE}/login`, {
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
          alert("Registration successful! You are now logged in.");
        }
      } else {
        alert("Registration failed: " + result.error);
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
        this.filterAuctions();
        alert("Registration successful! You are now logged in.");
      } else {
        alert("Please fill all fields");
      }
    }
  }

  checkLoginStatus() {
    const loginBtn = document.getElementById("login-btn");
    if (this.currentUser) {
      loginBtn.innerHTML = `<a href="#" onclick="carAuction.logout()">Logout </a>`;
    } else {
      loginBtn.innerHTML = '<a href="#" onclick="toggleLogin()">Login</a>';
    }
  }

  logout() {
    this.currentUser = null;
    this.checkLoginStatus();
    this.filterAuctions();
    alert("Logged out successfully");
  }
}

//Login
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
