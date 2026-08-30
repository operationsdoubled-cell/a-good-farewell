/* ==========================================================================
   A Good Farewell — shared behaviour
   Scroll-aware header, full-screen mobile nav, FAQ accordion, and inline
   contact-form validation. No dependencies, no build step.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', function () {

  /* ---- Header: gains a background once the page has scrolled ----------- */
  var header = document.querySelector('.site-header');
  if (header) {
    var updateHeader = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 8);
    };
    updateHeader();
    window.addEventListener('scroll', updateHeader, { passive: true });
  }

  /* ---- Mobile navigation: full-screen overlay ---------------------------
     Modelled on the shadcn/Radix Sheet pattern (a Dialog under the hood):
     role="dialog" + aria-modal, and everything outside the panel becomes
     inert while it's open — which removes it from both the tab order and
     the accessibility tree in one attribute, so focus can't leak into the
     page behind the menu. Closing restores it and returns focus to the
     toggle, exactly as Radix's Dialog.Content does. */
  var navToggle = document.querySelector('.nav-toggle');
  var navOverlay = document.getElementById('nav-overlay');
  var navClose = document.querySelector('.nav-overlay-close');

  function setBackgroundInert(state) {
    Array.prototype.forEach.call(document.body.children, function (el) {
      if (el === navOverlay) { return; }
      if (state) { el.setAttribute('inert', ''); } else { el.removeAttribute('inert'); }
    });
  }

  function openNav() {
    navOverlay.classList.add('is-open');
    navOverlay.removeAttribute('inert');
    navToggle.setAttribute('aria-expanded', 'true');
    document.body.classList.add('nav-open');
    setBackgroundInert(true);
    if (navClose) { navClose.focus(); }
  }
  function closeNav() {
    navOverlay.classList.remove('is-open');
    navOverlay.setAttribute('inert', '');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('nav-open');
    setBackgroundInert(false);
    navToggle.focus();
  }

  if (navToggle && navOverlay) {
    navToggle.addEventListener('click', openNav);
    if (navClose) { navClose.addEventListener('click', closeNav); }

    navOverlay.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', closeNav);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && navOverlay.classList.contains('is-open')) {
        closeNav();
      }
    });
  }

  /* ---- FAQ / accordion --------------------------------------------------- */
  var triggers = document.querySelectorAll('.accordion-trigger');
  triggers.forEach(function (trigger) {
    var panel = document.getElementById(trigger.getAttribute('aria-controls'));
    if (!panel) { return; }
    trigger.addEventListener('click', function () {
      var isOpen = trigger.getAttribute('aria-expanded') === 'true';
      if (isOpen) {
        trigger.setAttribute('aria-expanded', 'false');
        panel.style.maxHeight = null;
        return;
      }
      trigger.setAttribute('aria-expanded', 'true');
      panel.style.maxHeight = panel.scrollHeight + 'px';
    });
  });
  window.addEventListener('resize', function () {
    document.querySelectorAll('.accordion-trigger[aria-expanded="true"]').forEach(function (trigger) {
      var panel = document.getElementById(trigger.getAttribute('aria-controls'));
      if (panel) { panel.style.maxHeight = panel.scrollHeight + 'px'; }
    });
  });

  /* ---- Contact form: inline validation + submission stub -----------------
     This validates in the browser and shows a message directly under each
     field, then (for now) shows a success state client-side only.

     To go live, wire the form up to a submission service, for example:

       Formspree:  <form action="https://formspree.io/f/{your-id}" method="POST">
       Netlify:    add data-netlify="true" plus a hidden "form-name" input,
                   then deploy on Netlify.

     Once wired to a real endpoint, keep the validation below and either let
     the form submit normally, or replace the stub with a fetch() call.
  --------------------------------------------------------------------------- */
  var contactForm = document.getElementById('contact-form');
  if (contactForm) {
    var fields = Array.prototype.slice.call(contactForm.querySelectorAll('[data-validate]'));

    function messageFor(input) {
      if (input.validity.valueMissing) { return input.dataset.errorRequired || 'This field is required.'; }
      if (input.validity.typeMismatch && input.type === 'email') { return 'Enter a valid email address.'; }
      return 'Please check this field.';
    }

    function validateField(input) {
      var wrapper = input.closest('.field');
      var errorEl = wrapper.querySelector('.field-error');
      if (!input.checkValidity()) {
        wrapper.classList.add('has-error');
        input.setAttribute('aria-invalid', 'true');
        if (errorEl) { errorEl.textContent = messageFor(input); }
        return false;
      }
      wrapper.classList.remove('has-error');
      input.setAttribute('aria-invalid', 'false');
      return true;
    }

    fields.forEach(function (input) {
      input.addEventListener('blur', function () { validateField(input); });
    });

    contactForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var allValid = true;
      fields.forEach(function (input) {
        if (!validateField(input)) { allValid = false; }
      });
      if (!allValid) {
        var firstError = contactForm.querySelector('.has-error input, .has-error select, .has-error textarea');
        if (firstError) { firstError.focus(); }
        return;
      }

      // TODO: replace this block with a real submission, e.g.
      // fetch(contactForm.action, { method: 'POST', body: new FormData(contactForm), headers: { Accept: 'application/json' } })

      var success = document.getElementById('form-success');
      if (success) {
        success.classList.add('is-visible');
        success.setAttribute('tabindex', '-1');
        success.focus();
      }
      contactForm.reset();
    });
  }

});
