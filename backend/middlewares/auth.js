/*APPELS*/
const jwt = require('jsonwebtoken'); /*Appelle JsonWebToken*/

/*EXPORT*/
module.exports = (req, res, next) => { /*Exporte une fonction...*/
    try {
        const token = req.headers.authorization.split(' ')[1]; /*...qui récupère le token crypté dans l'en-tête "Autorisation" de chaque requête...*/
        const decodedToken = jwt.verify(token, process.env.TOKEN_KEY); /*...puis le décrypte grâce à la méthode "Vérifier" de JsonWebToken...*/
        const email = decodedToken.email; /*...afin d'en extraire l'identifiant unique de l'utilisateur...*/

        req.auth = { email: email }; /*...qui est finalement intégré à la requête comme clé d'authentification*/
        next();
    }
    catch (error) {
        res.status(401).json({ message: "Invalid token" });
    }
};