/*APPELS*/
const fs = require('fs'); /*Appelle FS*/
const Sauce = require('../models/sauce'); /*Appelle le schéma "Sauce"*/


/*CONTRÔLEURS*/
exports.postNewSauce = (req, res) => { /*Crée et exporte le contrôleur "Sauce.postNewSauce"*/
    const sauceObject = Object.getPrototypeOf(req.body) === null ? JSON.parse(req.body.sauce) : req.body; /*Parse le contenu de la requête pour qu'elle puisse être envoyée par le frontend*/

    for (let key in req.body) {
        if (key !== 'sauce' && key !== 'name' && key !== 'manufacturer' && key !== 'description' && key !== "heat") {
            return res.status(403).json({ message: 'Unexpected form' })
        }
    }

    if (req.body.heat < 1 || req.body.heat > 10) {
        return res.status(403).json({ message: 'Heat must be between 1 and 10' })
    }

    Sauce.findOne({ name: sauceObject.name }, (error, sauce) => {
        if (error) {
            res.status(500).json({ error })
        }
        else if (sauce) {
            res.status(403).json({ message: `The sauce '${sauceObject.name}' already exists` })
        }
        else {
            if (req.file === undefined) {
                req.file = {
                    filename: ''
                }
            }

            if (/^[^<>≤≥«» ↓¬,?¿;.×:/÷!§¡%´*`€^¨$£²¹~"{(|`_@=+)}\[\]\\]{1,12}$/.test(sauceObject.name) && /^[^\<>≤≥«» ↓¬,?¿;.×:/÷!§¡%´*`€^¨$£²¹~"#{(|`_@°=+)}\[\]\\]{1,20}$/.test(sauceObject.manufacturer) && /^[^<>≤≥«» ↓¬¿×÷§¡´*`€^¨$£²¹~{|`_@=+}\[\]\\]{1,250}$/.test(sauceObject.description)) {
                const sauce = new Sauce({ /*Crée une sauce selon le schéma "Sauce"...*/
                    ...sauceObject, /*...constituée des informations renseignées dans le formulaire...*/
                    email: req.auth.email, /*...et à laquelle on intègre l'identifiant utilisateur authentifié par le token...*/
                    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`, /*...l'URL complète de l'image...*/
                });

                sauce.save() /*Sauvegarde la nouvelle sauce sur MongoDB*/

                    .then(() => res.status(201).json({ message: `The sauce '${sauceObject.name}' has been created` }))
                    .catch(error => res.status(500).json({ error }));
            }
            else {
                if (!/^[^<>≤≥«» ↓¬,?¿;.×:/÷!§¡%´*`€^¨$£²¹~"{(|`_@=+)}\[\]\\]{1,12}$/.test(sauceObject.name)) {
                    res.status(403).json({ message: "The sauce's name is too long or contains unauthorized characters" })
                }
                else if (!/^[^<>≤≥«» ↓¬,?¿;.×:/÷!§¡%´*`€^¨$£²¹~"#{(|`_@°=+)}\[\]\\]{1,20}$/.test(sauceObject.manufacturer)) {
                    res.status(403).json({ message: "The manufacturer's name is too long or contains unauthorized characters" })
                }
                else if (!/^[^<>≤≥«» ↓¬¿×÷§¡´*`€^¨$£²¹~{|`_@=+}\[\]\\]{1,250}$/.test(sauceObject.description)) {
                    res.status(403).json({ message: "The description is too long or contains unauthorized characters" })
                }
            }
        }
    })
};
/*-------------------------------------------------------------------------------------------------------------------*/
exports.getAllSauces = (req, res) => { /*Crée et exporte le contrôleur "Sauce.getAllSauces"...*/
    Sauce.find() /*...qui va chercher toutes les sauces qui ont été ajoutées à la base de données...*/

        .then(sauces => res.status(200).json(sauces)) /*...et les renvoie au frontend*/
        .catch(error => res.status(500).json({ error }));
};
/*-------------------------------------------------------------------------------------------------------------------*/
exports.getOneSauce = (req, res) => { /*Crée et exporte le contrôleur "Sauce.getOneSauce"...*/
    Sauce.findOne({ _id: req.params.id }) /*...qui récupère la sauce correspondant à l'identifiant présent dans la requête...*/

        .then(sauce => {
            if (sauce === null) {
                res.status(404).json({ message: 'This sauce does not exist' });
            }
            else {
                res.status(200).json(sauce) /*...et la renvoie au frontend*/
            }
        })
        .catch(() => res.status(404).json({ message: `This sauce does not exist` }));
};
/*-------------------------------------------------------------------------------------------------------------------*/
exports.modifySauce = (req, res) => { /*Crée et exporte le contrôleur "Sauce.modifySauce"...*/
    const sauceObject = Object.getPrototypeOf(req.body) === null ? JSON.parse(req.body.sauce) : req.body;

    for (let key in req.body) {
        if (key !== 'sauce' && key !== 'name' && key !== 'manufacturer' && key !== 'description' && key !== "heat" && key !== "email") {
            return res.status(403).json({ message: 'Unexpected form' })
        }
    }

    if (req.body.heat < 1 || req.body.heat > 10) {
        return res.status(403).json({ message: 'Heat must be between 1 and 10' })
    }

    Sauce.findOne({ _id: req.params.id })

        .then(sauce => {
            if (sauce === null) {
                res.status(404).json({ message: 'This sauce does not exist' });
            }
            else {
                Sauce.findOne({ _id: { $ne: req.params.id }, name: sauceObject.name }, (error, sauce) => {
                    if (error) {
                        res.status(500).json({ error })
                    }
                    else if (sauce) {
                        res.status(403).json({ message: `The sauce '${sauceObject.name}' already exists` })
                    }
                    else {
                        if (req.file === undefined) {
                            req.file = {
                                filename: ''
                            }
                        }

                        Sauce.findOne({ _id: req.params.id }) /*...qui recherche dans la base de données la sauce correspondant à l'identifiant présent dans la requête*/

                            .then(sauce => {

                                if (sauce.email !== req.auth.email) { /*Si l'identifiant du requérant est différent de celui qui a créé la sauce...*/
                                    res.status(401).json({ message: 'This sauce is not yours' }); /*...l'action n'est pas autorisée*/
                                }
                                else if (/^[^<>≤≥«» ↓¬,?¿;.×:/÷!§¡%´*`€^¨$£²¹~"{(|`_@=+)}\[\]\\]{1,12}$/.test(sauceObject.name) && /^[^\<>≤≥«» ↓¬,?¿;.×:/÷!§¡%´*`€^¨$£²¹~"#{(|`_@°=+)}\[\]\\]{1,20}$/.test(sauceObject.manufacturer) && /^[^<>≤≥«» ↓¬¿×÷§¡´*`€^¨$£²¹~{|`_@=+}\[\]\\]{1,250}$/.test(sauceObject.description)) {
                                    const filename = sauce.imageUrl.split('/images/')[1];

                                    const sauceNew = req.body.sauce ? { /*Crée une sauce selon le schéma "Sauce"...*/
                                        ...sauceObject, /*...constituée des informations renseignées dans le formulaire...*/
                                        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`, /*...l'URL complète de l'image...*/
                                    } : {
                                        ...sauceObject
                                    };

                                    fs.unlink(`images/${filename}`, () => {
                                        Sauce.updateOne({ _id: req.params.id }, { ...sauceNew, _id: req.params.id }) /*La sauce correspondant à l'identifiant présent dans la requête est ensuite modifiée d'après le contenu de l'objet variable*/

                                            .then(() => res.status(200).json({ message: `The sauce '${sauce.name}' has been modified` }))
                                            .catch(error => res.status(500).json({ error }));
                                    })
                                }
                                else {
                                    if (!/^[^<>≤≥«» ↓¬,?¿;.×:/÷!§¡%´*`€^¨$£²¹~"{(|`_@=+)}\[\]\\]{1,12}$/.test(sauceObject.name)) {
                                        res.status(403).json({ message: "The sauce's name is too long or contains unauthorized characters" })
                                    }
                                    else if (!/^[^<>≤≥«» ↓¬,?¿;.×:/÷!§¡%´*`€^¨$£²¹~"#{(|`_@°=+)}\[\]\\]{1,20}$/.test(sauceObject.manufacturer)) {
                                        res.status(403).json({ message: "The manufacturer's name is too long or contains unauthorized characters" })
                                    }
                                    else if (!/^[^<>≤≥«» ↓¬¿×÷§¡´*`€^¨$£²¹~{|`_@=+}\[\]\\]{1,250}$/.test(sauceObject.description)) {
                                        res.status(403).json({ message: "The description is too long or contains unauthorized characters" })
                                    }
                                }
                            })
                            .catch(() => res.status(404).json({ message: `This sauce does not exist` }));
                    }
                })
            }
        })
        .catch(() => res.status(404).json({ message: 'This sauce does not exist' }));
};
/*-------------------------------------------------------------------------------------------------------------------*/
exports.deleteSauce = (req, res) => { /*Crée et exporte le contrôleur "Sauce.deleteSauce"...*/
    Sauce.findOne({ _id: req.params.id }) /*...qui recherche dans la base de données la sauce correspondant à l'identifiant présent dans la requête*/

        .then(sauce => {
            if (sauce.email !== req.auth.email) { /*Si l'identifiant du requérant est différent de celui qui a créé la sauce...*/
                res.status(401).json({ message: 'This sauce is not yours' }); /*...l'action n'est pas autorisée*/
            }
            else {
                const filename = sauce.imageUrl.split('/images/')[1]; /*Sinon le contrôleur cible dans le dossier images le fichier associé à cette sauce...*/

                fs.unlink(`images/${filename}`, () => { /*...et utilise la méthode "Unlink" de FS pour supprimer ce fichier...*/
                    Sauce.deleteOne({ _id: req.params.id }) /*...avant de supprimer la sauce de la base de données*/

                        .then(() => res.status(200).json({ message: `The sauce '${sauce.name}' has been deleted` }))
                        .catch(error => res.status(500).json({ error }));
                });
            }
        })
        .catch(() => res.status(404).json({ message: `This sauce does not exist` }));
};
/*-------------------------------------------------------------------------------------------------------------------*/
exports.likeSauce = (req, res) => { /*Crée et exporte le contrôleur "Sauce.likeSauce"*/
    let likeStatus = req.body.like;

    for (let key in req.body) {
        if (key !== 'like' && key !== 'email' || (likeStatus !== 1 && likeStatus !== -1 && likeStatus !== 0)) {
            return res.status(403).json({ message: 'Unexpected form' })
        }
    }

    if (likeStatus === 1) { /*Si l'utilisateur clique sur le bouton "Like"...*/
        Sauce.findOne({ _id: req.params.id })

            .then(sauce => {

                const userFoundLike = sauce.usersLiked.find(email => email === req.auth.email); /*...une fonction recherche l'identifiant de l'utilisateur dans le tableau "UsersLiked"...*/
                const userFoundDislike = sauce.usersDisliked.find(email => email === req.auth.email); /*...et une autre dans le tableau "UsersDisliked"...*/

                if (userFoundLike !== undefined) { /*Si l'identifiant du requérant est trouvé dans le tableau "UsersLiked"...*/
                    return res.status(403).json({ message: "You can't like a sauce more than once" }); /*...l'action n'est pas autorisée*/
                }
                if (userFoundDislike !== undefined) { /*Si l'identifiant du requérant est trouvé dans le tableau "UsersDisliked"...*/
                    Sauce.updateOne({ _id: req.params.id }, { $inc: { dislikes: -1 }, $pull: { usersDisliked: req.auth.email } }) /*Si l'identifiant du requérant n'est trouvé dans aucun tableau, le nombre de likes de la sauce est augmenté de 1 dans la base de données, et l'identifiant de l'utilisateur est ajouté au tableau "UsersLiked"*/

                        .then(() => {
                            Sauce.updateOne({ _id: req.params.id }, { $inc: { likes: +1 }, $push: { usersLiked: req.auth.email } }) /*Si l'identifiant du requérant n'est trouvé dans aucun tableau, le nombre de likes de la sauce est augmenté de 1 dans la base de données, et l'identifiant de l'utilisateur est ajouté au tableau "UsersLiked"*/

                                .then(() => res.status(200).json({ message: `You just liked the sauce '${sauce.name}'` }))
                                .catch(error => res.status(500).json({ error }));
                        })
                        .catch(error => res.status(500).json({ error }));
                }
                else {
                    Sauce.updateOne({ _id: req.params.id }, { $inc: { likes: +1 }, $push: { usersLiked: req.auth.email } }) /*Si l'identifiant du requérant n'est trouvé dans aucun tableau, le nombre de likes de la sauce est augmenté de 1 dans la base de données, et l'identifiant de l'utilisateur est ajouté au tableau "UsersLiked"*/

                        .then(() => res.status(200).json({ message: `You just liked the sauce '${sauce.name}'` }))
                        .catch(error => res.status(500).json({ error }));
                }
            })
            .catch(() => res.status(404).json({ message: "This sauce does not exist" }));
    }
    else if (likeStatus === -1) { /*Si l'utilisateur clique sur le bouton "Dislike"...*/
        Sauce.findOne({ _id: req.params.id })

            .then(sauce => {

                const userFoundDislike = sauce.usersDisliked.find(email => email === req.auth.email); /*...une fonction recherche l'identifiant de l'utilisateur dans le tableau "UsersDisliked"...*/
                const userFoundLike = sauce.usersLiked.find(email => email === req.auth.email); /*...et une autre dans le tableau "UsersLiked"*/

                if (userFoundDislike !== undefined) { /*Si l'identifiant du requérant est trouvé dans le tableau "UsersDisliked"...*/
                    return res.status(403).json({ message: "You can't dislike a sauce more than once" }); /*...l'action n'est pas autorisée*/
                }
                if (userFoundLike !== undefined) { /*Si l'identifiant du requérant est trouvé dans le tableau "UsersLiked"...*/
                    Sauce.updateOne({ _id: req.params.id }, { $inc: { likes: -1 }, $pull: { usersLiked: req.auth.email } })

                        .then(() => {
                            Sauce.updateOne({ _id: req.params.id }, { $inc: { dislikes: +1 }, $push: { usersDisliked: req.auth.email } }) /*Si l'identifiant du requérant n'est trouvé dans aucun tableau, le nombre de dislikes de la sauce est augmenté de 1 dans la base de données, et l'identifiant de l'utilisateur est ajouté au tableau "UsersDisliked"*/

                                .then(() => res.status(200).json({ message: `You just disliked the sauce '${sauce.name}'` }))
                                .catch(error => res.status(500).json({ error }));
                        })
                        .catch(error => res.status(500).json({ error }));
                }
                else {
                    Sauce.updateOne({ _id: req.params.id }, { $inc: { dislikes: +1 }, $push: { usersDisliked: req.auth.email } }) /*Si l'identifiant du requérant n'est trouvé dans aucun tableau, le nombre de dislikes de la sauce est augmenté de 1 dans la base de données, et l'identifiant de l'utilisateur est ajouté au tableau "UsersDisliked"*/

                        .then(() => res.status(200).json({ message: `You just disliked the sauce '${sauce.name}'` }))
                        .catch(error => res.status(500).json({ error }));
                }
            })
            .catch(() => res.status(404).json({ message: "This sauce does not exist" }));
    }
    else if (likeStatus === 0) { /*Si l'utilisateur reclique sur le bouton "Like" ou le bouton "Dislike" pour annuler son choix...*/
        Sauce.findOne({ _id: req.params.id })

            .then(sauce => {

                const userFoundLike = sauce.usersLiked.find(email => email === req.auth.email); /*...une fonction recherche l'identifiant de l'utilisateur dans le tableau "UsersLiked"*/
                const userFoundDislike = sauce.usersDisliked.find(email => email == req.auth.email); /*...et une autre dans le tableau "UsersDisliked"...*/

                if (userFoundLike !== undefined) { /*Si l'identifiant du requérant est trouvé dans le tableau "UsersLiked"...*/
                    Sauce.updateOne({ _id: req.params.id }, { $inc: { likes: -1 }, $pull: { usersLiked: req.auth.email } }) /*...cela signifie qu'il avait préalablement liké la sauce. Le nombre de likes de la sauce est donc diminué de 1 dans la base de données, et l'identifiant de l'utilisateur est retiré du tableau "UsersLiked"*/

                        .then(() => res.status(200).json({ message: "You don't like the sauce anymore" }))
                        .catch(error => res.status(500).json({ error }));
                }
                else if (userFoundDislike !== undefined) { /*Si l'identifiant du requérant est trouvé dans le tableau "UsersDisliked"...*/
                    Sauce.updateOne({ _id: req.params.id }, { $inc: { dislikes: -1 }, $pull: { usersDisliked: req.auth.email } }) /*...cela signifie qu'il avait préalablement disliké la sauce. Le nombre de dislikes de la sauce est donc diminué de 1 dans la base de données, et l'identifiant de l'utilisateur est retiré du tableau "UsersDisliked"*/

                        .then(() => res.status(200).json({ message: "You don't dislike the sauce anymore" }))
                        .catch(error => res.status(500).json({ error }));
                }
                else { /*Si l'identifiant du requérant n'est trouvé dans aucun tableau...*/
                    res.status(403).json({ message: "The sauce was neither liked nor disliked" }) /*...renvoie un message d'erreur*/
                };
            })
            .catch(() => res.status(404).json({ message: "This sauce does not exist" }));
    };
};