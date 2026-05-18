const express = require('express');
const router = express.Router();
const quote = require('../model/GetQoute');
const service = require('../model/getservice');
const sendEmail = require('../util/mail'); 
const { google } = require('googleapis');
const axios = require("axios");
require("dotenv").config();

console.log("Contactus route loaded");

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const SHEET_ID = process.env.GOOGLE_SHEET_ID;

// ------------------ EMAIL VALIDATION FUNCTION ------------------
async function validateEmailAbstract(email) {
  try {
    const response = await axios.get("https://emailvalidation.abstractapi.com/v1/", {
      params: {
        api_key: process.env.EMAIL_VERIFIER_API_KEY,
        email: email,
      },
    });

    const data = response.data;

    // Build friendly message if undeliverable
    if (data.deliverability !== "DELIVERABLE") {
      let reasons = [];
      if (!data.is_mx_found.value) reasons.push("No valid mail server");
      if (data.is_disposable_email.value) reasons.push("Disposable email");
      if (data.is_role_email.value) reasons.push("Role-based email");
      if (!data.is_smtp_valid.value) reasons.push("SMTP check failed");

      return { valid: false, deliverability: data.deliverability, reasons: reasons.join(", ") };
    }

    return { valid: true, deliverability: data.deliverability };
  } catch (err) {
    if (err.response) {
      console.error("Email validation API response error:", err.response.data);
    } else {
      console.error("Email validation API error:", err.message);
    }
    return { valid: false, deliverability: "API error", reasons: err.message };
  }
}

// ------------------ APPEND TO GOOGLE SHEETS ------------------
const appendToSheet = async (range, values) => {
  const authClient = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: authClient });

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] },
  });
};

// ------------------ SUBMIT QUOTE ------------------
router.post('/submit-quote', async (req, res) => {
  try {
    const { customer_name, customer_number, customer_email, Massage, subject } = req.body;

    if (!customer_name || !customer_number || !customer_email || !Massage || !subject) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Email validation
    const validation = await validateEmailAbstract(customer_email);
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Invalid or undeliverable email address',
        details: validation.reasons
      });
    }

    // Default email status
    let emailStatus = 'not-coordinate';
    let emailError = null;

    try {
      await sendEmail(
        customer_email,
        'Thanks for connecting with us!',
        `<table width="100%" cellpadding="0" cellspacing="0" style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px 0;">
          ...
        </table>`
      );

      emailStatus = 'coordinate';
      console.log('✅ Email sent');
    } catch (emailErr) {
      emailError = emailErr.message;
      console.error('❌ Email sending failed:', emailErr.message);
    }

    // Save to DB
    const dbadd = new quote({
      customer_name: customer_name.trim(),
      customer_number: customer_number.trim(),
      customer_email: customer_email.trim(),
      Massage: Massage.trim(),
      subject: subject.trim(),
      GQ_status: emailStatus
    });
    await dbadd.save();

    // Append to sheet
    await appendToSheet('GET_QUOTE!A1:F', [
      customer_name.trim(),
      customer_number.trim(),
      customer_email.trim(),
      Massage.trim(),
      subject.trim(),
      emailStatus
    ]);

    // Response
    if (emailStatus === 'coordinate') {
      res.status(200).json({ message: 'Quote submitted & email sent successfully' });
    } else {
      res.status(200).json({
        message: 'Quote submitted but email failed',
        error: emailError
      });
    }
  } catch (err) {
    console.error('Server Error:', err.message);
    res.status(500).json({ error: 'Error saving quote', details: err.message });
  }
});

// ------------------ SUBMIT SERVICE ------------------
router.post('/submit-service', async (req, res) => {
  try {
    const { name, number, date } = req.body;

    if (!name || !number || !date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await appendToSheet('GET_SERVICE!A:C', [
      name.trim(),
      number.trim(),
      date.trim()
    ]);

    res.status(200).json({
      message: 'Contact saved successfully (Google Sheets)'
    });

  } catch (err) {
    console.error('Google Sheets Error:', err.message);
    res.status(500).json({
      error: 'Error saving contact',
      details: err.message
    });
  }
});

module.exports = router;
