require("dotenv").config();


const express = require("express");
const path = require("path");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const { Pool } = require("pg");

const pgSession = require("connect-pg-simple")(session);

const app = express();

const PORT = process.env.PORT || 3000;


/*CONEXÃO COM O POSTGRESQL*/

const pool = new Pool({
    user: "postgres",
    host: "localhost",
    database: "reserva_paroquial",
    password: process.env.DB_PASSWORD,
    port: 5432
});


// ========================================
// MIDDLEWARES
// ========================================

app.use(express.json());

app.use(
    session({
        store: new pgSession({
            pool: pool,
            tableName: "sessoes"
        }),

        secret: process.env.SESSION_SECRET,

        resave: false,

        saveUninitialized: false,

        cookie: {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 1000 * 60 * 60 * 8
        }
    })
);


// ========================================
// TESTE DO POSTGRESQL
// ========================================

pool.query("SELECT NOW()", (erro, resultado) => {

    if (erro) {

        console.error(
            "Erro ao conectar ao PostgreSQL:",
            erro
        );

    } else {

        console.log("PostgreSQL conectado!");

        console.log(
            "Horário do banco:",
            resultado.rows[0].now
        );

    }

});


// ========================================
// VERIFICAR LOGIN
// ========================================

function verificarLogin(req, res, next) {

    if (!req.session.usuario) {

        return res.redirect("/login.html");

    }

    next();
}


// ========================================
// PÁGINAS
// ========================================

app.get("/", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "index.html"
        )
    );

});


app.get("/login.html", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "login.html"
        )
    );

});


app.get("/painel.html", (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            "public",
            "painel.html"
        )
    );

});


// ========================================
// ADMIN PROTEGIDO
// ========================================

app.get(
    "/admin.html",
    verificarLogin,
    (req, res) => {

        res.sendFile(
            path.join(
                __dirname,
                "public",
                "admin.html"
            )
        );

    }
);


// ========================================
// ARQUIVOS PÚBLICOS
// CSS / JS / IMAGENS
// ========================================

app.use(
    express.static(
        path.join(__dirname, "public"),
        {
            index: false
        }
    )
);


// ========================================
// LOGIN
// ========================================

app.post("/login", async (req, res) => {

    const {
        email,
        senha
    } = req.body;


    if (!email || !senha) {

        return res.status(400).json({
            erro: "Informe o e-mail e a senha."
        });

    }


    try {

        const resultado = await pool.query(
            `
            SELECT *
            FROM usuarios
            WHERE email = $1
            `,
            [email]
        );


        if (resultado.rows.length === 0) {

            return res.status(401).json({
                erro: "E-mail ou senha incorretos."
            });

        }


        const usuario = resultado.rows[0];


        const senhaCorreta =
            await bcrypt.compare(
                senha,
                usuario.senha
            );


        if (!senhaCorreta) {

            return res.status(401).json({
                erro: "E-mail ou senha incorretos."
            });

        }


        // Criar sessão

        req.session.usuario = {

            id: usuario.id,

            nome: usuario.nome,

            email: usuario.email

        };


        res.json({

            mensagem:
                "Login realizado com sucesso."

        });


    } catch (erro) {

        console.error(
            "Erro no login:",
            erro
        );


        res.status(500).json({

            erro:
                "Erro interno do servidor."

        });

    }

});


// ========================================
// LOGOUT
// ========================================

app.post(
    "/logout",
    verificarLogin,
    (req, res) => {

        req.session.destroy((erro) => {

            if (erro) {

                console.error(
                    "Erro ao sair:",
                    erro
                );

                return res.status(500).json({

                    erro:
                        "Não foi possível sair."

                });

            }


            res.json({

                mensagem:
                    "Logout realizado com sucesso."

            });

        });

    }
);


// ========================================
// CRIAR RESERVA
// ========================================

app.post("/reservas", async (req, res) => {

    const {
        nome,
        telefone,
        data_reserva,
        horario,
        quantidade_pessoas,
        observacao
    } = req.body;


    // Verificar campos obrigatórios

    if (
        !nome ||
        !data_reserva ||
        !horario ||
        !quantidade_pessoas
    ) {

        return res.status(400).json({

            erro:
                "Preencha os campos obrigatórios."

        });

    }


    // ========================================
    // DEFINIR STATUS PELO SERVIDOR
    // ========================================

    let statusReserva = "pendente";


    if (req.session.usuario) {

        statusReserva = "confirmada";

    }


    try {

        // ========================================
        // VERIFICAR CONFLITO
        // ========================================

        const conflito = await pool.query(
            `
            SELECT id
            FROM reservas

            WHERE data_reserva = $1

            AND horario = $2

            AND status IN (
                'pendente',
                'confirmada'
            )
            `,
            [
                data_reserva,
                horario
            ]
        );


        if (conflito.rows.length > 0) {

            return res.status(409).json({

                erro:
                    "Esse horário já está reservado. Escolha outro horário."

            });

        }


        // ========================================
        // INSERIR RESERVA
        // ========================================

        const resultado = await pool.query(
            `
            INSERT INTO reservas
            (
                nome,
                telefone,
                data_reserva,
                horario,
                quantidade_pessoas,
                observacao,
                status
            )

            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                $7
            )

            RETURNING *
            `,
            [
                nome,
                telefone,
                data_reserva,
                horario,
                quantidade_pessoas,
                observacao,
                statusReserva
            ]
        );


        res.status(201).json({

            mensagem:
                "Reserva criada com sucesso!",

            reserva:
                resultado.rows[0]

        });


    } catch (erro) {

        console.error(
            "Erro ao criar reserva:",
            erro
        );


        res.status(500).json({

            erro:
                "Não foi possível criar a reserva."

        });

    }

});


// ========================================
// LISTAR RESERVAS
// SOMENTE USUÁRIO LOGADO
// ========================================

app.get(
    "/reservas",
    verificarLogin,
    async (req, res) => {

        try {

            const resultado =
                await pool.query(
                    `
                    SELECT *
                    FROM reservas

                    ORDER BY
                        data_reserva ASC,
                        horario ASC
                    `
                );


            res.json(
                resultado.rows
            );


        } catch (erro) {

            console.error(
                "Erro ao buscar reservas:",
                erro
            );


            res.status(500).json({

                erro:
                    "Não foi possível buscar as reservas."

            });

        }

    }
);


// ========================================
// ALTERAR STATUS DA RESERVA
// SOMENTE USUÁRIO LOGADO
// ========================================

app.put(
    "/reservas/:id/status",
    verificarLogin,
    async (req, res) => {

        const {
            id
        } = req.params;


        const {
            status
        } = req.body;


        // Status permitidos

        const statusPermitidos = [

            "pendente",

            "confirmada",

            "recusada",

            "cancelada"

        ];


        if (
            !statusPermitidos.includes(status)
        ) {

            return res.status(400).json({

                erro:
                    "Status inválido."

            });

        }


        try {

            const resultado =
                await pool.query(
                    `
                    UPDATE reservas

                    SET status = $1

                    WHERE id = $2

                    RETURNING *
                    `,
                    [
                        status,
                        id
                    ]
                );


            if (
                resultado.rows.length === 0
            ) {

                return res.status(404).json({

                    erro:
                        "Reserva não encontrada."

                });

            }


            res.json({

                mensagem:
                    "Status atualizado com sucesso!",

                reserva:
                    resultado.rows[0]

            });


        } catch (erro) {

            console.error(
                "Erro ao atualizar status:",
                erro
            );


            res.status(500).json({

                erro:
                    "Não foi possível atualizar o status."

            });

        }

    }
);


// ========================================
// INICIAR SERVIDOR
// ========================================

app.listen(
    PORT,
    () => {

        console.log(
            `Servidor rodando em http://localhost:${PORT}`
        );

    }
);