# Integração Supabase - Nexora

Esta integração permite que o Nexora utilize o **Supabase** (PostgreSQL) como backend em vez do `localStorage`.

## 1. Configuração do Supabase

1. Crie um projeto no [Supabase](https://supabase.com).
2. Vá em **Project Settings > API** e copie a `URL` e a `anon key`.
3. Adicione estas chaves ao seu arquivo `.env`:

```env
VITE_SUPABASE_URL=sua-url-do-supabase
VITE_SUPABASE_ANON_KEY=sua-chave-anon-do-supabase
```

## 2. Executando as Migrations

Vá no **SQL Editor** do seu painel do Supabase e execute o conteúdo do arquivo:
`/supabase/migrations/20260405000000_initial_schema.sql`

Isso criará as tabelas:
- `profiles`: Dados do usuário e plano.
- `clients`: Cadastro de clientes.
- `budgets`: Orçamentos gerados.
- `usage_logs`: Logs de atividade e limites.

## 3. Autenticação e RLS

As políticas de **Row Level Security (RLS)** já estão configuradas para garantir que:
- Cada usuário só veja seus próprios dados.
- Orçamentos possam ser visualizados publicamente via ID (para os links de compartilhamento).
- Perfis sejam criados automaticamente ao realizar o Sign Up.

## 4. Como usar no código

Você pode importar o `supabaseService` para realizar operações no banco de dados:

```ts
import { supabaseService } from './services/supabaseService';

// Exemplo: Buscar clientes
const clients = await supabaseService.getClients(userId);
```

Para uma migração completa, você pode substituir as chamadas do objeto `storage` em `src/lib/storage.ts` pelas chamadas assíncronas do `supabaseService`.
