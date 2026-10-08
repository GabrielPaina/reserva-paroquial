const listaReservas = document.getElementById("listaReservas");
const mensagem = document.getElementById("mensagem");

const calendario = document.getElementById("calendario");
const mesAtual = document.getElementById("mesAtual");
const mesAnterior = document.getElementById("mesAnterior");
const mesProximo = document.getElementById("mesProximo");

let reservasAtuais = [];
let dataCalendario = new Date();


// ==============================
// CARREGAR RESERVAS
// ==============================

async function carregarReservas() {

    try {

        const resposta = await fetch("/reservas");

        if (!resposta.ok) {
            throw new Error("Erro ao buscar reservas.");
        }

        const reservas = await resposta.json();

        reservasAtuais = reservas;

        mostrarCalendario();

        listaReservas.innerHTML = "";


        reservas.forEach((reserva) => {

            const linha = document.createElement("tr");

            const data = new Date(reserva.data_reserva);

            const dataFormatada = data.toLocaleDateString("pt-BR", {
                timeZone: "UTC"
            });


            // ==============================
            // DATA
            // ==============================

            const colunaData = document.createElement("td");

            colunaData.textContent = dataFormatada;

            linha.appendChild(colunaData);


            // ==============================
            // HORÁRIO
            // ==============================

            const colunaHorario = document.createElement("td");

            colunaHorario.textContent =
                reserva.horario.slice(0, 5);

            linha.appendChild(colunaHorario);


            // ==============================
            // NOME
            // ==============================

            const colunaNome = document.createElement("td");

            colunaNome.textContent =
                reserva.nome;

            linha.appendChild(colunaNome);


            // ==============================
            // TELEFONE
            // ==============================

            const colunaTelefone = document.createElement("td");

            colunaTelefone.textContent =
                reserva.telefone || "-";

            linha.appendChild(colunaTelefone);


            // ==============================
            // QUANTIDADE DE PESSOAS
            // ==============================

            const colunaPessoas = document.createElement("td");

            colunaPessoas.textContent =
                reserva.quantidade_pessoas;

            linha.appendChild(colunaPessoas);


            // ==============================
            // OBSERVAÇÃO
            // ==============================

            const colunaObservacao =
                document.createElement("td");

            colunaObservacao.textContent =
                reserva.observacao || "-";

            linha.appendChild(colunaObservacao);


            // ==============================
            // STATUS
            // ==============================

            const colunaStatus =
                document.createElement("td");

            const status =
                document.createElement("span");

            status.className =
                `status status-${reserva.status}`;

            status.textContent =
                reserva.status;

            colunaStatus.appendChild(status);

            linha.appendChild(colunaStatus);


            // ==============================
            // AÇÃO
            // ==============================

            const colunaAcao =
                document.createElement("td");


            // RESERVA PENDENTE

            if (reserva.status === "pendente") {

                const botaoConfirmar =
                    document.createElement("button");

                botaoConfirmar.textContent =
                    "Confirmar";


                botaoConfirmar.addEventListener(
                    "click",
                    () => alterarStatus(
                        reserva.id,
                        "confirmada"
                    )
                );


                const botaoRecusar =
                    document.createElement("button");

                botaoRecusar.textContent =
                    "Recusar";


                botaoRecusar.addEventListener(
                    "click",
                    () => alterarStatus(
                        reserva.id,
                        "recusada"
                    )
                );


                colunaAcao.appendChild(
                    botaoConfirmar
                );

                colunaAcao.appendChild(
                    botaoRecusar
                );

            }


            // RESERVA CONFIRMADA

            else if (reserva.status === "confirmada") {

                const botaoCancelar =
                    document.createElement("button");

                botaoCancelar.textContent =
                    "Cancelar";


                botaoCancelar.addEventListener(
                    "click",
                    () => alterarStatus(
                        reserva.id,
                        "cancelada"
                    )
                );


                colunaAcao.appendChild(
                    botaoCancelar
                );

            }


            // OUTROS STATUS

            else {

                colunaAcao.textContent = "-";

            }


            linha.appendChild(colunaAcao);


            // Adicionar linha à tabela

            listaReservas.appendChild(linha);

        });


    } catch (erro) {

        console.error(erro);

        mensagem.textContent =
            "Não foi possível carregar as reservas.";

        mensagem.className =
            "mensagem-erro";
    }

}


// ==============================
// ALTERAR STATUS
// ==============================

async function alterarStatus(id, status) {

    try {

        const resposta = await fetch(
            `/reservas/${id}/status`,
            {

                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    status: status
                })

            }
        );


        const resultado =
            await resposta.json();


        if (!resposta.ok) {

            throw new Error(
                resultado.erro ||
                "Erro ao atualizar status."
            );

        }


        mensagem.textContent =
            resultado.mensagem;

        mensagem.className =
            "mensagem-sucesso";


        carregarReservas();


    } catch (erro) {

        console.error(erro);

        mensagem.textContent =
            "Não foi possível atualizar o status.";

        mensagem.className =
            "mensagem-erro";

    }

}


// ==============================
// CALENDÁRIO
// ==============================

function mostrarCalendario() {

    const ano =
        dataCalendario.getFullYear();

    const mes =
        dataCalendario.getMonth();


    const nomesMeses = [

        "Janeiro",
        "Fevereiro",
        "Março",
        "Abril",
        "Maio",
        "Junho",
        "Julho",
        "Agosto",
        "Setembro",
        "Outubro",
        "Novembro",
        "Dezembro"

    ];


    mesAtual.textContent =
        `${nomesMeses[mes]} de ${ano}`;


    calendario.innerHTML = "";


    const diasSemana = [

        "Dom",
        "Seg",
        "Ter",
        "Qua",
        "Qui",
        "Sex",
        "Sáb"

    ];


    diasSemana.forEach((dia) => {

        const cabecalho =
            document.createElement("div");

        cabecalho.className =
            "dia-semana";

        cabecalho.textContent =
            dia;

        calendario.appendChild(
            cabecalho
        );

    });


    const primeiroDia =
        new Date(
            ano,
            mes,
            1
        ).getDay();


    const quantidadeDias =
        new Date(
            ano,
            mes + 1,
            0
        ).getDate();


    // ==============================
    // ESPAÇOS ANTES DO PRIMEIRO DIA
    // ==============================

    for (
        let i = 0;
        i < primeiroDia;
        i++
    ) {

        const vazio =
            document.createElement("div");

        vazio.className =
            "dia vazio";

        calendario.appendChild(
            vazio
        );

    }


    // ==============================
    // DIAS DO MÊS
    // ==============================

    for (
        let dia = 1;
        dia <= quantidadeDias;
        dia++
    ) {

        const elementoDia =
            document.createElement("div");

        elementoDia.className =
            "dia";


        const numeroDia =
            document.createElement("strong");

        numeroDia.textContent =
            dia;


        elementoDia.appendChild(
            numeroDia
        );


        const reservasDoDia =
            reservasAtuais.filter(
                (reserva) => {

                    const data =
                        new Date(
                            reserva.data_reserva
                        );


                    return (

                        data.getUTCFullYear() === ano &&

                        data.getUTCMonth() === mes &&

                        data.getUTCDate() === dia &&

                        [
                            "pendente",
                            "confirmada"
                        ].includes(
                            reserva.status
                        )

                    );

                }
            );


        reservasDoDia.forEach(
            (reserva) => {

                const horario =
                    document.createElement("div");


                horario.className =
                    "horario-reserva";


                horario.textContent =
                    `${reserva.horario.slice(0, 5)} - ${reserva.nome}`;


                elementoDia.appendChild(
                    horario
                );

            }
        );


        calendario.appendChild(
            elementoDia
        );

    }

}


// ==============================
// BOTÃO MÊS ANTERIOR
// ==============================

mesAnterior.addEventListener(
    "click",
    () => {

        dataCalendario.setMonth(
            dataCalendario.getMonth() - 1
        );

        mostrarCalendario();

    }
);


// ==============================
// BOTÃO PRÓXIMO MÊS
// ==============================

mesProximo.addEventListener(
    "click",
    () => {

        dataCalendario.setMonth(
            dataCalendario.getMonth() + 1
        );

        mostrarCalendario();

    }
);


// ==============================
// INICIAR
// ==============================

carregarReservas();


// ==============================
// NOVA RESERVA
// ==============================

const novaReserva =
    document.getElementById("novaReserva");

const formNovaReserva =
    document.getElementById("formNovaReserva");

const cancelarNovaReserva =
    document.getElementById("cancelarNovaReserva");


novaReserva.addEventListener(
    "click",
    () => {

        formNovaReserva.style.display =
            "block";

    }
);


cancelarNovaReserva.addEventListener(
    "click",
    () => {

        formNovaReserva.style.display =
            "none";

    }
);


const formReservaAdmin =
    document.getElementById("formReservaAdmin");


formReservaAdmin.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        const dados = {

            nome:
                document.getElementById(
                    "nomeAdmin"
                ).value,

            telefone:
                document.getElementById(
                    "telefoneAdmin"
                ).value,

            data_reserva:
                document.getElementById(
                    "dataAdmin"
                ).value,

            horario:
                document.getElementById(
                    "horarioAdmin"
                ).value,

            quantidade_pessoas:
                document.getElementById(
                    "quantidadeAdmin"
                ).value,

            observacao:
                document.getElementById(
                    "observacaoAdmin"
                ).value,

            status: "confirmada"

        };


        try {

            const resposta =
                await fetch(
                    "/reservas",
                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify(dados)

                    }
                );


            const resultado =
                await resposta.json();


            if (!resposta.ok) {

                mensagem.textContent =
                    resultado.erro ||
                    "Erro ao criar reserva.";

                mensagem.className =
                    "mensagem-erro";

                return;

            }


            mensagem.textContent =
                "Reserva adicionada com sucesso!";

            mensagem.className =
                "mensagem-sucesso";


            formReservaAdmin.reset();


            formNovaReserva.style.display =
                "none";


            carregarReservas();


        } catch (erro) {

            console.error(erro);

            mensagem.textContent =
                "Não foi possível criar a reserva.";

            mensagem.className =
                "mensagem-erro";

        }

    }
);