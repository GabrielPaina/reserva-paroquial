const form = document.getElementById("formReserva");
const mensagem = document.getElementById("mensagem");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const dados = {
        nome: document.getElementById("nome").value,
        telefone: document.getElementById("telefone").value,
        data_reserva: document.getElementById("data_reserva").value,
        horario: document.getElementById("horario").value,
        quantidade_pessoas: document.getElementById("quantidade_pessoas").value,
        observacao: document.getElementById("observacao").value
    };

    try {
        const resposta = await fetch("/reservas", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dados)
        });

        const resultado = await resposta.json();

        if (resposta.ok) {
    mensagem.textContent = "✓ Reserva confirmada com sucesso!";
    mensagem.className = "mensagem-sucesso";
    form.reset();
} else {

    mensagem.textContent = resultado.erro || "Erro ao enviar reserva.";
    mensagem.className = "mensagem-erro";
}

    } catch (erro) {
        console.error(erro);
        mensagem.textContent = "Não foi possível conectar ao servidor.";
mensagem.className = "mensagem-erro";
    }
});