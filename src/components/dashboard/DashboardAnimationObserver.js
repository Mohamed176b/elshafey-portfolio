import { useEffect } from 'react';

/**
 * Componente que añade animaciones a los elementos del dashboard
 * Similar al AnimationObserver pero específico para el dashboard
 */
const DashboardAnimationObserver = () => {
  useEffect(() => {
    // Activa las animaciones en elementos específicos del dashboard
    const observerCallback = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-visible');
          
          // Para elementos que tienen hijos que necesitan animación secuencial
          if (entry.target.classList.contains('has-sequential-children')) {
            const children = entry.target.querySelectorAll('.sequential-item');
            children.forEach((child, index) => {
              child.style.animationDelay = `${0.1 * index}s`;
              child.classList.add('animate-visible');
            });
          }
        }
      });
    };

    // Configuración del observer
    const observer = new IntersectionObserver(observerCallback, {
      root: null,
      rootMargin: '0px',
      threshold: 0.1 // Umbral menor para activar antes las animaciones
    });

    // Selecciona todos los elementos del dashboard que queremos animar
    const animateElements = [
      '.project', // Proyectos en la lista
      '.dashboard-card', // Tarjetas del dashboard
      '.order-instructions', // Instrucciones de orden
      '.add-project-page .input-field', // Campos del formulario
      '.form-submit-button', // Botones de envío
      '.projects-container', // Contenedor de proyectos
      '.page-title', // Títulos de página
      '.dashboard-page-header', // Encabezados de página
      '.tech-selection', // Selección de tecnologías
      '.thumb' // Miniaturas
    ];

    // Aplica las clases de animación a todos los elementos seleccionados
    animateElements.forEach(selector => {
      document.querySelectorAll(selector).forEach((element, index) => {
        // Agrega clases de animación según el tipo de elemento
        if (element.classList.contains('project')) {
          element.classList.add('animate-on-scroll', 'animate-fade-up');
          element.style.animationDelay = `${0.05 * index}s`;
        } else if (element.classList.contains('dashboard-card')) {
          element.classList.add('animate-on-scroll', 'animate-fade-in');
          element.style.animationDelay = `${0.1 * index}s`;
        } else if (element.classList.contains('order-instructions')) {
          element.classList.add('animate-on-scroll', 'animate-glow');
        } else {
          element.classList.add('animate-on-scroll');
        }
        
        // Observa el elemento para activar la animación
        observer.observe(element);
      });
    });

    // Solo aplicamos efectos de hover a los elementos de la barra lateral
    document.querySelectorAll('.sidebar-link').forEach((element, index) => {
      element.classList.add('animate-no-hide');
      element.classList.add('animate-visible');
    });

    // Nos aseguramos de que los elementos críticos sean siempre visibles
    
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.classList.add('animate-no-hide');
      sidebar.classList.add('animate-visible');
    }
    
    const dashboardPage = document.querySelector('.dashboard-page');
    if (dashboardPage) {
      dashboardPage.classList.add('animate-no-hide');
      dashboardPage.classList.add('animate-visible');
    }
    
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.classList.add('animate-no-hide');
      mainContent.classList.add('animate-visible');
    }

    // Limpieza al desmontar
    return () => {
      if (observer) {
        observer.disconnect();
      }
    };
  }, []);

  return null; // No renderiza ningún elemento visual
};

export default DashboardAnimationObserver;
