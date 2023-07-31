/*APPELS*/
const bcrypt = require('bcrypt'); /*Appelle Bcrypt*/
const jwt = require('jsonwebtoken'); /*Appelle JsonWebToken*/
const User = require('../models/user'); /*Appelle le schéma "User"*/


/*CONTRÔLEURS*/
exports.signup = (req, res) => { /*Crée et exporte le contrôleur "User.signup"*/
    for (let key in req.body) {
        if (key !== 'email' && key !== 'password') {
            return res.status(403).json({ message: 'Unexpected form' })
        }
    }

    if (/^([a-z0-9\.-]{1,20})@([a-z]{1,8})\.([a-z]{2,3})$/.test(req.body.email) && /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,30}$/.test(req.body.password)) {
        bcrypt.hash(req.body.password, 10) /*Utilise la méthode "Hash" de Bcrypt pour crypter le mot de passe renseigné...*/

            .then(hash => {
                const user = new User({ /*...puis crée un utilisateur selon le schéma "User"...*/
                    email: req.body.email, /*...dont l'email sera celui renseigné...*/
                    password: hash /*...et le mot de passe le résultat du hash*/
                });

                user.save() /*Sauvegarde le nouvel utilisateur sur MongoDB*/
                    .then(() => res.status(201).json({ message: `The user '${req.body.email}' has been created` }))
                    .catch(() => res.status(403).json({ message: `The email address '${req.body.email}' is already used` }));
            })
            .catch(error => res.status(500).json({ error }));
    }
    else {
        if (!/^([a-z0-9\.-]{1,20})@([a-z]{1,8})\.([a-z]{2,3})$/.test(req.body.email)) {
            res.status(403).json({ message: "Please enter a valid email address" })
        }
        else if (req.body.password.length >= 30) {
            res.status(403).json({ message: "Your password is too long (maximum 30 characters)" })
        }
        else {
            res.status(403).json({ message: "Please enter a strong password (at least 8 characters, one uppercase, one lowercase, one number and one special character)" })
        }
    }
};
/*-------------------------------------------------------------------------------------------------------------------*/
exports.login = (req, res) => { /*Crée et exporte le contrôleur "User.login"*/
    for (let key in req.body) {
        if (key !== 'email' && key !== 'password') {
            return res.status(403).json({ message: 'Unexpected form' })
        }
    }

    if (req.body.password.length >= 30) {
        res.status(403).json({ message: "Incorrect password" })
    }

    else if (/^([a-z0-9\.-]{1,20})@([a-z]{1,8})\.([a-z]{2,3})$/.test(req.body.email)) {

        User.findOne({ email: req.body.email }) /*Utilise la fonction "FindOne" pour chercher dans la base de données l'email renseigné*/

            .then(user => {
                bcrypt.compare(req.body.password, user.password) /*...utilise la méthode "Compare" de Bcrypt pour comparer le mot de passe renseigné à celui associé à l'utilisateur*/

                    .then(valid => {
                        if (!valid) { /*Si le mot de passe est invalide...*/
                            res.status(401).json({ message: 'Wrong password' }); /*...renvoie un message d'erreur*/
                        }
                        else { /*Si le mot de passe est valide...*/
                            res.status(200).json({ /*...renvoie un objet "user"...*/
                                message: `The user '${req.body.email}' is now connected`,
                                token: jwt.sign( /*...et un token encodant...*/
                                    { email: user.email }, /*...cet identifiant unique...*/
                                    process.env.TOKEN_KEY, /*...grâce à une clé secrète...*/
                                    { expiresIn: '1h' } /*...et valable 1 heure*/
                                )
                            });
                        }
                    })
                    .catch(error => { res.status(500).json({ error }) })
            })
            .catch(() => {
                res.status(404).json({ message: `The user '${req.body.email}' does not exist` });
            })
    }
    else {
        res.status(403).json({ message: "Incorrect email address" })
    }
}