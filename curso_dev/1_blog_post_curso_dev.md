# Quando o código "funciona" sem querer: caçando um fallback não documentado no `node-pg-migrate` 🔍

## O cenário

Aqui estou eu pela segunda vez fazendo o Curso.dev que é uma 📦🎉, mas dessa vez não tentei fazer o caminho feliz, na verdade tentei reproduzir o mesmo erro que o Felipe encontrou com o `node-pg-migrate` referente ao problema esperado da `DATABASE_URL`. E tudo acontecendo quando **não usei o `--envPath`**. Como consequência, o bin caiu no `.env` da raiz do projeto, que possuia as *Connection Parameters* padrão do módulo `pg` que alimenta o endpoint `/api/v1/status`.

Minha expectativa: sem `DATABASE_URL` configurado, eu deveria receber um erro de conexão (`cliente password must be a string` ou similar). Afinal, a documentação diz claramente para colocar a connection string em `DATABASE_URL`.

Só que para minha surpresa as migrations rodaram. E foram aplicadas com sucesso no banco. 🤯
```bash
LKSFERREIRA@LKSFERREIRA MINGW64 ~/Documents/GitHub/clone-tabnews (main)
$ npm run migrate:up

> clone-tabnews@1.0.0 migrate:up
> node-pg-migrate --migrations-dir infra/migrations up

> Migrating files:
> - 1783567146909_inital
> - 1783567172809_seconde
### MIGRATION 1783567146909_inital (UP) ###
INSERT INTO "public"."pgmigrations" (name, run_on) VALUES ('1783567146909_inital', NOW());


### MIGRATION 1783567172809_seconde (UP) ###
INSERT INTO "public"."pgmigrations" (name, run_on) VALUES ('1783567172809_seconde', NOW());


Migrations complete!
```

## Investigando o comportamento inesperado

Aqui está a lição que mais gosto: **devemos investigar não só quando o código quebra, mas quando ele faz algo diferente do que esperamos.** 

Cavando o código, encontrei tudo para corroborar a situação.

### A versão

`node_modules/node-pg-migrate/package.json`:
```json
{
  "name": "node-pg-migrate",
  "version": "6.2.2",
  "bin": { "node-pg-migrate": "bin/node-pg-migrate" }
}
```

### O `.env` (com `DATABASE_URL` vazio e as `PG*` presentes)

```env
DATABASE_URL=

# Connection Parameters padrão (libpq), usadas também pelo módulo pg
PGHOST='***-***-***-***-pooler.c-7.us-east-1.aws.neon.tech'
PGDATABASE='neondb'
PGUSER='neondb_owner'
PGPASSWORD='****************s'
PGSSLMODE='require'
```

### O bin carrega o `.env` via `dotenv`

`node_modules/node-pg-migrate/bin/node-pg-migrate` (linhas 217-239):

```js
/* Load env before accessing process.env */
const dotenv = tryRequire('dotenv')
if (dotenv) {
  // Load config from ".env" file
  const myEnv = dotenv.config(dotenvConfig)
  const dotenvExpand = tryRequire('dotenv-expand')
  if (dotenvExpand && dotenvExpand.expand) {
    dotenvExpand.expand(myEnv)
  }
}

let DB_CONNECTION = process.env[argv[databaseUrlVarArg]] // process.env.DATABASE_URL
```

Como o `dotenv` estava instalado, o `.env` foi lido e as `PG*` entraram no `process.env`.

### **O fallback não documentado**

Como `DATABASE_URL` estava vazio, `DB_CONNECTION` fica *falsy* e o bin cai neste trecho (linhas 380-387):

```js
if (!DB_CONNECTION) {
  const cp = new ConnectionParameters()
  if (!cp.host && !cp.port && !cp.database) {
    console.error(`The $${argv[databaseUrlVarArg]} environment variable is not set.`)
    process.exit(1)
  }
  DB_CONNECTION = cp
}
```

O `new ConnectionParameters()` (do próprio `pg`) lê `PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` do ambiente. Por isso conectou no Neon sem `DATABASE_URL`.

### A connection chega ao `pg`

`node_modules/node-pg-migrate/dist/db.js:14`:
```js
const client = isExternalClient ? connection : new pg_1.Client(connection);
```

### Mas a documentação oficial diz outra coisa

Em https://salsita.github.io/node-pg-migrate/getting-started:

> *"Now you should put your DB connection string to `DATABASE_URL` environment variable and run `npm run migrate up`."*

Ou seja: o caminho **suportado e documentado** é `DATABASE_URL`. O fallback para as `PG*` é um detalhe de implementação **não documentado**. Funciona, mas é frágil e quebra se o `dotenv` não estiver presente.

## O resultado...

```
> node-pg-migrate --migrations-dir infra/migrations up
> Migrating files:
> - 1783567146909_inital
> - 1783567172809_seconde
### MIGRATION 1783567146909_inital (UP) ###
INSERT INTO "public"."pgmigrations" (name, run_on) VALUES ('1783567146909_inital', NOW());
### MIGRATION 1783567172809_seconde (UP) ###
INSERT INTO "public"."pgmigrations" (name, run_on) VALUES ('1783567172809_seconde', NOW());
Migrations complete!
```

Migrations aplicadas no banco de nuvem (Neon), não local. Sem `DATABASE_URL`, sem erro. 🎯

## Moral do rolê

Quando o resultado diverge da expectativa, não comemore achando que "deu sorte", ou simples "se funcionou não toque", pelo contrário: **investigue**. O código me disse exatamente o que aconteceu:

1. `.env` foi carregado porque o `dotenv` estava disponível em `node_modules` é dependência do projeto, o `node-pg-migrate` então usa o bin via `tryRequire`;
2. `DATABASE_URL` vazio ativou o fallback para `ConnectionParameters()`;
3. as `PG*` (que eu já usava no `/api/v1/status`) fizeram a conexão.

Mas se eu quiser seguir a risca e deixar o código mais robusto e menos frágil, devo realizar o fix alinhado à docs: preencher `DATABASE_URL` no `.env` com a connection string de verdade, em vez de depender do fallback.

## Referências

- Código analisado: `node_modules/node-pg-migrate/bin/node-pg-migrate` (v6.2.2), linhas 217-239 e 380-387
- `node_modules/node-pg-migrate/dist/db.js:14`
- `node-pg-migrate/package.json`: `dotenv`
- `package.json`: `"migrate:up": "node-pg-migrate --migrations-dir infra/migrations up"`
- Docs oficiais: https://salsita.github.io/node-pg-migrate/getting-started
- Pacote: https://www.npmjs.com/package/node-pg-migrate