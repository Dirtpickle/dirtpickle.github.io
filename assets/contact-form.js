// Sends the contact form to Formspree in the background so the visitor
// stays on your site (no redirect to a Formspree page).
(function () {
  var form = document.getElementById('contact-form');
  if (!form) return;

  var button = form.querySelector('.submit-btn');
  var status = document.getElementById('form-status');

  function show(message, isError) {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle('is-error', Boolean(isError));
    status.hidden = false;
  }

  function setSending(sending) {
    if (!button) return;
    button.disabled = sending;
    button.classList.toggle('is-loading', sending);
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    if (status) status.hidden = true;
    setSending(true);

    fetch(form.action, {
      method: 'POST',
      body: new FormData(form),
      headers: { Accept: 'application/json' }
    })
      .then(function (response) {
        if (!response.ok) throw new Error('Request failed');
        form.reset();
        show('Thank you. Your message has been sent.', false);
      })
      .catch(function () {
        show('Sorry, your message could not be sent. Please try again or email me directly.', true);
      })
      .then(function () {
        setSending(false);
      });
  });
})();
