import type { PromptDraft } from '@/features/studio/promptBuilder'

/**
 * Biblioteca Premium — coleção inicial.
 *
 * Critério: nada de prompt de uma linha. Cada material traz contexto, método,
 * restrições, critérios de qualidade e formato de saída — e os de tipo
 * "prompt" abrem direto no IA Studio já estruturados. Esta é a primeira
 * coleção completa; a ampliação é incremental, com o mesmo padrão.
 */

export type MaterialType = 'prompt' | 'checklist' | 'script' | 'modelo'

export type LibraryCategory =
  | 'ia'
  | 'sites'
  | 'copy'
  | 'redes'
  | 'video'
  | 'vendas'
  | 'prospeccao'
  | 'atendimento'
  | 'pesquisa'
  | 'propostas'
  | 'entregas'
  | 'operacao'

export const LIBRARY_CATEGORY_LABELS: Record<LibraryCategory, string> = {
  ia: 'Inteligência artificial',
  sites: 'Criação de sites',
  copy: 'Copywriting',
  redes: 'Redes sociais',
  video: 'Vídeo',
  vendas: 'Vendas',
  prospeccao: 'Prospecção',
  atendimento: 'Atendimento',
  pesquisa: 'Pesquisa',
  propostas: 'Propostas',
  entregas: 'Entregas',
  operacao: 'Operação',
}

export const MATERIAL_TYPE_LABELS: Record<MaterialType, string> = {
  prompt: 'Prompt',
  checklist: 'Checklist',
  script: 'Roteiro',
  modelo: 'Modelo',
}

export interface LibraryMaterial {
  key: string
  title: string
  type: MaterialType
  category: LibraryCategory
  /** Em que momento do trabalho este material serve. */
  whenToUse: string
  /** Conteúdo pronto para uso — texto completo, não resumo. */
  body: string
  variables: string[]
  tips: string[]
  reviewCriteria: string[]
  /** Para materiais do tipo prompt: abre estruturado no IA Studio. */
  draft?: Omit<PromptDraft, 'title' | 'category'>
}

export const LIBRARY: readonly LibraryMaterial[] = [
  {
    key: 'prompt-briefing-site',
    title: 'Entrevista de briefing para site',
    type: 'prompt',
    category: 'sites',
    whenToUse: 'Antes de começar qualquer site, para extrair do cliente o que ele não sabe que precisa dizer.',
    body: '',
    variables: ['negocio', 'segmento', 'cidade'],
    tips: [
      'Faça a entrevista por áudio ou chamada e transcreva: cliente escreve pouco e fala muito.',
      'Pergunta que o cliente não souber responder vira decisão sua — registre como premissa na proposta.',
    ],
    reviewCriteria: [
      'Cada pergunta muda alguma decisão de execução?',
      'Há pergunta sobre quem aprova e em quanto tempo?',
      'Há pergunta sobre quem envia material e quando?',
    ],
    draft: {
      role: 'Você é um especialista em briefing para projetos digitais, com experiência em pequenos negócios locais.',
      context:
        'Vou entrevistar o responsável por {{negocio}}, do segmento {{segmento}}, em {{cidade}}. Ele não é da área de tecnologia e tem pouco tempo.',
      goal: 'Produzir um roteiro de entrevista que colete tudo o que é necessário para executar o site sem retrabalho.',
      inputs: ['Nome e segmento do negócio', 'O que o cliente já falou sobre o projeto', 'Prazo desejado'],
      method: [
        'Comece por perguntas de negócio (o que vende, para quem, o que o diferencia) antes de qualquer pergunta técnica.',
        'Para cada pergunta, explique em uma linha por que ela importa — o cliente responde melhor quando entende.',
        'Agrupe as perguntas em blocos de no máximo 5, com um título por bloco.',
        'Inclua obrigatoriamente perguntas sobre: quem aprova, quem envia material, prazo de envio e o que está fora do escopo.',
      ],
      constraints: [
        'No máximo 20 perguntas no total.',
        'Linguagem simples, sem jargão técnico.',
        'Não pergunte nada que eu possa descobrir sozinho olhando o perfil público do negócio.',
      ],
      quality: [
        'Toda pergunta muda alguma decisão de execução.',
        'Nenhuma pergunta pode ser respondida com "sim" ou "não" sem acrescentar informação.',
        'O roteiro cabe em uma conversa de 30 minutos.',
      ],
      outputFormat: 'Lista agrupada por blocos, com título de bloco e as perguntas numeradas.',
      review: 'Antes de entregar, remova perguntas redundantes e marque as 5 mais críticas com um asterisco.',
    },
  },
  {
    key: 'prompt-copy-landing',
    title: 'Copy de página de conversão a partir da entrevista',
    type: 'prompt',
    category: 'copy',
    whenToUse: 'Depois do briefing, para transformar o que o cliente falou em texto de venda.',
    body: '',
    variables: ['oferta', 'publico', 'objecao-principal', 'acao-desejada'],
    tips: [
      'Cole trechos literais da entrevista no contexto: a melhor copy costuma ser a frase do próprio cliente.',
      'Peça duas variações de título e teste — não adivinhe qual funciona.',
    ],
    reviewCriteria: [
      'A promessa é verificável ou é exagero?',
      'As objeções reais aparecem respondidas no texto?',
      'Há uma única ação pedida na página?',
    ],
    draft: {
      role: 'Você é redator de resposta direta, especializado em serviços locais, com estilo claro e sem exagero.',
      context:
        'A oferta é: {{oferta}}. O público é {{publico}}. A objeção mais comum que ouvimos é: {{objecao-principal}}. A ação desejada na página é {{acao-desejada}}.',
      goal: 'Escrever o texto completo de uma página de conversão de uma única ação.',
      inputs: [
        'Trechos literais da entrevista com o cliente',
        'Diferenciais verificáveis (nada de alegação sem prova)',
        'Preço ou faixa de preço, se for público',
      ],
      method: [
        'Abra com a promessa concreta em uma frase, usando a linguagem de quem compra.',
        'Apresente o problema em 2 ou 3 frases, sem dramatizar.',
        'Descreva a solução pelo que o cliente recebe, não pelo que você faz.',
        'Responda as três objeções mais prováveis, cada uma em um bloco curto.',
        'Feche com a ação única e o que acontece depois que a pessoa clicar.',
      ],
      constraints: [
        'Não prometa resultado financeiro nem prazo que dependa de terceiros.',
        'Nada de superlativo vazio ("o melhor", "revolucionário").',
        'Frases curtas; parágrafos de no máximo 3 linhas.',
      ],
      quality: [
        'Toda afirmação pode ser sustentada por um fato que o cliente forneceu.',
        'O texto funciona lido em voz alta.',
        'Uma pessoa de fora entende a oferta em 15 segundos lendo só os títulos.',
      ],
      outputFormat:
        'Texto organizado por seções com rótulo (Título, Subtítulo, Problema, Solução, Objeções, Prova, Chamada final), mais 2 variações alternativas de título.',
      review: 'Releia e corte toda frase que não ajuda a decidir. Diga ao final quantas palavras foram cortadas.',
    },
  },
  {
    key: 'prompt-cardapio',
    title: 'Descrições de cardápio que dão vontade e informam',
    type: 'prompt',
    category: 'sites',
    whenToUse: 'Ao montar cardápio digital, quando o cliente entrega só nomes de pratos e preços.',
    body: '',
    variables: ['restaurante', 'estilo-cozinha'],
    tips: ['Confirme ingredientes com a cozinha antes de publicar: descrição errada gera reclamação na mesa.'],
    reviewCriteria: [
      'Toda descrição cita ingredientes reais informados pelo cliente?',
      'Alergênicos aparecem quando existem?',
      'O tamanho é uniforme entre os itens?',
    ],
    draft: {
      role: 'Você escreve descrições de cardápio para restaurantes, com foco em clareza e apetite.',
      context: 'O restaurante é {{restaurante}}, de cozinha {{estilo-cozinha}}. Vou fornecer a lista de pratos e os ingredientes.',
      goal: 'Escrever uma descrição curta por prato, apetitosa e informativa.',
      inputs: ['Lista de pratos', 'Ingredientes de cada prato', 'Observações sobre preparo e porção'],
      method: [
        'Comece pelo ingrediente principal, depois o preparo, depois o acompanhamento.',
        'Use apenas os ingredientes informados — não acrescente nenhum.',
        'Sinalize itens vegetarianos, veganos e que contenham alergênicos informados.',
      ],
      constraints: [
        'Máximo de 20 palavras por prato.',
        'Nada de adjetivo genérico como "delicioso" ou "incrível".',
        'Não invente origem, história ou denominação do prato.',
      ],
      quality: [
        'Uma pessoa com restrição alimentar consegue decidir sem perguntar ao garçom.',
        'Nenhuma descrição contém ingrediente que não estava na lista.',
      ],
      outputFormat: 'Tabela com três colunas: prato, descrição, marcadores (vegetariano, vegano, contém glúten...).',
      review: 'Confira item por item se todo ingrediente citado veio da lista original. Liste as dúvidas a confirmar com a cozinha.',
    },
  },
  {
    key: 'prompt-reels',
    title: 'Lote de roteiros de vídeo curto a partir de dúvidas reais',
    type: 'prompt',
    category: 'video',
    whenToUse: 'Para produzir um lote mensal de roteiros que o cliente consegue gravar sozinho.',
    body: '',
    variables: ['negocio', 'publico', 'quantidade'],
    tips: [
      'Colete as dúvidas no WhatsApp do cliente: é a melhor fonte de pauta que existe e ninguém usa.',
      'Grave o primeiro vídeo junto com o cliente para calibrar o tom.',
    ],
    reviewCriteria: ['Cada roteiro cabe no tempo previsto falado em voz alta?', 'O gancho entrega em até 3 segundos?'],
    draft: {
      role: 'Você é roteirista de vídeos curtos para negócios locais, com foco em fala natural.',
      context: 'O negócio é {{negocio}} e o público é {{publico}}. Quem grava é o próprio dono, com celular, sem equipe.',
      goal: 'Produzir {{quantidade}} roteiros prontos para gravar, a partir das dúvidas reais dos clientes.',
      inputs: ['Lista de perguntas frequentes recebidas pelo negócio', 'Serviços ou produtos em destaque no período'],
      method: [
        'Transforme cada dúvida em uma pauta de um vídeo só.',
        'Escreva o gancho (primeira frase), o desenvolvimento e a chamada final.',
        'Escreva como se fala, não como se escreve: frases curtas, sem subordinada longa.',
        'Indique duração-alvo e uma sugestão simples de enquadramento.',
      ],
      constraints: [
        'Entre 30 e 60 segundos por vídeo.',
        'Nenhuma promessa de resultado e nenhuma afirmação técnica de saúde, direito ou finanças sem ressalva.',
        'Nada de trends ou áudios específicos — o roteiro precisa durar.',
      ],
      quality: [
        'O dono do negócio consegue gravar lendo só uma vez.',
        'Cada vídeo responde uma dúvida inteira, não um pedaço.',
      ],
      outputFormat: 'Um bloco por vídeo: título, gancho, corpo, chamada, duração-alvo e enquadramento.',
      review: 'Leia cada roteiro em voz alta e corte o que travar a fala. Informe quais ficaram acima da duração.',
    },
  },
  {
    key: 'prompt-legendas',
    title: 'Legendas de redes com contexto e chamada',
    type: 'prompt',
    category: 'redes',
    whenToUse: 'Ao entregar o pacote mensal de conteúdo, para as artes não irem com legenda improvisada.',
    body: '',
    variables: ['negocio', 'tom', 'objetivo-do-mes'],
    tips: ['Peça ao cliente as três perguntas que mais recebe: viram legenda com engajamento real.'],
    reviewCriteria: ['A legenda funciona sozinha, sem a arte?', 'Há uma chamada clara em cada post?'],
    draft: {
      role: 'Você escreve legendas para perfis de negócios locais, com tom {{tom}}.',
      context: 'O negócio é {{negocio}} e o objetivo do mês é {{objetivo-do-mes}}. Vou fornecer a lista de posts planejados.',
      goal: 'Escrever a legenda de cada post, com chamada para ação coerente com o objetivo do mês.',
      inputs: ['Tema de cada post', 'Informações verdadeiras sobre produto, preço e horário', 'Canal de contato'],
      method: [
        'Abra com a frase que faria a pessoa parar de rolar.',
        'Entregue a informação útil no meio.',
        'Feche com uma ação única e específica.',
      ],
      constraints: [
        'Máximo de 60 palavras por legenda.',
        'Nenhuma informação que eu não tenha fornecido — preço, horário e endereço só se estiverem nas entradas.',
        'No máximo 5 hashtags, todas relacionadas ao negócio e à cidade.',
      ],
      quality: ['A legenda faz sentido para quem nunca viu o perfil.', 'A chamada é executável no canal informado.'],
      outputFormat: 'Lista numerada: post, legenda, hashtags sugeridas.',
      review: 'Verifique se nenhuma legenda cita dado que não estava nas entradas.',
    },
  },
  {
    key: 'prompt-email-reativacao',
    title: 'Sequência de e-mail para reativar base parada',
    type: 'prompt',
    category: 'vendas',
    whenToUse: 'Quando o cliente tem lista de contatos antiga e nunca escreveu para ela.',
    body: '',
    variables: ['negocio', 'oferta', 'tempo-sem-contato'],
    tips: [
      'Verifique a origem da lista antes de escrever. Base comprada: recuse o trabalho.',
      'Dispare em lotes para não queimar a reputação do domínio do cliente.',
    ],
    reviewCriteria: ['Cada e-mail entrega valor antes de pedir algo?', 'Há descadastro visível em todos?'],
    draft: {
      role: 'Você é especialista em e-mail marketing para pequenos negócios, com estilo direto e honesto.',
      context:
        'O negócio é {{negocio}}. A base não recebe contato há {{tempo-sem-contato}}. A oferta atual é {{oferta}}.',
      goal: 'Escrever uma sequência de 4 e-mails para reativar a base sem parecer invasivo.',
      inputs: ['Origem da base e como as pessoas entraram nela', 'Oferta e condições reais', 'Histórico do negócio'],
      method: [
        'E-mail 1: reconheça o tempo sem contato e entregue algo útil sem pedir nada.',
        'E-mail 2: conte uma situação real de cliente e o que foi resolvido.',
        'E-mail 3: apresente a oferta com condições claras.',
        'E-mail 4: encerre o assunto com prazo e ofereça a saída da lista sem atrito.',
      ],
      constraints: [
        'Máximo de 200 palavras por e-mail.',
        'Sem urgência artificial e sem contagem regressiva falsa.',
        'Todo e-mail precisa de link de descadastro visível.',
      ],
      quality: [
        'Cada e-mail entrega algo mesmo para quem não comprar.',
        'Nenhuma afirmação sobre o leitor que não possa ser verdadeira.',
      ],
      outputFormat: 'Para cada e-mail: assunto, prévia, corpo, chamada e intervalo sugerido de envio.',
      review: 'Verifique se nenhum e-mail usa escassez inventada e se todos têm descadastro.',
    },
  },
  {
    key: 'prompt-objecoes',
    title: 'Mapa de objeções e respostas honestas',
    type: 'prompt',
    category: 'vendas',
    whenToUse: 'Antes de começar a abordar um segmento novo, para não travar na primeira resistência.',
    body: '',
    variables: ['servico', 'publico', 'faixa-de-preco'],
    tips: ['Leve o mapa impresso ou aberto na tela durante as primeiras conversas.'],
    reviewCriteria: ['Alguma resposta pressiona em vez de informar?', 'Há uma saída digna para o "não"?'],
    draft: {
      role: 'Você é consultor comercial experiente em vendas de serviço para pequenos negócios.',
      context: 'Ofereço {{servico}} para {{publico}}, na faixa de {{faixa-de-preco}}.',
      goal: 'Mapear as objeções mais prováveis e escrever respostas honestas para cada uma.',
      inputs: ['Descrição do serviço e do escopo', 'Objeções que já ouvi', 'Diferenciais verificáveis'],
      method: [
        'Liste as objeções em ordem de frequência provável.',
        'Para cada uma, identifique o que está por trás (preço, risco, prioridade, confiança).',
        'Escreva uma resposta que reconheça a objeção antes de responder.',
        'Ofereça uma alternativa concreta sempre que possível (escopo menor, entrega em etapas).',
      ],
      constraints: [
        'Nenhuma técnica de pressão, urgência falsa ou culpa.',
        'Nunca sugerir que o cliente está errado.',
        'Incluir sempre a resposta para "não tenho interesse", encerrando bem.',
      ],
      quality: [
        'Cada resposta cabe em uma mensagem de WhatsApp.',
        'Nenhuma resposta promete algo fora do meu controle.',
      ],
      outputFormat: 'Tabela: objeção, o que costuma estar por trás, resposta sugerida, alternativa a oferecer.',
      review: 'Releia procurando qualquer frase que soe manipuladora e reescreva.',
    },
  },
  {
    key: 'prompt-concorrencia',
    title: 'Análise de concorrência com fonte para cada observação',
    type: 'prompt',
    category: 'pesquisa',
    whenToUse: 'Quando o cliente precisa decidir posicionamento ou preço e está decidindo no escuro.',
    body: '',
    variables: ['segmento', 'cidade', 'criterios'],
    tips: ['Tire print de cada observação. Relatório sem evidência vira opinião.'],
    reviewCriteria: ['Cada linha tem fonte e data?', 'Fato e interpretação estão separados?'],
    draft: {
      role: 'Você é analista de mercado, rigoroso quanto à diferença entre fato observado e interpretação.',
      context: 'Vou comparar concorrentes de {{segmento}} em {{cidade}}, usando os critérios: {{criterios}}.',
      goal: 'Organizar as observações coletadas em um comparativo útil para decisão.',
      inputs: ['Lista de concorrentes', 'Observações coletadas em fontes públicas, com data', 'Critérios de comparação'],
      method: [
        'Monte a tabela comparativa apenas com o que foi observado.',
        'Marque como "não encontrado" o que não foi possível verificar — nunca presuma.',
        'Separe uma seção de interpretação, claramente rotulada como tal.',
        'Termine com oportunidades priorizadas por esforço e impacto.',
      ],
      constraints: [
        'Não estime faturamento, número de clientes ou margem — isso não é público.',
        'Toda observação precisa citar a fonte e a data da consulta.',
        'Nenhuma conclusão apoiada em um único ponto de dado.',
      ],
      quality: [
        'Um leitor consegue refazer a verificação a partir das fontes citadas.',
        'Fato e opinião nunca aparecem no mesmo parágrafo.',
      ],
      outputFormat: 'Tabela comparativa, seção "o que isso sugere" e lista priorizada de oportunidades.',
      review: 'Procure qualquer afirmação sem fonte e mova-a para a seção de interpretação ou remova.',
    },
  },
  {
    key: 'prompt-processos',
    title: 'Documentação de processo a partir de entrevista',
    type: 'prompt',
    category: 'operacao',
    whenToUse: 'Para transformar "o jeito que fulano faz" em passo a passo que treina gente nova.',
    body: '',
    variables: ['processo', 'negocio'],
    tips: ['Documente observando a execução real, não o que dizem que fazem.'],
    reviewCriteria: ['Alguém de fora consegue executar lendo?', 'Os erros comuns estão sinalizados?'],
    draft: {
      role: 'Você escreve procedimentos operacionais claros, para serem seguidos por quem está começando.',
      context: 'O processo é {{processo}}, no negócio {{negocio}}. Vou fornecer a transcrição de quem executa hoje.',
      goal: 'Produzir o passo a passo do processo, pronto para treinar uma pessoa nova.',
      inputs: ['Transcrição ou anotações da observação', 'Ferramentas e acessos envolvidos', 'Erros que já aconteceram'],
      method: [
        'Liste os passos em ordem, um verbo de ação por passo.',
        'Marque os pontos de decisão com a condição explícita ("se X, então Y").',
        'Destaque os três erros mais comuns e como evitá-los.',
        'Feche com um checklist de verificação final.',
      ],
      constraints: [
        'Nenhum passo com mais de duas ações.',
        'Sem jargão interno não explicado.',
        'Não invente etapa que não apareceu na observação — marque como lacuna a confirmar.',
      ],
      quality: ['Uma pessoa nova executa sem perguntar.', 'Todo ponto de decisão tem critério objetivo.'],
      outputFormat: 'Passo a passo numerado, blocos de decisão destacados e checklist final.',
      review: 'Liste ao final as lacunas que precisam ser confirmadas com quem executa.',
    },
  },
  {
    key: 'prompt-revisor',
    title: 'Revisor de texto comercial',
    type: 'prompt',
    category: 'copy',
    whenToUse: 'Antes de enviar proposta, página ou mensagem importante.',
    body: '',
    variables: ['tipo-de-texto', 'publico'],
    tips: ['Revise sempre com o texto final, não com o rascunho: corrigir o rascunho é corrigir duas vezes.'],
    reviewCriteria: ['A revisão aponta problema com sugestão?', 'O sentido original foi preservado?'],
    draft: {
      role: 'Você é revisor de textos comerciais, rigoroso com clareza e com promessas.',
      context: 'Vou enviar um {{tipo-de-texto}} destinado a {{publico}}.',
      goal: 'Apontar problemas de clareza, exagero e ambiguidade, com sugestão de reescrita para cada um.',
      inputs: ['O texto completo', 'O que ele precisa fazer o leitor decidir'],
      method: [
        'Marque cada trecho problemático e classifique: vago, exagerado, ambíguo, longo demais ou arriscado.',
        'Para cada marcação, escreva a versão corrigida.',
        'Ao final, aponte o que ficou faltando no texto.',
      ],
      constraints: [
        'Não reescreva o texto inteiro — aponte e sugira.',
        'Preserve a voz de quem escreveu.',
        'Sinalize qualquer promessa que possa gerar problema com o cliente ou legalmente.',
      ],
      quality: ['Toda crítica vem com alternativa.', 'Nada de elogio vazio na devolutiva.'],
      outputFormat: 'Lista: trecho original, problema, sugestão. Depois, seção "o que falta".',
      review: 'Confirme que nenhuma sugestão mudou o sentido do que foi prometido ao cliente.',
    },
  },
  {
    key: 'prompt-respostas-whatsapp',
    title: 'Banco de respostas rápidas para atendimento',
    type: 'prompt',
    category: 'atendimento',
    whenToUse: 'Na implantação de atendimento padronizado, depois de ler conversas reais.',
    body: '',
    variables: ['negocio', 'horario', 'formas-de-pagamento'],
    tips: ['Revise o banco a cada trimestre: as dúvidas mudam quando o cardápio ou a oferta muda.'],
    reviewCriteria: ['Cada resposta cabe em uma tela de celular?', 'O tom é o mesmo em todas?'],
    draft: {
      role: 'Você escreve mensagens de atendimento comercial, cordiais e objetivas.',
      context:
        'O negócio é {{negocio}}, atende em {{horario}} e aceita {{formas-de-pagamento}}. Vou fornecer as dúvidas mais frequentes.',
      goal: 'Criar um banco de respostas rápidas cobrindo as dúvidas listadas.',
      inputs: ['Dúvidas mais frequentes', 'Informações corretas de preço, prazo e horário', 'Canais de contato'],
      method: [
        'Uma resposta por dúvida, com a informação pedida logo na primeira linha.',
        'Inclua saudação, ausência fora do horário e encerramento cordial.',
        'Ofereça o próximo passo ao final de cada resposta.',
      ],
      constraints: [
        'Máximo de 40 palavras por resposta.',
        'Nenhum dado que eu não tenha fornecido.',
        'Nada de emoji em excesso: no máximo um por mensagem.',
      ],
      quality: ['Quem recebe não precisa fazer uma segunda pergunta óbvia.', 'Tom uniforme entre todas as respostas.'],
      outputFormat: 'Tabela: atalho, dúvida, resposta.',
      review: 'Verifique se alguma resposta promete prazo ou preço que não estava nas entradas.',
    },
  },
  {
    key: 'prompt-nome-marca',
    title: 'Nomes e assinatura de marca com verificação',
    type: 'prompt',
    category: 'copy',
    whenToUse: 'Em projeto de identidade visual, quando o negócio ainda não tem nome definido.',
    body: '',
    variables: ['negocio', 'publico', 'valores'],
    tips: ['Antes de apresentar, verifique registro de marca e disponibilidade de domínio e perfil.'],
    reviewCriteria: ['Os nomes são pronunciáveis ao telefone?', 'Algum já é usado por concorrente da região?'],
    draft: {
      role: 'Você é especialista em naming, com foco em nomes fáceis de falar, escrever e lembrar.',
      context: 'O negócio é {{negocio}}, atende {{publico}} e quer transmitir {{valores}}.',
      goal: 'Propor opções de nome e assinatura, com justificativa de cada uma.',
      inputs: ['O que o negócio faz', 'Público e região', 'Nomes que o cliente já rejeitou'],
      method: [
        'Gere opções em três rotas: descritiva, evocativa e inventada.',
        'Para cada nome, explique a lógica em uma linha.',
        'Proponha uma assinatura curta para cada nome.',
        'Liste o que precisa ser verificado antes de adotar: registro, domínio, perfis.',
      ],
      constraints: [
        'No máximo 12 opções no total.',
        'Nada de nome com grafia difícil ou trocadilho que só funciona escrito.',
        'Não afirme que algum nome está disponível — isso exige verificação externa.',
      ],
      quality: ['O nome funciona dito ao telefone.', 'A assinatura explica o que o negócio faz.'],
      outputFormat: 'Três blocos por rota, cada nome com assinatura e justificativa; ao final, checklist de verificação.',
      review: 'Marque os três nomes mais fortes e explique o critério usado para escolhê-los.',
    },
  },
  {
    key: 'checklist-publicacao-site',
    title: 'Checklist de publicação de site',
    type: 'checklist',
    category: 'sites',
    whenToUse: 'Antes de avisar o cliente de que o site está no ar.',
    body: `CONTEÚDO
- [ ] Nome do negócio, telefone, endereço e horário conferidos com o cliente (não com o material antigo)
- [ ] Todos os links testados, inclusive os de redes sociais
- [ ] Botão de WhatsApp abre a conversa com o número certo
- [ ] Textos revisados: nome do cliente, cidade e serviços sem erro de digitação
- [ ] Nenhum texto de preenchimento ("lorem ipsum", "sua frase aqui") sobrou

TÉCNICO
- [ ] Testado em celular pequeno, celular grande e computador
- [ ] Testado em pelo menos dois navegadores diferentes
- [ ] Imagens comprimidas; nenhuma acima de 300 kB sem motivo
- [ ] Título e descrição da página preenchidos (é o que aparece no buscador)
- [ ] Ícone do site configurado
- [ ] Certificado de segurança ativo (cadeado no navegador)
- [ ] Formulário, se houver, testado de ponta a ponta com envio real

ENTREGA
- [ ] Acessos entregues ao cliente por canal seguro e confirmados por ele
- [ ] Instruções de atualização entregues por escrito ou em vídeo curto
- [ ] Combinado por escrito o que é manutenção e o que é novo serviço
- [ ] Data de vencimento de domínio e hospedagem anotada e avisada ao cliente
- [ ] Captura de tela do antes e depois guardada para o portfólio (com autorização)`,
    variables: [],
    tips: [
      'Rode a lista inteira antes de avisar o cliente: achar erro depois do anúncio custa reputação.',
      'A data de vencimento do domínio é o esquecimento mais caro desse serviço.',
    ],
    reviewCriteria: ['Todos os itens marcados foram de fato testados, não presumidos?'],
  },
  {
    key: 'checklist-entrega-projeto',
    title: 'Checklist de encerramento de projeto',
    type: 'checklist',
    category: 'entregas',
    whenToUse: 'No momento de dar o projeto por concluído, antes de emitir cobrança final.',
    body: `ANTES DE ENCERRAR
- [ ] Todos os entregáveis combinados na proposta foram entregues
- [ ] Cliente confirmou por escrito a aprovação de cada entregável
- [ ] Revisões incluídas foram usadas ou formalmente dispensadas
- [ ] Pedidos fora do escopo que surgiram foram registrados e orçados à parte
- [ ] Arquivos finais entregues no formato combinado
- [ ] Acessos e senhas transferidos para o cliente e removidos dos meus dispositivos

DEPOIS DE ENCERRAR
- [ ] Cobrança final emitida com referência ao escopo entregue
- [ ] Material de portfólio guardado, com autorização de uso
- [ ] Depoimento solicitado enquanto o resultado está fresco
- [ ] Próximo serviço possível anotado no CRM com data para retomar
- [ ] O que deu errado neste projeto anotado para o próximo orçamento`,
    variables: [],
    tips: [
      'Pedido de depoimento tem janela curta: peça na semana da entrega.',
      'Anotar o que deu errado é o que faz o próximo orçamento ser mais justo com você.',
    ],
    reviewCriteria: ['Há aprovação registrada de cada entregável antes da cobrança final?'],
  },
  {
    key: 'checklist-dados-cliente',
    title: 'Checklist de cuidado com dados do cliente',
    type: 'checklist',
    category: 'operacao',
    whenToUse: 'Em qualquer trabalho que envolva acesso a contas, base de contatos ou dados pessoais.',
    body: `ACESSOS
- [ ] Recebi acesso próprio (usuário meu), não a senha pessoal do dono
- [ ] Autenticação em duas etapas ativa onde a plataforma oferece
- [ ] Senhas guardadas em gerenciador, nunca em bloco de notas ou conversa
- [ ] Acesso revogado ao fim do projeto, confirmado com o cliente

DADOS PESSOAIS
- [ ] Recebi apenas os dados necessários para o trabalho
- [ ] Sei de onde veio a base de contatos e se houve consentimento
- [ ] Base não é compartilhada com terceiros nem usada em outro cliente
- [ ] Arquivos com dados pessoais apagados dos meus dispositivos ao encerrar
- [ ] Combinado por escrito o que acontece com os dados no fim do contrato

NO DIA A DIA
- [ ] Não envio dado sensível por canal público
- [ ] Faço backup do que é meu e não do que é do cliente sem combinar
- [ ] Em caso de incidente, aviso o cliente no mesmo dia`,
    variables: [],
    tips: [
      'Trabalhar com acesso próprio protege os dois lados: dá para auditar quem fez o quê.',
      'Base de contatos sem origem conhecida é risco do cliente e seu. Pergunte antes de usar.',
    ],
    reviewCriteria: ['Algum item ficou marcado sem ter sido realmente feito?'],
  },
  {
    key: 'checklist-diagnostico-presenca',
    title: 'Checklist de diagnóstico de presença digital',
    type: 'checklist',
    category: 'pesquisa',
    whenToUse: 'Na primeira visita a um negócio que você quer prospectar, antes de propor qualquer coisa.',
    body: `BUSCA
- [ ] Procurei pelo nome do negócio + cidade e anotei o que aparece
- [ ] Verifiquei se há site próprio e se ele abre no celular
- [ ] Se não encontrei site, registrei como NÃO CONFIRMADO (não como inexistente)
- [ ] Tirei print de cada ponto observado, com a data

PERFIL PÚBLICO
- [ ] Telefone e endereço conferem com a realidade
- [ ] Horário de funcionamento está preenchido e atualizado
- [ ] Há fotos e elas representam o negócio atual
- [ ] Avaliações recentes: há resposta do negócio?

REDES
- [ ] Perfis ativos: data da última publicação
- [ ] Link da bio leva a algum lugar útil
- [ ] Informação de contato e horário aparece no perfil

CONCLUSÃO
- [ ] Separei o que é FATO OBSERVADO do que é SUPOSIÇÃO
- [ ] Priorizei no máximo 3 correções por impacto
- [ ] Anotei qual serviço meu resolve cada ponto, com faixa de esforço`,
    variables: [],
    tips: [
      'A frase "vocês não têm site" destrói a conversa quando o cliente tem um que você não achou. Use "não encontrei".',
      'Diagnóstico de 3 pontos é lido; de 15, não.',
    ],
    reviewCriteria: ['Toda observação tem print e data?', 'Nenhuma suposição está apresentada como fato?'],
  },
  {
    key: 'modelo-proposta',
    title: 'Modelo de proposta comercial',
    type: 'modelo',
    category: 'propostas',
    whenToUse: 'Como base para qualquer proposta — o Gerador de Ofertas já segue esta estrutura.',
    body: `# {{nome-da-proposta}}
Para: {{cliente}} · Validade: {{validade}}

## O problema
Descreva, na linguagem do cliente, a situação atual e o custo de mantê-la. Duas ou três frases.

## A solução
O que será feito, descrito pelo que o cliente recebe.

## Escopo
O que está incluído. E, logo abaixo, o que NÃO está incluído — esta é a seção que evita trabalho extra não pago.

## Entregáveis
- Item concreto que o cliente recebe
- Outro item concreto

## Prazo
{{prazo}} dias úteis contados a partir do recebimento do briefing e dos materiais.

## Revisões
{{revisoes}} rodadas de ajuste incluídas. Ajustes além disso são orçados à parte.

## Responsabilidades do cliente
- Envio dos materiais em até X dias
- Aprovação em até X dias por etapa
- Acesso às contas necessárias

## Investimento
{{valor}}, em {{condicoes-de-pagamento}}. Custos de terceiros (hospedagem, domínio, gráfica, assinaturas) não estão inclusos e ficam a cargo do cliente.

## Diferenciais
Apenas o que for verificável.

## Próximos passos
1. Aprovação desta proposta
2. Envio do briefing e dos materiais
3. Início da execução

## Para seguir
Uma frase direta com o que o cliente faz agora.`,
    variables: ['nome-da-proposta', 'cliente', 'validade', 'prazo', 'revisoes', 'valor', 'condicoes-de-pagamento'],
    tips: [
      'A seção "o que não está incluído" é a mais importante da proposta e a mais esquecida.',
      'Validade curta é honesta: seus custos e sua agenda mudam.',
    ],
    reviewCriteria: [
      'Prazo, revisões e responsabilidades do cliente estão explícitos?',
      'Há alguma promessa que depende de terceiros?',
    ],
  },
  {
    key: 'modelo-combinado-escopo',
    title: 'Modelo de combinado de escopo',
    type: 'modelo',
    category: 'propostas',
    whenToUse: 'Para registrar por escrito o que foi acordado antes de começar a executar.',
    body: `COMBINADO DE ESCOPO — {{projeto}}

Entre {{prestador}} e {{cliente}}, em {{data}}.

1. O QUE SERÁ ENTREGUE
   {{entregaveis}}

2. O QUE NÃO ESTÁ INCLUÍDO
   Liste explicitamente. Exemplo: produção de fotos, redação de textos, impressão, manutenção mensal.

3. PRAZO
   {{prazo}}, contado a partir do recebimento completo dos materiais listados no item 5.

4. REVISÕES
   {{revisoes}} rodadas. Ajustes adicionais: {{valor-hora-adicional}} por hora.

5. O QUE O CLIENTE ENVIA
   {{materiais-do-cliente}}, até {{data-limite-materiais}}. Atraso no envio desloca o prazo na mesma medida.

6. PAGAMENTO
   {{condicoes}}.

7. CUSTOS DE TERCEIROS
   Hospedagem, domínio, gráfica, licenças e assinaturas são contratados e pagos pelo cliente.

8. ENCERRAMENTO
   O projeto é considerado concluído com a aprovação dos entregáveis listados no item 1.

Assinaturas / confirmação por escrito de ambas as partes.`,
    variables: [
      'projeto',
      'prestador',
      'cliente',
      'data',
      'entregaveis',
      'prazo',
      'revisoes',
      'valor-hora-adicional',
      'materiais-do-cliente',
      'data-limite-materiais',
      'condicoes',
    ],
    tips: [
      'Este é um registro de combinado comercial, não um contrato revisado por advogado. Para valores altos ou cláusulas de responsabilidade, procure orientação jurídica.',
      'Confirmação por mensagem, com o texto completo, já vale muito mais do que combinar por áudio.',
    ],
    reviewCriteria: ['O item 2 está preenchido de verdade?', 'A regra de atraso de material está escrita?'],
  },
  {
    key: 'script-primeira-ligacao',
    title: 'Roteiro de primeira ligação',
    type: 'script',
    category: 'prospeccao',
    whenToUse: 'Quando o telefone comercial é público e a ligação é um caminho aceitável no segmento.',
    body: `ABERTURA (até 15 segundos)
"Oi, bom dia! Falo com o responsável por {{negocio}}? Meu nome é {{seu-nome}}, trabalho com {{servico}} aqui na região. Tem um minuto? Se estiver atendendo, eu ligo depois."

→ Se disser que está ocupado: "Sem problema, qual o melhor horário?" Anote e desligue. Ligue no horário combinado.

MOTIVO (até 30 segundos)
"Eu dei uma olhada em como o negócio de vocês aparece para quem procura na internet e notei {{observacao-verificada}}. Trabalho justamente com isso."

→ Fale apenas o que você verificou. Nunca afirme que o negócio não tem site se você não conferiu.

PERGUNTA (abre a conversa)
"Hoje, de onde vêm os seus clientes novos?"

→ Ouça. A resposta diz se há problema para resolver. Se não houver, agradeça e encerre.

PROPOSTA DE PRÓXIMO PASSO
"Posso te mandar por WhatsApp uma ideia do que dá para fazer, sem compromisso? Se fizer sentido, a gente conversa; se não, você me diz e eu não insisto."

ENCERRAMENTO
"Obrigado pelo tempo. Vou mandar agora pelo {{numero}}."

→ Mande em seguida, no mesmo dia. Registre a tentativa no CRM.

SE A RESPOSTA FOR NÃO
"Tudo bem, obrigado pela sinceridade. Bom trabalho aí!" — e encerre de verdade.`,
    variables: ['negocio', 'seu-nome', 'servico', 'observacao-verificada', 'numero'],
    tips: [
      'Ligar em horário de pico de atendimento queima a chance. Para restaurante, evite 11h–14h.',
      'Registre toda ligação no CRM no mesmo momento, inclusive as que não atenderam.',
    ],
    reviewCriteria: ['O roteiro cita só o que foi verificado?', 'Há saída digna para o "não"?'],
  },
  {
    key: 'script-follow-up',
    title: 'Sequência de follow-up sem ser inconveniente',
    type: 'script',
    category: 'prospeccao',
    whenToUse: 'Depois da proposta enviada, quando o cliente some — que é o caso mais comum.',
    body: `CONTATO 1 — 2 dias depois do envio
"Oi, {{nome}}! Só confirmando se a proposta chegou direito. Qualquer dúvida, é só me chamar."

→ Objetivo: confirmar recebimento. Não pergunte a decisão ainda.

CONTATO 2 — 5 dias depois
"Oi, {{nome}}! Sobre a proposta de {{servico}}: tem alguma parte que ficou confusa ou que faria sentido ajustar? Consigo adaptar o escopo."

→ Objetivo: destravar objeção silenciosa. Oferecer ajuste é melhor que repetir a cobrança.

CONTATO 3 — 10 dias depois
"Oi, {{nome}}! Imagino que a prioridade agora seja outra. Posso te procurar daqui a {{periodo}}? Deixo anotado e não te incomodo até lá."

→ Objetivo: encerrar o ciclo com uma data. Pergunta fechada é mais fácil de responder.

DEPOIS DO CONTATO 3
Pare. Mova a negociação para o estágio combinado no CRM, com a data de retomada. Insistir além disso custa mais do que rende.

REGRAS
- Nunca mais de 3 contatos sem resposta nenhuma.
- Nunca dois contatos no mesmo dia.
- Cada mensagem traz algo novo: confirmação, ajuste ou saída.
- Se pedirem para não entrar em contato, encerre e registre.`,
    variables: ['nome', 'servico', 'periodo'],
    tips: [
      'Follow-up que só repete "e aí, viu minha proposta?" treina o cliente a ignorar você.',
      'A terceira mensagem, com data para retomar, costuma ser a que recebe resposta.',
    ],
    reviewCriteria: ['Cada contato acrescenta algo?', 'Há um ponto de parada definido?'],
  },
  {
    key: 'prompt-planejamento-conteudo',
    title: 'Planejamento de conteúdo ligado ao calendário comercial',
    type: 'prompt',
    category: 'redes',
    whenToUse: 'No início do trimestre, para o conteúdo puxar o que o negócio quer vender.',
    body: '',
    variables: ['negocio', 'trimestre', 'metas'],
    tips: ['Confirme as datas com o responsável comercial: data comemorativa varia por região e por segmento.'],
    reviewCriteria: ['Cada semana tem um objetivo comercial claro?', 'O volume é executável pela equipe que existe?'],
    draft: {
      role: 'Você é planejador de conteúdo para pequenos negócios, prático e realista quanto a volume.',
      context: 'O negócio é {{negocio}}. Vou planejar o trimestre {{trimestre}}. As metas comerciais são: {{metas}}.',
      goal: 'Montar um calendário de conteúdo de três meses ligado às metas comerciais.',
      inputs: ['Metas do período', 'Sazonalidade do segmento', 'Capacidade real de produção por semana'],
      method: [
        'Defina 3 ou 4 pilares de conteúdo e explique o papel de cada um.',
        'Distribua os temas por semana, conectando cada semana a uma meta.',
        'Marque as datas sazonais relevantes para o segmento e a região.',
        'Indique o que medir ao final de cada mês.',
      ],
      constraints: [
        'Não ultrapasse a capacidade de produção informada.',
        'Nada de meta de seguidores ou alcance como objetivo principal.',
        'Não presuma datas comemorativas regionais sem confirmar.',
      ],
      quality: ['Cada semana tem objetivo comercial explícito.', 'O plano é executável por uma pessoa só.'],
      outputFormat: 'Tabela por semana: tema, pilar, formato, objetivo comercial e indicador.',
      review: 'Verifique se o volume semanal cabe na capacidade informada; ajuste para menos se não couber.',
    },
  },
  {
    key: 'prompt-apresentacao-comercial',
    title: 'Estrutura de apresentação comercial',
    type: 'prompt',
    category: 'propostas',
    whenToUse: 'Quando o cliente vende para outras empresas e precisa de material para reunião.',
    body: '',
    variables: ['empresa', 'publico-da-reuniao', 'objetivo-da-reuniao'],
    tips: ['Monte a estrutura e aprove antes de desenhar: refazer slide pronto custa caro.'],
    reviewCriteria: ['Cada slide tem uma ideia só?', 'Os números apresentados são verificáveis?'],
    draft: {
      role: 'Você estrutura apresentações comerciais objetivas, no estilo de quem tem 20 minutos de reunião.',
      context: 'A empresa é {{empresa}}. A apresentação será feita para {{publico-da-reuniao}}, com o objetivo de {{objetivo-da-reuniao}}.',
      goal: 'Definir a sequência de slides e o conteúdo de cada um.',
      inputs: ['O que a empresa faz e para quem', 'Provas verificáveis (casos, números, certificações)', 'Objeções esperadas'],
      method: [
        'Abra pelo problema do cliente, nunca pela história da empresa.',
        'Uma ideia por slide, com um título que já diga a conclusão.',
        'Coloque a prova logo depois da afirmação que ela sustenta.',
        'Reserve os dois últimos slides para proposta de próximo passo e contato.',
      ],
      constraints: [
        'Máximo de 12 slides.',
        'Nenhum número sem fonte ou sem que a empresa possa comprová-lo.',
        'Sem slide de "missão, visão e valores" a menos que o cliente peça.',
      ],
      quality: ['A apresentação faz sentido se alguém só ler os títulos.', 'Toda afirmação forte tem prova ao lado.'],
      outputFormat: 'Lista de slides: número, título, conteúdo, elemento visual sugerido e o que falar.',
      review: 'Identifique o slide mais fraco e proponha uma alternativa.',
    },
  },

  {
    key: 'prompt-descricao-produto',
    title: 'Descrições de produto para catálogo',
    type: 'prompt',
    category: 'copy',
    whenToUse: 'Ao montar catálogo ou loja, quando o cliente entrega só nome e preço dos produtos.',
    body: '',
    variables: ['loja', 'publico'],
    tips: ['Peça as medidas e materiais antes: descrição sem isso gera troca e devolução.'],
    reviewCriteria: ['Toda descrição usa só informação fornecida?', 'O tamanho é uniforme entre os itens?'],
    draft: {
      role: 'Você escreve descrições de produto objetivas, que ajudam a decidir a compra.',
      context: 'A loja é {{loja}} e o público é {{publico}}. Vou fornecer a lista de produtos com atributos.',
      goal: 'Escrever uma descrição curta por produto, com o que o comprador precisa saber.',
      inputs: ['Nome e categoria de cada produto', 'Medidas, materiais e variações', 'Preço e condições'],
      method: [
        'Comece pelo uso principal do produto.',
        'Inclua medida, material e variação quando existirem nos dados.',
        'Termine com uma informação que remova dúvida de compra.',
      ],
      constraints: [
        'Máximo de 35 palavras por produto.',
        'Nenhum atributo que não esteja nos dados fornecidos.',
        'Sem superlativo e sem promessa de resultado.',
      ],
      quality: ['O comprador decide sem precisar perguntar medida ou material.', 'Nenhuma descrição inventa atributo.'],
      outputFormat: 'Tabela: produto, descrição, atributos destacados.',
      review: 'Liste ao final os produtos cujos dados vieram incompletos.',
    },
  },
  {
    key: 'prompt-faq-site',
    title: 'Perguntas frequentes para o site',
    type: 'prompt',
    category: 'sites',
    whenToUse: 'Ao montar site ou landing page, para reduzir a pergunta repetida no atendimento.',
    body: '',
    variables: ['negocio', 'servico'],
    tips: ['A melhor fonte de FAQ é a caixa de mensagens do cliente, não a sua imaginação.'],
    reviewCriteria: ['Cada resposta resolve a dúvida sem gerar outra?', 'Há resposta para preço e prazo?'],
    draft: {
      role: 'Você escreve seções de perguntas frequentes claras e honestas.',
      context: 'O negócio é {{negocio}} e o serviço em questão é {{servico}}.',
      goal: 'Escrever a seção de perguntas frequentes do site.',
      inputs: ['Perguntas reais recebidas pelo negócio', 'Políticas de prazo, pagamento e garantia', 'O que o negócio não faz'],
      method: [
        'Ordene da pergunta mais frequente para a menos frequente.',
        'Responda primeiro e explique depois.',
        'Inclua as perguntas incômodas (preço, prazo, o que não está incluído).',
      ],
      constraints: [
        'Máximo de 10 perguntas.',
        'Resposta de no máximo 3 linhas.',
        'Nenhuma política que eu não tenha informado.',
      ],
      quality: ['Nenhuma resposta cria uma dúvida nova.', 'As perguntas difíceis não foram evitadas.'],
      outputFormat: 'Lista de pergunta e resposta, pronta para colar no site.',
      review: 'Aponte quais perguntas precisam de confirmação do cliente antes de publicar.',
    },
  },
  {
    key: 'prompt-video-vendas',
    title: 'Roteiro de vídeo de apresentação de serviço',
    type: 'prompt',
    category: 'video',
    whenToUse: 'Para o vídeo que explica o serviço em um minuto, usado no site e no atendimento.',
    body: '',
    variables: ['servico', 'publico', 'duracao'],
    tips: ['Grave em duas versões: uma para o site e uma para enviar no WhatsApp.'],
    reviewCriteria: ['A promessa é cumprível?', 'A chamada final é uma ação só?'],
    draft: {
      role: 'Você escreve roteiros de vídeo de apresentação, com linguagem falada e ritmo rápido.',
      context: 'O serviço é {{servico}}, para {{publico}}, com duração-alvo de {{duracao}}.',
      goal: 'Produzir o roteiro completo, com marcação de tempo.',
      inputs: ['O que o serviço entrega', 'Objeções mais comuns', 'Ação desejada ao final'],
      method: [
        'Abra com o problema, na linguagem de quem assiste.',
        'Mostre o que muda com o serviço, sem jargão.',
        'Responda a objeção mais forte em uma frase.',
        'Feche com uma única ação.',
      ],
      constraints: [
        'Respeitar a duração-alvo quando lido em voz alta.',
        'Sem promessa de resultado financeiro.',
        'Frases de no máximo 12 palavras.',
      ],
      quality: ['O roteiro funciona lido em voz alta no tempo previsto.', 'Uma pessoa de fora entende o serviço.'],
      outputFormat: 'Roteiro com marcação de tempo, indicação de imagem e texto na tela.',
      review: 'Cronometrar a leitura e apontar o que precisa ser cortado.',
    },
  },
  {
    key: 'prompt-resumo-reuniao',
    title: 'Resumo de reunião com decisões e responsáveis',
    type: 'prompt',
    category: 'operacao',
    whenToUse: 'Logo depois da reunião com cliente, para registrar o combinado por escrito.',
    body: '',
    variables: ['cliente', 'projeto'],
    tips: ['Envie o resumo no mesmo dia e peça confirmação: é o que vale quando a memória diverge.'],
    reviewCriteria: ['Toda decisão tem responsável e prazo?', 'O que ficou em aberto está listado?'],
    draft: {
      role: 'Você transforma anotações de reunião em registro objetivo de decisões.',
      context: 'Reunião com {{cliente}} sobre {{projeto}}. Vou colar a transcrição ou minhas anotações.',
      goal: 'Produzir o resumo com decisões, responsáveis, prazos e pendências.',
      inputs: ['Transcrição ou anotações', 'Participantes', 'Combinados anteriores relevantes'],
      method: [
        'Separe decisões tomadas de assuntos apenas discutidos.',
        'Para cada decisão, registre responsável e prazo.',
        'Liste as pendências que impedem o avanço.',
        'Escreva uma linha final com o próximo passo.',
      ],
      constraints: [
        'Não invente responsável nem prazo que não apareceu.',
        'Marque como "a confirmar" o que ficou ambíguo.',
        'Máximo de uma página.',
      ],
      quality: ['Quem não participou entende o que foi decidido.', 'Nada foi atribuído sem base na conversa.'],
      outputFormat: 'Blocos: decisões, responsáveis e prazos, pendências, próximo passo.',
      review: 'Liste as frases da reunião que ficaram ambíguas e precisam de confirmação.',
    },
  },
  {
    key: 'prompt-proposta-rascunho',
    title: 'Rascunho de proposta a partir do briefing',
    type: 'prompt',
    category: 'propostas',
    whenToUse: 'Depois do briefing, para transformar as anotações em primeira versão da proposta.',
    body: '',
    variables: ['cliente', 'servico', 'prazo', 'revisoes'],
    tips: ['Preço nunca sai daqui: calcule na calculadora e insira você mesmo.'],
    reviewCriteria: ['O que está fora do escopo está escrito?', 'Há responsabilidade do cliente listada?'],
    draft: {
      role: 'Você estrutura propostas comerciais claras para prestadores de serviço autônomos.',
      context: 'Cliente: {{cliente}}. Serviço: {{servico}}. Prazo pretendido: {{prazo}}. Revisões: {{revisoes}}.',
      goal: 'Escrever o rascunho da proposta a partir das anotações do briefing.',
      inputs: ['Anotações do briefing', 'Entregáveis combinados', 'Materiais que o cliente precisa enviar'],
      method: [
        'Comece pelo problema na linguagem do cliente.',
        'Descreva a solução pelo que ele recebe.',
        'Liste entregáveis e, logo depois, o que NÃO está incluído.',
        'Registre prazo condicionado ao envio de material e número de revisões.',
      ],
      constraints: [
        'Não preencha o preço — deixe o campo marcado para eu completar.',
        'Nenhuma promessa de resultado.',
        'Nada que não tenha aparecido no briefing.',
      ],
      quality: ['O cliente não precisa perguntar o que está incluído.', 'As responsabilidades dele estão escritas.'],
      outputFormat: 'Documento com seções: problema, solução, escopo, fora do escopo, entregáveis, prazo, revisões, responsabilidades, próximos passos.',
      review: 'Aponte o que ficou faltando do briefing para a proposta ficar completa.',
    },
  },
  {
    key: 'prompt-relatorio-diagnostico',
    title: 'Relatório de diagnóstico de presença digital',
    type: 'prompt',
    category: 'pesquisa',
    whenToUse: 'Depois de coletar as evidências do diagnóstico, para escrever o relatório do cliente.',
    body: '',
    variables: ['negocio', 'data'],
    tips: ['Entregue com print de cada ponto: observação sem evidência vira discussão.'],
    reviewCriteria: ['Fato e interpretação estão separados?', 'As correções estão priorizadas?'],
    draft: {
      role: 'Você escreve diagnósticos objetivos, separando fato observado de recomendação.',
      context: 'Diagnóstico do negócio {{negocio}}, feito em {{data}}. Vou colar as observações coletadas.',
      goal: 'Produzir o relatório com situação atual, oportunidades e prioridades.',
      inputs: ['Observações com data e fonte', 'Capturas de tela', 'Serviços que eu ofereço'],
      method: [
        'Classifique cada ponto: existe, incompleto, não encontrado, não confirmado.',
        'Priorize no máximo três correções por impacto e esforço.',
        'Relacione cada correção a um serviço que eu executo.',
      ],
      constraints: [
        'Nunca afirmar que a empresa não tem site; use "não encontrado".',
        'Nenhuma observação sem fonte.',
        'Máximo de duas páginas.',
      ],
      quality: ['O cliente entende o que está perdendo hoje.', 'Toda afirmação pode ser verificada.'],
      outputFormat: 'Relatório: situação atual, pontos observados com evidência, três prioridades, próximos passos.',
      review: 'Verifique se alguma frase afirma algo que não foi observado.',
    },
  },
  {
    key: 'prompt-cobranca',
    title: 'Mensagem de cobrança que preserva a relação',
    type: 'prompt',
    category: 'atendimento',
    whenToUse: 'Quando o pagamento atrasa e você precisa cobrar sem queimar o cliente.',
    body: '',
    variables: ['cliente', 'valor-referencia', 'dias-de-atraso'],
    tips: ['Cobre por escrito e com o combinado anexo: evita a conversa de "não foi isso que combinamos".'],
    reviewCriteria: ['O tom é firme sem ser agressivo?', 'Há caminho de solução oferecido?'],
    draft: {
      role: 'Você escreve mensagens de cobrança firmes, educadas e sem constrangimento.',
      context: 'Cliente {{cliente}}, referente a {{valor-referencia}}, com {{dias-de-atraso}} dias de atraso.',
      goal: 'Escrever a sequência de cobrança em três contatos.',
      inputs: ['O que foi combinado e quando', 'Comprovantes de entrega', 'Histórico da relação'],
      method: [
        'Primeiro contato: lembrete neutro, assumindo esquecimento.',
        'Segundo contato: retomada com o combinado por escrito e oferta de parcelamento.',
        'Terceiro contato: posição clara sobre a continuidade do trabalho, sem ameaça.',
      ],
      constraints: [
        'Nenhuma ameaça, ironia ou exposição.',
        'Não citar medida judicial sem orientação jurídica.',
        'Cada mensagem cabe em uma tela.',
      ],
      quality: ['Dá para enviar sem reler com vergonha.', 'Toda mensagem oferece um caminho de solução.'],
      outputFormat: 'Três mensagens, com intervalo sugerido entre elas.',
      review: 'Releia procurando qualquer frase que soe agressiva e reescreva.',
    },
  },
  {
    key: 'prompt-anuncio-texto',
    title: 'Textos de anúncio em variações para teste',
    type: 'prompt',
    category: 'copy',
    whenToUse: 'Ao preparar campanha paga, para testar ângulos em vez de apostar em um texto só.',
    body: '',
    variables: ['oferta', 'publico', 'acao'],
    tips: ['Teste um ângulo por vez: trocar texto e imagem juntos impede saber o que funcionou.'],
    reviewCriteria: ['Cada variação testa um ângulo diferente?', 'As regras da plataforma foram respeitadas?'],
    draft: {
      role: 'Você escreve textos de anúncio curtos, dentro das regras das plataformas.',
      context: 'A oferta é {{oferta}}, o público é {{publico}} e a ação desejada é {{acao}}.',
      goal: 'Produzir variações de texto de anúncio, cada uma com um ângulo diferente.',
      inputs: ['Oferta e condições reais', 'Diferenciais verificáveis', 'Objeções conhecidas'],
      method: [
        'Crie uma variação por ângulo: dor, benefício, prova, objeção, novidade.',
        'Para cada uma, escreva título curto, texto principal e chamada.',
        'Explique em uma linha o que cada variação está testando.',
      ],
      constraints: [
        'Sem promessa de resultado e sem afirmação sobre a condição pessoal de quem vê.',
        'Título de no máximo 40 caracteres.',
        'Nada de urgência inventada.',
      ],
      quality: ['Cada variação testa uma hipótese identificável.', 'Nenhum texto viola regra de plataforma.'],
      outputFormat: 'Tabela: ângulo, título, texto, chamada, hipótese testada.',
      review: 'Aponte qual variação testar primeiro e por quê.',
    },
  },
  {
    key: 'prompt-persona',
    title: 'Mapa do cliente a partir de entrevistas',
    type: 'prompt',
    category: 'pesquisa',
    whenToUse: 'Antes de escrever qualquer comunicação, depois de conversar com clientes reais do negócio.',
    body: '',
    variables: ['negocio', 'quantidade-entrevistas'],
    tips: ['Entreviste três clientes reais. Persona inventada produz comunicação inventada.'],
    reviewCriteria: ['Cada afirmação vem de uma entrevista?', 'As palavras são dos clientes?'],
    draft: {
      role: 'Você organiza pesquisa qualitativa sem inventar o que não foi dito.',
      context: 'Negócio {{negocio}}. Fiz {{quantidade-entrevistas}} entrevistas e vou colar as transcrições.',
      goal: 'Produzir o mapa do cliente: dores, objeções, critérios de decisão e vocabulário.',
      inputs: ['Transcrições das entrevistas', 'Perfil de quem foi entrevistado'],
      method: [
        'Extraia frases literais que apareçam em mais de uma entrevista.',
        'Agrupe por dor, objeção, critério de decisão e expectativa.',
        'Separe o que apareceu uma única vez — pode ser exceção.',
      ],
      constraints: [
        'Nenhuma característica que não tenha aparecido nas entrevistas.',
        'Nada de dados demográficos inventados.',
        'Cite a entrevista de origem de cada agrupamento.',
      ],
      quality: ['Todo item tem origem rastreável.', 'As palavras usadas são as dos entrevistados.'],
      outputFormat: 'Mapa com quatro blocos e, em cada um, as frases literais que o sustentam.',
      review: 'Aponte o que precisa de mais entrevistas para virar conclusão.',
    },
  },
  {
    key: 'prompt-roteiro-treinamento',
    title: 'Roteiro de treinamento da equipe do cliente',
    type: 'prompt',
    category: 'operacao',
    whenToUse: 'Ao entregar um serviço que a equipe do cliente vai operar depois.',
    body: '',
    variables: ['ferramenta', 'equipe', 'tempo'],
    tips: ['Treinamento sem material de consulta é esquecido em uma semana.'],
    reviewCriteria: ['Há exercício prático?', 'O material de consulta cabe em uma página?'],
    draft: {
      role: 'Você monta treinamentos práticos e curtos para equipes sem perfil técnico.',
      context: 'Vou treinar {{equipe}} para usar {{ferramenta}}, em {{tempo}} de sessão.',
      goal: 'Produzir o roteiro do treinamento com exercícios e material de consulta.',
      inputs: ['O que a equipe precisa conseguir fazer sozinha', 'Erros que já aconteceram', 'Nível de familiaridade com tecnologia'],
      method: [
        'Comece pelo que a pessoa faz no primeiro dia, não pela teoria.',
        'Alterne demonstração e exercício.',
        'Termine com um roteiro de consulta rápida de uma página.',
      ],
      constraints: [
        'Caber no tempo informado.',
        'Sem jargão técnico não explicado.',
        'Máximo de cinco tarefas ensinadas.',
      ],
      quality: ['Ao fim, a pessoa executa sozinha a tarefa principal.', 'O material de consulta cabe em uma página.'],
      outputFormat: 'Roteiro com blocos de tempo, demonstrações, exercícios e a folha de consulta.',
      review: 'Aponte o que fica de fora por falta de tempo e precisa de uma segunda sessão.',
    },
  },
  {
    key: 'checklist-briefing-reuniao',
    title: 'Checklist da reunião de briefing',
    type: 'checklist',
    category: 'entregas',
    whenToUse: 'Antes, durante e depois da reunião de briefing com o cliente.',
    body: `ANTES
- [ ] Pesquisei o negócio: site, perfis, avaliações e concorrentes
- [ ] Separei duas ou três perguntas difíceis (prazo, aprovação, material)
- [ ] Combinei duração e quem precisa participar
- [ ] Pedi autorização para gravar, se for gravar

DURANTE
- [ ] Perguntei o que o cliente espera ver pronto no fim
- [ ] Perguntei QUEM aprova e em quanto tempo
- [ ] Perguntei QUE material ele envia e ATÉ QUANDO
- [ ] Perguntei o que está fora do escopo na cabeça dele
- [ ] Perguntei se há restrição de marca, linguagem ou obrigação legal
- [ ] Anotei as frases literais do cliente sobre o problema
- [ ] Confirmei orçamento disponível ou faixa aceitável

DEPOIS
- [ ] Enviei o resumo por escrito no mesmo dia
- [ ] Pedi confirmação explícita do resumo
- [ ] Registrei premissas assumidas onde faltou resposta
- [ ] Atualizei a negociação no CRM com a próxima ação e a data`,
    variables: [],
    tips: [
      'As três perguntas que mais evitam retrabalho: quem aprova, quem envia material e o que está fora do escopo.',
      'Frase literal do cliente é matéria-prima da proposta e da copy. Anote como ele falou.',
    ],
    reviewCriteria: ['Todas as perguntas difíceis foram feitas?', 'O resumo foi confirmado por escrito?'],
  },
  {
    key: 'checklist-lancamento-campanha',
    title: 'Checklist de lançamento de campanha',
    type: 'checklist',
    category: 'redes',
    whenToUse: 'No dia anterior ao início de uma campanha paga ou de um lançamento de conteúdo.',
    body: `OFERTA
- [ ] Preço, condição e prazo conferidos com quem vende
- [ ] Estoque ou capacidade de atendimento confirmados
- [ ] Equipe avisada de que a campanha começa e do que responder

DESTINO
- [ ] Página ou perfil de destino testado em celular e computador
- [ ] Botão de contato testado de ponta a ponta
- [ ] Formulário, se houver, enviando para quem vai responder
- [ ] Tempo de carregamento aceitável no celular

PEÇAS
- [ ] Textos revisados por outra pessoa
- [ ] Nenhuma afirmação sem prova
- [ ] Imagens no formato correto de cada posição
- [ ] Variações nomeadas para identificar o que foi testado

MEDIÇÃO
- [ ] Definido o que será medido e onde o número é lido
- [ ] Combinado quem reporta o resultado e com que frequência
- [ ] Data de revisão marcada na agenda`,
    variables: [],
    tips: [
      'Campanha com destino quebrado queima verba em horas. Teste o caminho inteiro antes.',
      'Avisar a equipe que a campanha começa evita o pior desperdício: contato que chega e não é atendido.',
    ],
    reviewCriteria: ['O caminho do clique até o contato foi testado de verdade?'],
  },
  {
    key: 'checklist-revisao-proposta',
    title: 'Checklist de revisão da proposta antes do envio',
    type: 'checklist',
    category: 'propostas',
    whenToUse: 'Cinco minutos antes de enviar qualquer proposta.',
    body: `CONTEÚDO
- [ ] Nome do cliente correto em todos os lugares
- [ ] Problema descrito na linguagem dele, não na minha
- [ ] Entregáveis concretos e verificáveis
- [ ] O que NÃO está incluído está escrito
- [ ] Nenhuma promessa que depende de terceiros

CONDIÇÕES
- [ ] Preço conferido com a calculadora, não estimado de cabeça
- [ ] Prazo condicionado ao recebimento do material
- [ ] Número de revisões definido
- [ ] Forma de pagamento e validade da proposta
- [ ] Custos de terceiros explicitamente fora (hospedagem, gráfica, assinaturas)

FORMA
- [ ] Revisão de ortografia feita
- [ ] Arquivo abre no celular
- [ ] Próximo passo claro e único
- [ ] Combinado quando farei o follow-up`,
    variables: [],
    tips: [
      'Proposta sem número de revisões é a origem mais comum de trabalho não pago.',
      'Marque o follow-up na agenda antes de enviar. Depois do envio, a vida atropela.',
    ],
    reviewCriteria: ['O cliente consegue dizer sim sem fazer nenhuma pergunta?'],
  },
  {
    key: 'checklist-onboarding-cliente',
    title: 'Checklist de início de projeto com cliente novo',
    type: 'checklist',
    category: 'entregas',
    whenToUse: 'Nas primeiras 48 horas depois do aceite da proposta.',
    body: `FORMALIZAÇÃO
- [ ] Aceite da proposta registrado por escrito
- [ ] Combinado de escopo enviado e confirmado
- [ ] Forma e data de pagamento acordadas
- [ ] Negociação movida para "fechado" no CRM e projeto aberto

ACESSOS E MATERIAIS
- [ ] Lista do que preciso receber enviada, com prazo
- [ ] Acessos solicitados com usuário próprio (não a senha do dono)
- [ ] Canal de comunicação definido (e qual não usar)
- [ ] Responsável por aprovar definido pelo nome

EXPECTATIVA
- [ ] Cronograma com as datas principais enviado
- [ ] Explicado o que acontece se o material atrasar
- [ ] Explicado quantas revisões estão incluídas
- [ ] Combinada a frequência de atualização de andamento`,
    variables: [],
    tips: [
      'As primeiras 48 horas definem o tom do projeto inteiro. Cliente que recebe organização devolve organização.',
      'Pedir acesso próprio, e não a senha do dono, protege os dois lados.',
    ],
    reviewCriteria: ['Tudo o que pode travar o projeto já foi pedido?'],
  },
  {
    key: 'script-reuniao-diagnostico',
    title: 'Roteiro da reunião de diagnóstico',
    type: 'script',
    category: 'prospeccao',
    whenToUse: 'Na primeira conversa com um cliente interessado, antes de falar de preço.',
    body: `ABERTURA (2 minutos)
"Obrigado pelo tempo. Minha ideia hoje é entender como funciona o negócio de vocês e ver se o que eu faço ajuda de verdade. Se não ajudar, eu falo e não tomo mais seu tempo."

→ Dizer isso no começo reduz a defesa de quem acha que vai receber uma venda empurrada.

ENTENDER (10 minutos — fale pouco)
1. "Como chegam os clientes de vocês hoje?"
2. "O que mais consome tempo da equipe no dia a dia?"
3. "Quando alguém procura vocês na internet, o que encontra?"
4. "O que vocês já tentaram nessa área? O que deu certo e o que não deu?"

→ Anote frases literais. Elas voltam na proposta.

DEVOLVER (5 minutos)
"Pelo que entendi, o ponto mais caro hoje é {{problema}}. É isso mesmo, ou tem algo mais urgente?"

→ Confirme antes de propor. Diagnóstico errado derruba a melhor proposta.

PROPOR O PRÓXIMO PASSO (3 minutos)
"Consigo montar uma proposta com escopo e prazo até {{data}}. Topa receber e a gente conversa de novo?"

→ Não dê preço de cabeça na reunião. Calcule depois, com os números na frente.

SE NÃO HOUVER ENCAIXE
"Pelo que você descreveu, acho que o que eu faço não é a prioridade de vocês agora. Prefiro te falar isso do que te vender algo que não resolve."

→ Recusar trabalho que não encaixa é o que constrói indicação.`,
    variables: ['problema', 'data'],
    tips: [
      'Regra dos dois terços: o cliente fala mais do que você. Se foi o contrário, você vendeu antes de entender.',
      'Nunca dê preço na primeira reunião sem ter calculado. O número dito de boca vira âncora.',
    ],
    reviewCriteria: ['O diagnóstico foi confirmado com o cliente antes da proposta?'],
  },
  {
    key: 'script-atraso-entrega',
    title: 'Roteiro para avisar atraso na entrega',
    type: 'script',
    category: 'atendimento',
    whenToUse: 'No momento em que você percebe que o prazo não será cumprido — não no dia do prazo.',
    body: `QUANDO AVISAR
No instante em que você tem certeza. Avisar com antecedência é um problema de projeto; avisar em cima da hora é um problema de confiança.

A MENSAGEM

"Oi, {{cliente}}. Preciso te avisar de um ajuste no prazo: {{entrega}} ficará pronta em {{nova-data}}, e não em {{data-original}}.

O motivo: {{motivo-objetivo}}.

O que já está pronto: {{o-que-esta-pronto}}.

Para compensar, {{compensacao}}.

Isso impacta algo do seu lado que eu precise ajudar a reorganizar?"

REGRAS
- Uma data nova, firme. Nada de "semana que vem" vago.
- Motivo objetivo, sem desculpa longa e sem culpar terceiros gratuitamente.
- Mostre o que já está pronto: atraso com progresso visível assusta menos.
- Ofereça algo concreto quando o atraso for culpa sua.
- Pergunte o impacto do lado dele: às vezes a data era crítica e precisa de outra solução.

O QUE NÃO FAZER
- Sumir até o dia do prazo.
- Prometer uma data que você também não vai cumprir.
- Culpar o cliente pelo atraso dele sem ter avisado na hora em que aconteceu.`,
    variables: ['cliente', 'entrega', 'nova-data', 'data-original', 'motivo-objetivo', 'o-que-esta-pronto', 'compensacao'],
    tips: [
      'Atraso avisado cedo custa uma conversa. Atraso descoberto pelo cliente custa o próximo projeto.',
      'Se o atraso veio de material que o cliente não enviou, mostre o registro — por isso se registra tudo.',
    ],
    reviewCriteria: ['A nova data é realista com folga?', 'Há um pedido de impacto do lado do cliente?'],
  },
  {
    key: 'modelo-briefing-site',
    title: 'Formulário de briefing para site',
    type: 'modelo',
    category: 'sites',
    whenToUse: 'Para enviar ao cliente antes da reunião, ou preencher junto com ele.',
    body: `BRIEFING DE SITE — {{negocio}}

1. O NEGÓCIO
   1.1 O que vocês fazem, em uma frase?
   1.2 Quem é o cliente de vocês?
   1.3 O que vocês fazem melhor que o concorrente da esquina?

2. O SITE
   2.1 Qual é a ação principal que o visitante deve tomar?
   2.2 Quais seções o site precisa ter?
   2.3 Existe site atual? O que deve ser mantido?
   2.4 Sites de referência (dois ou três) e o que vocês gostam neles

3. CONTEÚDO
   3.1 Quem escreve os textos?
   3.2 Quem fornece as fotos? Em que formato?
   3.3 Existe logo em arquivo vetorial? Manual de marca?
   3.4 Data limite de envio do material: ____/____

4. TÉCNICO
   4.1 Existe domínio registrado? Em nome de quem?
   4.2 Existe hospedagem contratada? Quem tem o acesso?
   4.3 Quais contatos aparecem no site?
   4.4 Quem vai atualizar o site depois da entrega?

5. PROJETO
   5.1 Quem aprova? Em quantos dias?
   5.2 Existe data limite ligada a algum evento?
   5.3 O que, na visão de vocês, está FORA deste trabalho?

PREMISSAS ASSUMIDAS (preenchido por mim)
- ___________________________________________

CONFIRMAÇÃO
Confirmo que as informações acima refletem o combinado.
Nome: ______________________  Data: ____/____`,
    variables: ['negocio'],
    tips: [
      'Envie por mensagem e preencha junto por chamada: cliente escreve pouco e fala muito.',
      'O campo de premissas é o que protege seu preço quando a resposta não vem.',
    ],
    reviewCriteria: ['Os campos de aprovação e de prazo de material foram preenchidos?'],
  },
  {
    key: 'modelo-cronograma',
    title: 'Modelo de cronograma de entrega',
    type: 'modelo',
    category: 'entregas',
    whenToUse: 'No início do projeto, junto com o combinado de escopo.',
    body: `CRONOGRAMA — {{projeto}}

Início condicionado ao recebimento de: {{materiais}}
Data de recebimento: ____/____   (atraso desloca todas as datas abaixo)

| Etapa | Responsável | Prazo | Status |
| --- | --- | --- | --- |
| Briefing e coleta de material | Cliente | ____/____ | |
| Estrutura aprovada | Eu + cliente | ____/____ | |
| Produção | Eu | ____/____ | |
| Entrega para revisão | Eu | ____/____ | |
| Retorno da revisão 1 | Cliente | ____/____ | |
| Ajustes | Eu | ____/____ | |
| Retorno da revisão 2 | Cliente | ____/____ | |
| Publicação / entrega final | Eu | ____/____ | |

REGRAS DO CRONOGRAMA
- Cada dia de atraso no retorno do cliente desloca a entrega em um dia.
- Revisões incluídas: {{revisoes}}. Ajustes além disso são orçados à parte.
- Mudança de escopo durante a execução gera novo prazo e novo orçamento.

COMUNICAÇÃO
- Atualização de andamento: {{frequencia}}
- Canal: {{canal}}`,
    variables: ['projeto', 'materiais', 'revisoes', 'frequencia', 'canal'],
    tips: [
      'A linha "atraso do cliente desloca a entrega" evita noventa por cento das discussões de prazo.',
      'Datas de retorno do cliente também são datas do projeto. Coloque-as na tabela.',
    ],
    reviewCriteria: ['As datas de responsabilidade do cliente estão no cronograma?'],
  },
  {
    key: 'modelo-relatorio-mensal',
    title: 'Modelo de relatório mensal para o cliente',
    type: 'modelo',
    category: 'entregas',
    whenToUse: 'Todo mês, em serviços recorrentes, antes da renovação da mensalidade.',
    body: `RELATÓRIO — {{cliente}} — {{mes}}

1. O QUE FOI FEITO
   - ____________________________
   - ____________________________
   - ____________________________

2. NÚMEROS
   | Indicador | Mês atual | Mês anterior | Fonte |
   | --- | --- | --- | --- |
   | Contatos recebidos | | | |
   | {{indicador-2}} | | | |
   | {{indicador-3}} | | | |

   Observação: números lidos em {{data-da-leitura}}, nas fontes citadas.

3. O QUE ISSO SUGERE
   Duas ou três frases, separando o que é fato do que é interpretação.

4. PRÓXIMAS AÇÕES
   1. ____________________________
   2. ____________________________
   3. ____________________________

5. O QUE PRECISO DE VOCÊS
   - ____________________________

Dúvidas sobre qualquer número deste relatório: me chame que eu mostro de onde ele saiu.`,
    variables: ['cliente', 'mes', 'indicador-2', 'indicador-3', 'data-da-leitura'],
    tips: [
      'Três indicadores bem escolhidos valem mais que vinte. Prefira contatos e pedidos a alcance e seguidores.',
      'Relatório entregue antes da cobrança transforma a renovação em consequência, não em negociação.',
    ],
    reviewCriteria: ['Cada número tem fonte e data?', 'As próximas ações cabem no próximo mês?'],
  },
] as const

export function materialByKey(key: string): LibraryMaterial | undefined {
  return LIBRARY.find((material) => material.key === key)
}
