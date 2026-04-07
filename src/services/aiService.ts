import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export interface AISuggestionRequest {
  descricao: string;
  categoria: string;
  preco: string;
  publico: string;
  historico: string;
}

export interface AISuggestionResponse {
  descricao_melhorada: string;
  termos_sugeridos: string[];
  preco_sugerido: string;
  argumento_venda: string;
  upsell: {
    nome: string;
    descricao: string;
  };
}

export async function getAISuggestion(data: AISuggestionRequest): Promise<AISuggestionResponse> {
  const prompt = `
Você é um sistema avançado de inteligência artificial especializado em vendas, precificação e copywriting para pequenos e médios negócios.

Seu objetivo é transformar um orçamento simples em uma proposta altamente profissional, persuasiva e estratégica, aumentando as chances de fechamento.

---

CONTEXTO:
Você receberá dados de um orçamento criado por um usuário.

Analise profundamente as informações e gere uma versão otimizada com base em:
- Clareza
- Persuasão
- Valor percebido
- Profissionalismo
- Conversão em vendas

---

DADOS DE ENTRADA:
- Descrição atual: ${data.descricao}
- Categoria do serviço: ${data.categoria}
- Preço atual: ${data.preco}
- Público-alvo: ${data.publico}
- Histórico de orçamentos similares: ${data.historico}

---

SUA MISSÃO:

1. Reescrever a descrição do serviço:
- Mais profissional
- Mais clara
- Mais persuasiva
- Focada em benefício (não só o que é, mas o que resolve)

2. Sugerir melhorias estratégicas:
- Termos mais atrativos
- Palavras que aumentam valor percebido
- Ajustes sutis para conversão

3. Sugerir um preço (opcional, baseado em valor percebido e histórico)

4. Sugerir um pequeno argumento de venda:
- Frase curta que ajude a fechar o cliente

5. Sugerir um possível upsell (serviço adicional complementar)

---

REGRAS IMPORTANTES:
- Não seja genérico
- Evite frases robóticas
- Seja direto e estratégico
- Pense como um vendedor experiente
- Use linguagem natural e profissional
- Não exagere (tem que parecer real)

---

FORMATO DE RESPOSTA (OBRIGATÓRIO EM JSON):

{
  "descricao_melhorada": "...",
  "termos_sugeridos": ["...", "...", "..."],
  "preco_sugerido": "...",
  "argumento_venda": "...",
  "upsell": {
    "nome": "...",
    "descricao": "..."
  }
}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("Empty AI response");
    }
    
    return JSON.parse(text);
  } catch (error) {
    console.error("AI Suggestion Error:", error);
    throw error;
  }
}
