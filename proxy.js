const express = require("express");
const axios = require("axios");
const app = express();
const port = process.env.PORT || 3000; // Use Heroku's port or default to 3000

// Middleware to log all incoming requests
app.use((req, res, next) => {
  console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  console.log(`Request received from: ${req.ip}`);
  console.log(`Headers: ${JSON.stringify(req.headers, null, 2)}`);
  console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
  next();
});

// Proxy for OIDC Discovery Document
app.get("/.well-known/openid-configuration", async (req, res) => {
  try {
    // Fetch the original Discovery Document from ID.me
    const response = await axios.get(
      "https://api.idmelabs.com/oidc/.well-known/openid-configuration"
    );
    const discoveryDoc = response.data;

    // Modify the `jwks_uri` to ensure the `urlsafe=true` parameter is appended
    const originalJwksUri = discoveryDoc.jwks_uri.split("?")[0]; // Strip existing query params
    // discoveryDoc.jwks_uri = `${originalJwksUri}?urlsafe=true`;
    discoveryDoc.jwks_uri =
      "https://mromer-b373ed7a72e8.herokuapp.com/oidc/.well-known/jwks";

    // Send the modified Discovery Document as the response
    res.setHeader("Content-Type", "application/json");
    res.send(discoveryDoc);
  } catch (error) {
    console.error("Error fetching discovery document:", error.message);
    res.status(500).send({ error: "Error fetching discovery document" });
  }
});

// Proxy for JWKS Requests
app.get("/oidc/.well-known/jwks", async (req, res) => {
  try {
    // Force the `urlsafe=true` parameter to ensure a clean response without \n characters
    const jwksUri = `https://api.idmelabs.com/oidc/.well-known/jwks?urlsafe=true`;
    // Fetch the JWKS from the upstream server
    const response = await axios.get(jwksUri);
    const jwks = response.data;

    // Clean up `x5c` values to remove newlines
    jwks.keys.forEach((key) => {
      if (key.x5c) {
        key.x5c = key.x5c.map((cert) => cert.replace(/\n/g, ""));
      }
    });

    // Return the cleaned-up JWKS response to the client
    res.setHeader("Content-Type", "application/json");
    res.send(jwks);
  } catch (error) {
    console.error("Error fetching JWKS:", error.message);
    res.status(500).send({ error: "Error fetching JWKS" });
  }
});

// Default route for testing
app.get("/", (req, res) => {
  res.send("OIDC Proxy for ID.me is running!");
});

// Start the server
app.listen(port, () => {
  console.log(`Proxy server is running on port ${port}`);
});
