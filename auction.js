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
