const jwt = require("jsonwebtoken")

const secretKey = "SuperSecret"

exports.checkAdmin = function (req, res, next) {
    console.log("== requireAuthentication()")
    const authHeader = req.get("Authorization") || ""
    const authHeaderParts = authHeader.split(" ")
    const token = authHeaderParts[0] === "Bearer" ?
        authHeaderParts[1] : null
    console.log("  -- token:", token)
    try {
        const payload = jwt.verify(token, secretKey)
        console.log("  -- payload:", payload)
        console.log("  -- payload.sub:", payload.sub)
        req.user = payload.sub[0]
        req.admin=payload.sub[1]
        next()
    } catch (err) {
        req.admin=false
        console.error("== Error verifying token:", err)
        res.status(401).send({
            error: "Cannot create an admin without being an admin"
        })
    }
}

exports.requireAuthentication = function (req, res, next) {
    console.log("== requireAuthentication()")
    const authHeader = req.get("Authorization") || ""
    const authHeaderParts = authHeader.split(" ")
    const token = authHeaderParts[0] === "Bearer" ?
        authHeaderParts[1] : null
    console.log("  -- token:", token)
    try {
        const payload = jwt.verify(token, secretKey)
        console.log("  -- payload:", payload)
        console.log("  -- payload.sub:", payload.sub)
        req.user = payload.sub[0]
        req.admin=payload.sub[1]
        next()
    } catch (err) {
        console.error("== Error verifying token:", err)
        res.status(401).send({
            error: "Invalid authentication token"
        })
    }
}