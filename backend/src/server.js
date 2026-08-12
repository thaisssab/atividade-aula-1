import 'dotenv/config';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import express from 'express';
import { ObjectId } from 'mongodb';
import { conectarBanco, fecharBanco } from './db.js';

if (!process.env.MONGODB_URI) {
  throw new Error('Defina MONGODB_URI no arquivo backend/.env');
}

const app = express();
const porta = Number(process.env.PORT) || 3000;
const banco = await conectarBanco();
const usuarios = banco.collection('usuarios');

app.use(cors());
app.use(express.json());

function usuarioPublico(usuario) {
  return { id: usuario._id.toString(), email: usuario.email };
}

function idValido(id) {
  return ObjectId.isValid(id);
}

app.get('/', (_req, res) => {
  res.json({ mensagem: 'API de usuários funcionando.' });
});

app.get('/api/usuarios', async (_req, res) => {
  const lista = await usuarios.find().toArray();
  res.json(lista.map(usuarioPublico));
});

app.get('/api/usuarios/:id', async (req, res) => {
  if (!idValido(req.params.id)) return res.status(400).json({ erro: 'ID inválido.' });

  const usuario = await usuarios.findOne({ _id: new ObjectId(req.params.id) });
  if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });

  res.json(usuarioPublico(usuario));
});

app.post('/api/usuarios', async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) return res.status(400).json({ erro: 'Email e senha são obrigatórios.' });

  const emailNormalizado = email.trim().toLowerCase();
  const jaExiste = await usuarios.findOne({ email: emailNormalizado });
  if (jaExiste) return res.status(409).json({ erro: 'Este email já está cadastrado.' });

  const resultado = await usuarios.insertOne({
    email: emailNormalizado,
    senha: await bcrypt.hash(senha, 10)
  });
  const usuario = await usuarios.findOne({ _id: resultado.insertedId });
  res.status(201).json(usuarioPublico(usuario));
});

app.put('/api/usuarios/:id', async (req, res) => {
  if (!idValido(req.params.id)) return res.status(400).json({ erro: 'ID inválido.' });
  const { email, senha } = req.body;
  const atualizacao = {};

  if (email) {
    const emailNormalizado = email.trim().toLowerCase();
    const outroUsuario = await usuarios.findOne({ email: emailNormalizado, _id: { $ne: new ObjectId(req.params.id) } });
    if (outroUsuario) return res.status(409).json({ erro: 'Este email já está cadastrado.' });
    atualizacao.email = emailNormalizado;
  }
  if (senha) atualizacao.senha = await bcrypt.hash(senha, 10);
  if (Object.keys(atualizacao).length === 0) return res.status(400).json({ erro: 'Envie email ou senha para atualizar.' });

  const resultado = await usuarios.findOneAndUpdate(
    { _id: new ObjectId(req.params.id) },
    { $set: atualizacao },
    { returnDocument: 'after' }
  );
  if (!resultado) return res.status(404).json({ erro: 'Usuário não encontrado.' });

  res.json(usuarioPublico(resultado));
});

app.delete('/api/usuarios/:id', async (req, res) => {
  if (!idValido(req.params.id)) return res.status(400).json({ erro: 'ID inválido.' });

  const resultado = await usuarios.deleteOne({ _id: new ObjectId(req.params.id) });
  if (resultado.deletedCount === 0) return res.status(404).json({ erro: 'Usuário não encontrado.' });

  res.status(204).send();
});

app.use((erro, _req, res, _next) => {
  console.error(erro);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
});

const servidor = app.listen(porta, () => {
  console.log(`API disponível em http://localhost:${porta}`);
});

process.on('SIGINT', async () => {
  await fecharBanco();
  servidor.close(() => process.exit(0));
});

