const express = require("express");
const axios = require("axios");
const app = express();
const port = 3000;

// Proxy for OIDC Discovery Document
app.get("/.well-known/openid-configuration", async (req, res) => {
  try {
    // Fetch the Discovery Document from ID.me
    const response = await axios.get(
      "https://api.idmelabs.com/oidc/.well-known/openid-configuration"
    );
    const discoveryDoc = response.data;

    // Modify the JWKS URI to include the `urlsafe=true` parameter
    discoveryDoc.jwks_uri += "?urlsafe=true";

    // Return the modified discovery document
    res.setHeader("Content-Type", "application/json");
    res.send(discoveryDoc);
  } catch (error) {
    console.error("Error fetching discovery document:", error.message);
    res.status(500).send({ error: "Error fetching discovery document" });
  }
});

// Start the server
app.listen(port, () => {
  console.log(
    `Proxy server running at http://localhost:${port}/.well-known/openid-configuration`
  );
});
