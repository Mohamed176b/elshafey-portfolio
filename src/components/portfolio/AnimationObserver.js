import { useEffect, useCallback } from "react";

/**
 * A plugin to enable animation effects when elements appear during scrolling
 * with optimized performance using debouncing and proper cleanup
 */
const AnimationObserver = () => {
  // Memoize the callback to prevent unnecessary re-renders
  const observerCallback = useCallback((entries) => {
    // Use requestAnimationFrame for smooth animations
    requestAnimationFrame(() => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
        } else {
          // Remove the class when element is not visible anymore
          entry.target.classList.remove("visible");
        }
      });
    });
  }, []);

  useEffect(() => {
    // Selector list - stored in a constant to avoid recreation
    const SELECTORS = [
      ".project-card",
      ".tech-card",
      ".feature-card",
      ".contact-card",
      ".contact-form",
      ".project-description-box",
    ].join(",");

    // Create an IntersectionObserver instance with optimized options
    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: "50px", 
      threshold: [0, 0.25],
    });

    // Get all elements once to avoid multiple DOM queries
    const elements = document.querySelectorAll(SELECTORS);

    elements.forEach((element) => {
      if (!element.classList.contains("animate-on-scroll")) {
        element.classList.add("animate-on-scroll");
        observer.observe(element);
      }
    });

    // Enhanced cleanup
    return () => {
      elements.forEach((element) => {
        element.classList.remove("animate-on-scroll", "visible");
      });
      observer.disconnect();
    };
  }, [observerCallback]);

  return null;
};

export default AnimationObserver;
