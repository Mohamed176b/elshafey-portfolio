import { useEffect } from "react";

/**
 * DashboardAnimationObserver Component
 * Adds animation effects to dashboard elements using Intersection Observer.
 * This is a performance-optimized version that handles animations for multiple
 * dashboard elements including projects, cards, and sidebar components.
 */
const DashboardAnimationObserver = () => {
  useEffect(() => {
    // Set to track elements that have already been animated
    const animatedElements = new Set();

    // Callback function for the Intersection Observer
    // Handles adding animation classes when elements become visible
    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !animatedElements.has(entry.target)) {
          const element = entry.target;
          element.classList.add("animate-visible");
          animatedElements.add(element);

          if (element.classList.contains("has-sequential-children")) {
            const children = element.querySelectorAll(".sequential-item");
            children.forEach((child, index) => {
              child.style.setProperty("animation-delay", `${0.1 * index}s`);
              child.classList.add("animate-visible");
              animatedElements.add(child);
            });
          }
        }
      });
    };

    // Initialize Intersection Observer with default options
    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: "0px",
      threshold: 0.1,
    });

    // Combine all target selectors for performance optimization
    const selectors = [
      ".project",
      ".dashboard-card",
      ".order-instructions",
      ".add-project-page .input-field",
      ".form-submit-button",
      ".projects-container",
      ".page-title",
      ".dashboard-page-header",
      ".tech-selection",
      ".thumb",
      ".sidebar-link",
      ".sidebar",
      ".dashboard-page",
      ".main-content",
    ].join(",");

    // Query all elements at once for better performance
    const elements = document.querySelectorAll(selectors);

    // Apply animation classes based on element type
    elements.forEach((element, index) => {
      const classList = element.classList;

      // Projects get fade-up animation with staggered delay
      if (classList.contains("project")) {
        classList.add("animate-on-scroll", "animate-fade-up");
        element.style.setProperty("animation-delay", `${0.05 * index}s`);
      }
      // Dashboard cards get fade-in animation with staggered delay
      else if (classList.contains("dashboard-card")) {
        classList.add("animate-on-scroll", "animate-fade-in");
        element.style.setProperty("animation-delay", `${0.1 * index}s`);
      }
      // Order instructions get glow animation
      else if (classList.contains("order-instructions")) {
        classList.add("animate-on-scroll", "animate-glow");
      }
      // Persistent elements that should remain visible
      else if (
        classList.contains("sidebar-link") ||
        classList.contains("sidebar") ||
        classList.contains("dashboard-page") ||
        classList.contains("main-content")
      ) {
        classList.add("animate-no-hide", "animate-visible");
      }
      // Default animation for other elements
      else {
        classList.add("animate-on-scroll");
      }

      // Only observe elements that should hide/show on scroll
      if (!classList.contains("animate-no-hide")) {
        observer.observe(element);
      }

      animatedElements.add(element);
    });

    // Cleanup function to remove animations and disconnect observer
    return () => {
      observer.disconnect();
      animatedElements.forEach((element) => {
        if (element) {
          element.classList.remove(
            "animate-visible",
            "animate-on-scroll",
            "animate-fade-up",
            "animate-fade-in",
            "animate-glow",
            "animate-no-hide"
          );
          element.style.removeProperty("animation-delay");
        }
      });
      animatedElements.clear();
    };
  }, []);

  return null;
};

export default DashboardAnimationObserver;
