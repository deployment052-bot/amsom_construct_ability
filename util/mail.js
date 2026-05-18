const nodemailer = require("nodemailer");

async function sendEmail(options, subject, html) {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"AMSOM CONSTRUCTABILITY" <${process.env.EMAIL_USER}>`,
    subject,
    html,
  };

  if (typeof options === 'object') {
    mailOptions.to = options.to;
    if (options.bcc) {
      mailOptions.bcc = options.bcc;
    }
  } else {
    mailOptions.to = options;
  }

  const info = await transporter.sendMail(mailOptions);
  console.log("✅ Email sent:", info.response);  // 👈 yaha confirm hoga
  return info;
}

module.exports = sendEmail;
