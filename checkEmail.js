require('dotenv').config();
const axios = require('axios');

async function testEmail() {
  const email = "test@example.com";
  console.log("Using API Key:", process.env.EMAIL_VERIFIER_API_KEY);

  try {
    const res = await axios.get("https://emailvalidation.abstractapi.com/v1/", {
      params: {
        api_key: process.env.EMAIL_VERIFIER_API_KEY,
        email: email
      }
    });
    console.log(res.data);
  } catch (err) {
    if (err.response) {
      console.error("API response error:", err.response.data);
    } else {
      console.error("API request error:", err.message);
    }
  }
}

testEmail();
