document.addEventListener('DOMContentLoaded', function() {
  // Button event listeners
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector("#compose-form").addEventListener("submit", send_email);

  // Default load inbox
  load_mailbox('inbox');
});

function compose_email() {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#emails-detail-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';

  // Reset fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function view_email(id) {
  fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
      console.log(email);

      document.querySelector('#emails-view').style.display = 'none';
      document.querySelector('#compose-view').style.display = 'none';
      document.querySelector('#emails-detail-view').style.display = 'block';

      // Display email details
      document.querySelector('#emails-detail-view').innerHTML = `
          <ul class="list-group">
              <li class="list-group-item"><strong>From:</strong> ${email.sender}</li>
              <li class="list-group-item"><strong>To:</strong> ${email.recipients}</li>
              <li class="list-group-item"><strong>Subject:</strong> ${email.subject}</li>
              <li class="list-group-item"><strong>Timestamp:</strong> ${email.timestamp}</li>
              <li class="list-group-item">${email.body}</li>
          </ul>
      `;

      // Mark email as read
      if (!email.read) {
          fetch(`/emails/${email.id}`, {
              method: "PUT",
              body: JSON.stringify({ read: true })
          });
      }

      // Archive Button
      const btn_archive = document.createElement('button');
      btn_archive.innerHTML = email.archived ? "Unarchive" : "Archive";
      btn_archive.className = email.archived ? "btn btn-success m-2" : "btn btn-danger m-2";
      document.querySelector("#emails-detail-view").append(btn_archive);

      btn_archive.addEventListener('click', function () {
          fetch(`/emails/${email.id}`, {
              method: "PUT",
              body: JSON.stringify({ archived: !email.archived })
          })
          .then(() => { load_mailbox('archive') });
      });

      // Reply Button
      const btn_reply = document.createElement('button');
      btn_reply.innerHTML = "Reply";
      btn_reply.className = "btn btn-info m-2";
      document.querySelector("#emails-detail-view").append(btn_reply);

      btn_reply.addEventListener('click', function () {
          compose_email();
          document.querySelector('#compose-recipients').value = email.sender;
          let subject = email.subject.startsWith("Re:") ? email.subject : "Re: " + email.subject;
          document.querySelector('#compose-subject').value = subject;
          document.querySelector('#compose-body').value = `On ${email.timestamp}, ${email.sender} wrote:\n${email.body}`;
      });
  });
}

function load_mailbox(mailbox) {
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#emails-detail-view').style.display = 'none';

  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      emails.forEach(email => {
          const newEmail = document.createElement('div');
          newEmail.classList.add("list-group-item", "email-item", "p-3", "rounded", "mb-2", email.read ? "read" : "unread");
          newEmail.innerHTML = `
              <div class="d-flex justify-content-between align-items-center">
                  <div>
                      <h6 class="text-primary mb-1"><strong>From:</strong> ${email.sender}</h6>
                      <h6 class="text-dark"><strong>Subject:</strong> ${email.subject}</h6>
                  </div>
                  <span class="text-muted small">${email.timestamp}</span>
              </div>
          `;
          newEmail.addEventListener('click', () => view_email(email.id));
          document.querySelector('#emails-view').append(newEmail);
      });

  });
}

function send_email(event) {
  event.preventDefault();

  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({ recipients, subject, body })
  })
  .then(response => response.json())
  .then(result => {
      console.log(result);
      load_mailbox("sent");
  });
}
