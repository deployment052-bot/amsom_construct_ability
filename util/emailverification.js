// checkEmail.js
require("dotenv").config();
const axios = require("axios");

async function validateEmail(email) {
  try {
    const response = await axios.get("https://emailvalidation.abstractapi.com/v1/", {
      params: {
        api_key: process.env.ABSTRACT_API_KEY,
        email: email,
      },
    });

    console.log("Full Response:", response.data);

    if (response.data.deliverability === "DELIVERABLE") {
      console.log("✅ Email exists:", email);
    } else {
      console.log("❌ Invalid email:", email);
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
}

// test with your email
validateEmail("chugen74@gmail.com");
