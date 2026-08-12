import { FormEvent, useEffect, useState } from 'react';

type Usuario = {
  id: string;
  email: string;
};

const API_URL = 'http://localhost:3000/api/usuarios';

export default function App() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mensagem, setMensagem] = useState('');

  async function carregarUsuarios() {
    try {
      const resposta = await fetch(API_URL);
      if (!resposta.ok) throw new Error();
      setUsuarios(await resposta.json());
    } catch {
      setMensagem('Não foi possível conectar à API. Verifique se o backend está em execução.');
    }
  }

  useEffect(() => {
    carregarUsuarios();
  }, []);

  async function cadastrar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setMensagem('');

    const resposta = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });
    const dados = await resposta.json();

    if (!resposta.ok) {
      setMensagem(dados.erro || 'Não foi possível cadastrar.');
      return;
    }

    setEmail('');
    setSenha('');
    setMensagem('Usuário cadastrado com sucesso.');
    carregarUsuarios();
  }

  async function remover(id: string) {
    const resposta = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
    if (!resposta.ok) {
      setMensagem('Não foi possível remover o usuário.');
      return;
    }
    setMensagem('Usuário removido.');
    carregarUsuarios();
  }

  return (
    <main>
      <h1>Cadastro de usuários</h1>

      <form onSubmit={cadastrar}>
        <div>
          <label htmlFor="email">Email</label><br />
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="senha">Senha</label><br />
          <input id="senha" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        </div>
        <button type="submit">Cadastrar</button>
      </form>

      {mensagem && <p>{mensagem}</p>}

      <h2>Usuários cadastrados</h2>
      {usuarios.length === 0 ? (
        <p>Nenhum usuário cadastrado.</p>
      ) : (
        <ul>
          {usuarios.map((usuario) => (
            <li key={usuario.id}>
              {usuario.email} <button type="button" onClick={() => remover(usuario.id)}>Excluir</button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

