import { MongoClient } from 'mongodb';

let client;

export async function conectarBanco() {
  if (!process.env.MONGODB_URI) {
    throw new Error('Defina MONGODB_URI no arquivo backend/.env');
  }

  client ??= new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  console.log('Conectado ao MongoDB');
  return client.db(process.env.MONGODB_DB || 'atividade_api');
}

export async function fecharBanco() {
  await client?.close();
}
