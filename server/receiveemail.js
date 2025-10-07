// backend/receiveEmails.js
const Imap = require("node-imap");
const { simpleParser } = require("mailparser");

const imap = new Imap({
  user: "gayathrigottemukkala@gmail.com",
  password: "xnzofdregzerfyyo",
  host: "imap.gmail.com",
  port: 993,
  tls: true,
});

function openInbox(cb) {
  imap.openBox("INBOX", true, cb);
}

imap.once("ready", function () {
  openInbox((err, box) => {
    if (err) throw err;
    const f = imap.seq.fetch("1:10", {
      // fetch last 10 emails
      bodies: "",
      struct: true,
    });
    f.on("message", (msg) => {
      msg.on("body", (stream) => {
        simpleParser(stream, (err, parsed) => {
          console.log("From:", parsed.from.text);
          console.log("Subject:", parsed.subject);
          console.log("Text:", parsed.text);
        });
      });
    });
    f.once("error", (err) => console.log("Fetch error:", err));
    f.once("end", () => {
      console.log("Done fetching emails");
      imap.end();
    });
  });
});

imap.once("error", (err) => console.log(err));
imap.once("end", () => console.log("Connection ended"));
imap.connect();
