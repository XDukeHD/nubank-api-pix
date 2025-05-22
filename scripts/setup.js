const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');
const { Sequelize } = require('sequelize');
const config = require('../config/config.json');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function setup() {
  try {
    console.log('🚀 Inicializando a API de Pagamentos Pix...\n');
    
    await initializeDatabase();
    
    await createApiClient();
    
    console.log('\n✅ Setup concluído com sucesso!\n');
    console.log('Para iniciar o servidor em modo de desenvolvimento, execute:');
    console.log('npm run dev');
    console.log('\nPara iniciar em modo de produção, execute:');
    console.log('npm start');
  } catch (error) {
    console.error('❌ Erro durante o setup:', error);
  } finally {
    rl.close();
  }
}

async function initializeDatabase() {
  console.log('📦 Inicializando banco de dados SQLite...');
  
  const dbPath = path.resolve(config.database.path);
  const dbDir = path.dirname(dbPath);
  
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath
  });
  
  try {
    await sequelize.authenticate();
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso.');
    
    const Payment = require('../src/models/payment')(sequelize, Sequelize);
    const ApiClient = require('../src/models/apiClient')(sequelize, Sequelize);
    
    await sequelize.sync();
    console.log('✅ Modelos sincronizados com o banco de dados.');
    
    return { sequelize, Payment, ApiClient };
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco de dados:', error);
    throw error;
  }
}

async function createApiClient() {
  console.log('\n📝 Vamos criar um cliente da API:');
  
  const name = await question('Nome do cliente: ');
  
  const apiKey = crypto.randomBytes(24).toString('hex');
  
  const { sequelize } = await initializeDatabase();
  const ApiClient = require('../src/models/apiClient')(sequelize, Sequelize);
  
  await ApiClient.create({
    name,
    api_key: apiKey,
    active: true
  });
  
  console.log('\n✅ Cliente da API criado com sucesso!');
  console.log('🔑 API Key:', apiKey);
  console.log('\n⚠️ IMPORTANTE: Guarde esta chave em um local seguro. Ela não será mostrada novamente.');
}

setup();
