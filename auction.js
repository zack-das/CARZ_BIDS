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
    this.API_BASE = "http://localhost:3001/api"; // Backend API base URL
    this.init();
  }

  async init() {
    await this.loadAuctions();
    this.setupEventListeners();
    this.checkLoginStatus();
  }

  async loadAuctions() {
    try {
      const response = await fetch(${this.API_BASE}/auctions);
      if (!response.ok) {
        throw new Error("Failed to fetch auctions");
      }
      const auctions = await response.json();
      this.auctions = auctions.map((auction) => ({
        ...auction,
        endTime: new Date(auction.end_time),
        bids: [], // Initialize empty bids array
      }));
      this.renderAuctions();
      this.startTimers();
    } catch (error) {
      console.error("Failed to load auctions:", error);
      // Fallback to sample data if server is not available
      this.loadSampleAuctions();
    }
  }

  loadSampleAuctions() {
    // Sample auction data with gallery and specs
    this.auctions = [
      {
        id: 1,
        name: "Pagani Huayra",
        image: "/img/imgi_265_18015-MC20BluInfinito-scaled-e1707920217641.jpg",
        description:
          "Mid-engine sports car produced by Italian automaker Pagani",
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
      },
    ];

    this.renderAuctions();
    this.startTimers();
  }

  renderAuctions() {
    const container = document.getElementById("auctions-container");
    if (!container) {
      console.error("auctions-container not found!");
      return;
    }
