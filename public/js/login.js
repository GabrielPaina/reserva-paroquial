const formLogin = document.getElementById("formLogin");
const mensagem = document.getElementById("mensagem");

formLogin.addEventListener("submit", async (event) => {

    event.preventDefault();

    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;

    try {

        const resposta = await fetch("/login", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                email: email,
                senha: senha
            })

        });

        const resultado = await resposta.json();

        if (!resposta.ok) {

            mensagem.textContent =
                resultado.erro ||
                "E-mail ou senha incorretos.";

            mensagem.className = "mensagem-erro";

            return;
        }

        mensagem.textContent =
            "Login realizado com sucesso!";

        mensagem.className =
            "mensagem-sucesso";

        setTimeout(() => {

            window.location.href =
                "/admin.html";

        }, 500);

    } catch (erro) {

        console.error(erro);

        mensagem.textContent =
            "Não foi possível conectar ao servidor.";

        mensagem.className =
            "mensagem-erro";

    }

});