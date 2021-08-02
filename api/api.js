const express = require('express');
const bodyParser = require("body-parser");
const crypto = require('crypto');
const mysql = require('mysql');
const cors = require('cors');
const nodemailer = require("nodemailer");
const session = require("express-session");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "voto-eletronico"
});

db.connect(err => {
    if (err) {
        throw err
    } else {
        console.log("Conectado à DB!")
    }
})


const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());
app.use(session({
    secret: 'votoeletronico',
}));


app.post('/get_docs', (req, res) => {
    let sql = 'SELECT * FROM document_type';
    db.query(sql, (err, results) => {
        if (err) {
            throw err
        } else {
            return res.json({ success: true, obj: results });
        }
    })
});

app.post('/user_verify', (req, res) => {
    let pw_md5 = crypto.createHash('md5').update(req.body.user_password).digest("hex");
    let sql = "SELECT * FROM users WHERE user_nmri='" + req.body.user_nmri + "' AND user_password='" + pw_md5 + "' AND doc_id='" + req.body.doc_id + "' AND user_role='0'";
    db.query(sql, (err, results) => {
        if (err) {
            throw err
        } else {
            if (results == 0) {
                return res.json({ exist: false });
            } else {
                var current_date = (new Date()).valueOf().toString();
                var random = Math.random().toString();
                let user_key = crypto.createHash('md5').update(current_date + random).digest('hex');
                let sql = "UPDATE users SET user_key ='" + user_key + "' WHERE user_nmri='" + req.body.user_nmri + "' AND user_password='" + pw_md5 + "' AND doc_id='" + req.body.doc_id + "' AND user_role='0'";
                db.query(sql, (err, results) => {
                    if (err) {
                        throw err
                    } else {
                        let sql = "SELECT * FROM users WHERE user_nmri='" + req.body.user_nmri + "' AND user_password='" + pw_md5 + "' AND doc_id='" + req.body.doc_id + "' AND user_role='0'";
                        db.query(sql, (err, results) => {
                            if (err) {
                                throw err
                            } else {
                                const string = JSON.stringify(results);
                                const json = JSON.parse(string);
                                const email = json[0].user_email;
                                const key = json[0].user_key;

                                let transporter = nodemailer.createTransport({
                                    host: "voto-eletronico.jbr-projects.pt",
                                    port: 465,
                                    secure: true, // true for 465, false for other ports
                                    auth: {
                                        user: 'geral@voto-eletronico.jbr-projects.pt', // generated ethereal user
                                        pass: 'voto_hj12345', // generated ethereal password
                                    },
                                });

                                const options = {
                                    from: 'geral@voto-eletronico.jbr-projects.pt',
                                    to: email, // list of receivers
                                    subject: "Palavra-Chave de Segurança para iniciar a sessão", // Subject line
                                    text: "A sua chave de segurança para iniciar sessao: " + key
                                }

                                transporter.sendMail(options, function (err, info) {
                                    if (err) {
                                        console.log(err);
                                        return;
                                    }
                                    console.log("Email enviado para: " + email);
                                });
                                return res.json({ exist: true, obj: results });
                            }
                        })
                    }
                })
            }
        }
    })
});

app.post('/user_login', (req, res) => {
    let pw_md5 = crypto.createHash('md5').update(req.body.user_password).digest("hex");
    let sql = "SELECT * FROM users WHERE user_nmri='" + req.body.user_nmri + "' AND user_password='" + pw_md5 + "' AND doc_id='" + req.body.doc_id + "' AND user_role='0' AND user_key='" + req.body.user_key + "'";
    db.query(sql, (err, results) => {
        if (err) {
            throw err
        } else {
            if (results == 0) {
                return res.json({ exist: false });
            } else {
                const string = JSON.stringify(results);
                const json = JSON.parse(string);
                req.session.user = json;
                return res.json({ exist: true, obj: req.session });
            }
        }
    })
});

app.post('/get_user_details', (req, res) => {
    let sql = "SELECT * FROM users WHERE user_key='" + req.body.key_session + "'";
    db.query(sql, (err, results) => {
        if (err) {
            throw err
        } else {
            return res.json({ success: true, obj: results });
        }
    })
});

app.post('/get_events_available', (req, res) => {
    var today = new Date();
    if (today.getMonth() + 1 < 10) {
        if (today.getDate() < 10) {
            var date_string = today.getFullYear() + "-0" + (today.getUTCMonth() + 1) + "-0" + today.getDate();
        } else {
            var date_string = today.getFullYear() + "-0" + (today.getUTCMonth() + 1) + "-" + today.getDate();
        }
    } else {
        if (today.getDate() < 10) {
            var date_string = today.getFullYear() + "-" + (today.getUTCMonth() + 1) + "-0" + today.getDate();
        } else {
            var date_string = today.getFullYear() + "-" + (today.getUTCMonth() + 1) + "-" + today.getDate();
        }
    }
    let doc_id = req.body.doc_id;
    let sql = "SELECT * FROM events WHERE doc_id='" + doc_id + "' AND event_date_ini < '" + date_string + "'  AND event_date_exp > '" + date_string + "'";
    db.query(sql, (err, results) => {
        if (err) {
            throw err
        } else {
            return res.json({ success: true, obj: results });
        }
    })
});

app.post('/get_next_events', (req, res) => {
    var today = new Date();
    if (today.getMonth() + 1 < 10) {
        if (today.getDate() < 10) {
            var date_string = today.getFullYear() + "-0" + (today.getUTCMonth() + 1) + "-0" + today.getDate();
        } else {
            var date_string = today.getFullYear() + "-0" + (today.getUTCMonth() + 1) + "-" + today.getDate();
        }
    } else {
        if (today.getDate() < 10) {
            var date_string = today.getFullYear() + "-" + (today.getUTCMonth() + 1) + "-0" + today.getDate();
        } else {
            var date_string = today.getFullYear() + "-" + (today.getUTCMonth() + 1) + "-" + today.getDate();
        }
    }
    let doc_id = req.body.doc_id;
    let sql = "SELECT * FROM events WHERE doc_id='" + doc_id + "' AND event_date_ini > '" + date_string + "'";
    db.query(sql, (err, results) => {
        if (err) {
            throw err
        } else {
            return res.json({ success: true, obj: results });
        }
    })
});

app.post('/get_past_events', (req, res) => {
    var today = new Date();
    if (today.getMonth() + 1 < 10) {
        if (today.getDate() < 10) {
            var date_string = today.getFullYear() + "-0" + (today.getUTCMonth() + 1) + "-0" + today.getDate();
        } else {
            var date_string = today.getFullYear() + "-0" + (today.getUTCMonth() + 1) + "-" + today.getDate();
        }
    } else {
        if (today.getDate() < 10) {
            var date_string = today.getFullYear() + "-" + (today.getUTCMonth() + 1) + "-0" + today.getDate();
        } else {
            var date_string = today.getFullYear() + "-" + (today.getUTCMonth() + 1) + "-" + today.getDate();
        }
    }
    let doc_id = req.body.doc_id;
    let sql = "SELECT * FROM events WHERE doc_id='" + doc_id + "' AND event_date_exp < '" + date_string + "'";
    db.query(sql, (err, results) => {
        if (err) {
            throw err
        } else {
            return res.json({ success: true, obj: results });
        }
    })
});

app.post('/get_votes_user', (req, res) => {
    let sql = "SELECT * FROM votes WHERE user_id='" + req.body.user_id + "'";
    db.query(sql, (err, results) => {
        if (err) {
            throw err
        } else {
            return res.json({ success: true, obj: results });
        }
    })
});

app.post('/get_candidates_event', (req, res) => {
    let sql = "SELECT * FROM events_candidates as ec INNER JOIN candidates as c ON ec.candidate_id=c.candidate_id AND  ec.event_id = '" + req.body.event_id + "' ORDER BY c.candidate_name ASC ,c.candidate_entourage ASC";
    db.query(sql, (err, results) => {
        if (err) {
            throw err
        } else {
            return res.json({ success: true, obj: results });
        }
    })
});

app.post('/save_user_vote', (req, res) => {
    var current_date = (new Date()).valueOf().toString();
    var random = Math.random().toString();
    let vote_key = crypto.createHash('md5').update(current_date + random).digest('hex');
    let sql = "INSERT INTO votes(user_id, event_id, candidate_id, vote_key) VALUES ('" + req.body.user_id + "', '" + req.body.event_id + "','" + req.body.candidate_id + "', '" + vote_key + "')";
    db.query(sql, (err, results) => {
        if (err) {
            throw err
        } else {
            if (req.body.candidate_id > 0) {
                let query = "SELECT * FROM votes as v JOIN events as e JOIN candidates as c WHERE v.event_id=e.event_id AND v.candidate_id=c.candidate_id AND v.user_id='" + req.body.user_id + "'AND e.event_id='" + req.body.event_id + "'"
                db.query(query, (err, results2) => {
                    if (err) {
                        throw err
                    } else {
                        const string = JSON.stringify(results2);
                        const json = JSON.parse(string);
                        let transporter = nodemailer.createTransport({
                            host: "voto-eletronico.jbr-projects.pt",
                            port: 465,
                            secure: true, // true for 465, false for other ports
                            auth: {
                                user: 'geral@voto-eletronico.jbr-projects.pt', // generated ethereal user
                                pass: 'voto_hj12345', // generated ethereal password
                            },
                        });

                        const options = {
                            from: 'geral@voto-eletronico.jbr-projects.pt',
                            to: req.body.user_email, // list of receivers
                            subject: "Confirmação dos Dados do Voto", // Subject line
                            text: "O seu voto foi submetido com sucesso.\n\nDados do Voto: \n\nTítulo do Evento: " + json[0].event_title + " \nNome do Candidato: " + json[0].candidate_name + " \nCódigo de voto: " + json[0].vote_key + ""
                        }

                        transporter.sendMail(options, function (err, info) {
                            if (err) {
                                console.log(err);
                                return;
                            }
                            console.log("Email enviado para: " + email);
                        });
                        return res.json({ success: true, obj: results });
                    }
                })
            } else {
                let query = "SELECT * FROM votes as v JOIN events as e WHERE v.event_id=e.event_id AND v.user_id='" + req.body.user_id + "'"
                db.query(query, (err, results2) => {
                    if (err) {
                        throw err
                    } else {
                        const string = JSON.stringify(results2);
                        const json = JSON.parse(string);
                        let transporter = nodemailer.createTransport({
                            host: "voto-eletronico.jbr-projects.pt",
                            port: 465,
                            secure: true, // true for 465, false for other ports
                            auth: {
                                user: 'geral@voto-eletronico.jbr-projects.pt', // generated ethereal user
                                pass: 'voto_hj12345', // generated ethereal password
                            },
                        });

                        const options = {
                            from: 'geral@voto-eletronico.jbr-projects.pt',
                            to: req.body.user_email, // list of receivers
                            subject: "Confirmação dos Dados do Voto", // Subject line
                            text: "O seu voto foi submetido com sucesso.\n\nDados do Voto: \n\nTítulo do Evento: " + json[0].event_title + " \nNome do Candidato: Voto em Branco \nCódigo de voto: " + json[0].vote_key + ""
                        }

                        transporter.sendMail(options, function (err, info) {
                            if (err) {
                                console.log(err);
                                return;
                            }
                            console.log("Email enviado para: " + email);
                        });
                        return res.json({ success: true, obj: results });
                    }
                })
            }
        }
    })
});

app.post('/get_results_event', (req, res) => {
    let sql = "SELECT COUNT(*) as n_votes FROM votes WHERE event_id='" + req.body.event_id + "'";
    db.query(sql, (err, results) => {
        if (err) {
            throw err
        } else {
            const string = JSON.stringify(results);
            const json = JSON.parse(string);
            let n_votes = json[0].n_votes;
            let sql = "SELECT COUNT(*) as n_users FROM users AS u LEFT OUTER JOIN events AS e ON u.doc_id=e.doc_id WHERE e.doc_id='" + req.body.doc_id + "' AND e.event_id='" + req.body.event_id + "'";
            db.query(sql, (err, results) => {
                if (err) {
                    throw err
                } else {
                    const string = JSON.stringify(results);
                    const json = JSON.parse(string);
                    let n_users = json[0].n_users;
                    let no_votes = n_users - n_votes;
                    let sql = "SELECT c.candidate_id, c.candidate_name,c.candidate_entourage, COUNT(*) AS n_votos FROM votes as v LEFT JOIN candidates as c ON c.candidate_id=v.candidate_id WHERE event_id='" + req.body.event_id + "' GROUP BY v.candidate_id ORDER BY n_votos DESC";
                    db.query(sql, (err, results) => {
                        if (err) {
                            throw err
                        } else {
                            return res.json({ success: true, obj: results, nullvotes: no_votes });
                        }
                    })
                }
            })
        }
    })
});

app.post('/check_user_pw', (req, res) => {
    let pw_md5 = crypto.createHash('md5').update(req.body.user_password).digest("hex");
    let sql = "SELECT * FROM users WHERE user_id='" + req.body.user_id + "' AND user_password ='" + pw_md5 + "'";
    db.query(sql, (err, results) => {
        if (err) {
            throw err
        } else {
            if (results.length > 0) {
                return res.json({ success: true, obj: results });
            } else {
                return res.json({ success: false, obj: results });
            }

        }
    })
});

app.post('/change_user_pw', (req, res) => {
    let pw_md5 = crypto.createHash('md5').update(req.body.user_password).digest("hex");
    let sql = "UPDATE users SET user_password='" + pw_md5 + "' WHERE user_id = '" + req.body.user_id + "'";
    db.query(sql, err => {
        if (err) {
            return res.json({ success: false });
        } else {
            return res.json({ success: true });

        }
    })
});

app.post('/user_check_email_pw_recover', (req, res) => {
    let sql = "SELECT * FROM users WHERE user_email='" + req.body.user_email + "' AND user_role='0'";
    db.query(sql, (err, results) => {
        if (err) {
            return res.json({ success: false });
        } else {
            return res.json({ success: true, obj: results });

        }
    })
});

app.post('/user_pw_generate_link_recover', (req, res) => {
    let sql = "SELECT * FROM users WHERE user_email='" + req.body.user_email + "' AND user_role='0'";
    db.query(sql, (err, results) => {
        if (err) {
            return res.json({ success: false });
        } else {
            var pad = function (num) { return ('00' + num).slice(-2) };
            var exp_date_final;
            var exp_date_only;
            var exp_time_only;
            exp_date_final = new Date();
            if (exp_date_final.getHours() == 23) {
                exp_date_final.setHours(0);
                exp_date_only = exp_date_final.getFullYear() + '-' +
                    pad(exp_date_final.getMonth() + 1) + '-' +
                    pad(exp_date_final.getDate());
                exp_time_only = pad(exp_date_final.getHours()) + ':' +
                    pad(exp_date_final.getMinutes()) + ':' +
                    pad(exp_date_final.getSeconds());
                exp_date_final = exp_date_final.getFullYear() + '-' +
                    pad(exp_date_final.getMonth() + 1) + '-' +
                    pad(exp_date_final.getDate()) + ' ' +
                    pad(exp_date_final.getHours()) + ':' +
                    pad(exp_date_final.getMinutes()) + ':' +
                    pad(exp_date_final.getSeconds());
            } else {
                exp_date_only = exp_date_final.getFullYear() + '-' +
                    pad(exp_date_final.getMonth() + 1) + '-' +
                    pad(exp_date_final.getDate());
                exp_time_only = pad(exp_date_final.getHours() + 1) + ':' +
                    pad(exp_date_final.getMinutes()) + ':' +
                    pad(exp_date_final.getSeconds());
                exp_date_final = exp_date_final.getFullYear() + '-' +
                    pad(exp_date_final.getMonth() + 1) + '-' +
                    pad(exp_date_final.getDate()) + ' ' +
                    pad(exp_date_final.getHours() + 1) + ':' +
                    pad(exp_date_final.getMinutes()) + ':' +
                    pad(exp_date_final.getSeconds());

            }
            var current_date_string = (new Date()).valueOf().toString();
            var random = Math.random().toString();
            let user_key = crypto.createHash('md5').update(current_date_string + random).digest('hex');
            let sql = "UPDATE users SET user_key='" + user_key + "',user_exp_pw_date='" + exp_date_final + "' WHERE user_email='" + req.body.user_email + "' AND user_role='0'";
            db.query(sql, (err, results) => {
                if (err) {
                    return res.json({ success: false });
                } else {
                    let link_recover = "http://localhost:4200/recover-password/" + req.body.user_email + "/" + user_key + "";
                    let transporter = nodemailer.createTransport({
                        host: "voto-eletronico.jbr-projects.pt",
                        port: 465,
                        secure: true, // true for 465, false for other ports
                        auth: {
                            user: 'geral@voto-eletronico.jbr-projects.pt', // generated ethereal user
                            pass: 'voto_hj12345', // generated ethereal password
                        },
                    });

                    const options = {
                        from: 'geral@voto-eletronico.jbr-projects.pt',
                        to: req.body.user_email, // list of receivers
                        subject: "Recuperação da password", // Subject line
                        text: "Aceda ao link em baixo para alterar a sua password:.\n\n" + link_recover + "\n\nNOTA: Este link apenas é válido no espaço de 1 hora!"
                    }

                    transporter.sendMail(options, function (err, info) {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        console.log("Email enviado para: " + req.body.user_email);
                    });
                    return res.json({ success: true, obj: results });

                }
            })
        }
    })
});

app.post('/recover_user_pw', (req, res) => {
    let pw_md5 = crypto.createHash('md5').update(req.body.user_password).digest("hex");
    let sql = "UPDATE users set  user_password='" + pw_md5 + "', user_exp_pw_date='" + null + "' WHERE user_key='" + req.body.user_key + "' AND user_email='" + req.body.user_email + "' AND user_role='0'";
    db.query(sql, (err, results) => {
        if (err) {
            return res.json({ success: false });
        } else {
            return res.json({ success: true });

        }
    })
});

app.post('/get_user_details_recover_pw', (req, res) => {
    let sql = "SELECT * FROM users WHERE user_key='" + req.body.user_key + "' AND user_email='" + req.body.user_email + "'";
    console.log(sql);
    db.query(sql, (err, results) => {
        if (err) {
            throw err
        } else {
            return res.json({ success: true, obj: results });
        }
    })
});

app.listen('3000', () => {
    console.log('Servidor a correr na porta 3000');
})
