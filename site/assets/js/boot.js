// Roda no <head>, antes de a página aparecer, para o texto grande e o alto contraste
// não "piscarem" no carregamento. Script comum (não módulo) e sem dependências.
(function () {
  try {
    var prefs = JSON.parse(localStorage.getItem('inclui:a11y') || '{}');
    var root = document.documentElement;
    root.dataset.text = prefs.text || 'normal';
    root.dataset.contrast = prefs.contrast ? 'high' : 'normal';
    root.dataset.motion = prefs.reducedMotion ? 'reduced' : 'normal';
  } catch (error) {
    // Sem armazenamento, valem os padrões.
  }
})();
