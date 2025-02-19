/**
 * Checks for API KEY in the header of the request before
 * processing the request
 */

module.exports = (req, res, next) => {
  const APIKEYHeader = req.header("APIKey");
  const authHeader = String(req.headers.authorization);

  if (["prod", "dev", "stage"].includes(process.env.ENVIRONMENT)) {
    const isAPIKeyValid = process.env.APIKEY === (authHeader.includes("APIKey") ? authHeader.split(":")[1] : APIKEYHeader);

    if (!isAPIKeyValid) {
      return res.status(401).json({ status: "Error", message: "APIKey Invalid or not present" });
    }
  }

  next();
};
