/**
 * Academia Método IA.
 *
 * Conteúdo educativo com um critério: cada aula precisa mudar alguma decisão
 * que o usuário toma dentro do próprio aplicativo. Por isso quase toda aula
 * aponta para o módulo onde aquilo é aplicado.
 */

export type TrackKey = 'ia' | 'marketing' | 'vendas' | 'servicos'

export interface Track {
  key: TrackKey
  label: string
  summary: string
}

export const TRACKS: readonly Track[] = [
  { key: 'ia', label: 'Inteligência artificial', summary: 'O que a IA faz, o que ela não faz e como pedir bem.' },
  { key: 'marketing', label: 'Marketing', summary: 'Público, oferta, posicionamento e o texto que vende.' },
  { key: 'vendas', label: 'Vendas', summary: 'Da prospecção ao fechamento, sem técnica de pressão.' },
  { key: 'servicos', label: 'Prestação de serviços', summary: 'Escopo, preço, prazo, entrega e portfólio.' },
] as const

export interface Lesson {
  key: string
  track: TrackKey
  title: string
  summary: string
  /** Parágrafos do conteúdo. */
  body: string[]
  example: string
  mistakes: string[]
  /** Módulo do app onde isso é aplicado. */
  moduleKey?: string
  moduleLabel?: string
  terms: string[]
}

export const LESSONS: readonly Lesson[] = [
  {
    key: 'o-que-e-ia',
    track: 'ia',
    title: 'O que um modelo de linguagem realmente faz',
    summary: 'Ele prevê a continuação mais provável de um texto. Isso explica tanto o que ele acerta quanto o que ele erra.',
    body: [
      'Um modelo de linguagem foi treinado para continuar textos. Quando você pede um e-mail de cobrança, ele não "sabe" o que é uma cobrança: ele produz a continuação mais provável para um texto que começa pedindo um e-mail de cobrança. Isso funciona espantosamente bem para escrever, resumir, reorganizar e explicar.',
      'A mesma mecânica explica o erro mais perigoso: quando falta informação, o modelo preenche com o que é plausível, não com o que é verdadeiro. Ele pode inventar o nome de uma empresa, um número de telefone ou uma lei. Isso tem nome — alucinação — e não é um defeito que some com um modelo melhor; é uma característica a ser administrada.',
      'A conclusão prática é simples: use IA para a forma e verifique o conteúdo. Texto, estrutura e variações, ela faz bem. Fato sobre o mundo — preço, telefone, se a empresa tem site — você confere.',
    ],
    example:
      'Pedir "escreva a descrição deste prato com estes ingredientes" funciona. Pedir "quais são os restaurantes sem site em Curitiba" produz uma lista plausível e provavelmente falsa.',
    mistakes: [
      'Tratar resposta fluente como resposta correta.',
      'Pedir dados do mundo real sem fornecer a fonte.',
      'Colar a resposta no cliente sem ler inteiro.',
    ],
    moduleKey: 'studio',
    moduleLabel: 'Praticar no IA Studio',
    terms: ['prompt', 'alucinacao'],
  },
  {
    key: 'engenharia-de-prompt',
    track: 'ia',
    title: 'Engenharia de prompt na prática',
    summary: 'Um bom prompt tem papel, contexto, objetivo, método, restrições, critérios e formato.',
    body: [
      'A diferença entre uma resposta genérica e uma resposta útil quase nunca está no modelo — está no pedido. Um prompt completo responde antes: quem você quer que o modelo seja, qual é a situação, o que precisa sair, como chegar lá, o que não fazer, como saber se ficou bom e em que formato entregar.',
      'A parte que mais economiza tempo é a de restrições e critérios de qualidade. "Escreva uma legenda" devolve qualquer coisa. "Máximo de 60 palavras, sem hashtag genérica, com uma chamada executável pelo WhatsApp" devolve algo que você publica.',
      'Troque adjetivo por critério. "Deixe mais profissional" não é instrução: "use terceira pessoa, sem gíria, com frases de no máximo duas linhas" é.',
    ],
    example:
      'Compare: "faça um texto para o site do restaurante" contra "Papel: redator de negócios locais. Objetivo: apresentar o restaurante em até 120 palavras. Restrições: sem superlativo, citar apenas os pratos da lista."',
    mistakes: [
      'Pedir tudo em uma frase e depois reclamar do resultado.',
      'Não dizer o formato de saída e receber texto corrido.',
      'Usar palavras subjetivas como critério.',
    ],
    moduleKey: 'studio',
    moduleLabel: 'Montar um prompt estruturado',
    terms: ['prompt', 'variavel-de-prompt'],
  },
  {
    key: 'limites-da-ia',
    track: 'ia',
    title: 'Onde a IA atrapalha o seu trabalho',
    summary: 'Três situações em que usar IA custa mais caro do que não usar.',
    body: [
      'Primeira: dado verificável. Preço, telefone, endereço, prazo legal, disponibilidade de domínio. Se você não forneceu, não confie no que veio.',
      'Segunda: compromisso com cliente. Toda promessa que entra numa proposta é sua, não do modelo. Texto gerado que promete prazo ou resultado precisa ser revisado como se você tivesse escrito à mão — porque, para o cliente, você escreveu.',
      'Terceira: o que você não sabe avaliar. IA acelera quem já sabe revisar. Se você não consegue julgar se o código, o contrato ou o diagnóstico está certo, o risco de entregar algo errado cresce junto com a velocidade.',
    ],
    example:
      'Um orçamento gerado com prazo de 5 dias que você não checou vira um compromisso real no instante em que você aperta enviar.',
    mistakes: [
      'Enviar texto gerado sem ler.',
      'Usar IA para decidir preço de mercado.',
      'Aceitar uma explicação técnica que você não tem como conferir.',
    ],
    terms: ['alucinacao'],
  },
  {
    key: 'publico-e-nicho',
    track: 'marketing',
    title: 'Público, nicho e por que escolher ajuda a vender',
    summary: 'Falar com todo mundo é a forma mais cara de não falar com ninguém.',
    body: [
      'Nicho é o recorte de mercado que você escolhe atender. Público-alvo é a descrição de quem está dentro desse recorte. Escolher um nicho não reduz o seu mercado — reduz o seu custo de convencer.',
      'Quando você atende "qualquer negócio", cada conversa começa do zero: você não conhece o problema, não tem exemplo parecido e seu preço parece arbitrário. Quando você atende restaurantes de bairro, a segunda conversa já é mais fácil que a primeira, e a décima é quase automática.',
      'Na prática, escolher nicho muda três coisas no seu dia: o catálogo de serviços que faz sentido oferecer, a lista de empresas que você aborda e o argumento que você usa.',
    ],
    example:
      'O mesmo serviço de site vale mais para um restaurante sem cardápio online do que para "um negócio qualquer" — porque o problema é concreto e a prova é visível.',
    mistakes: [
      'Confundir nicho com limitar a clientela.',
      'Mudar de nicho antes de ter feito dez conversas no primeiro.',
      'Escolher nicho por tendência, não por acesso real a esses clientes.',
    ],
    moduleKey: 'radar-servicos',
    moduleLabel: 'Filtrar o catálogo por segmento',
    terms: ['nicho', 'publico-alvo'],
  },
  {
    key: 'oferta',
    track: 'marketing',
    title: 'Oferta: a diferença entre serviço e proposta',
    summary: 'Serviço é o que você faz. Oferta é o que o cliente compra.',
    body: [
      'Um serviço descrito por dentro — "criação de site institucional responsivo" — é uma lista de tarefas. Uma oferta é a mesma coisa descrita pelo resultado, com escopo, prazo, preço e condição: "sua página no ar em 10 dias úteis, com cardápio que você mesmo atualiza, por X, com duas rodadas de ajuste".',
      'A oferta boa elimina dúvida. Quanto custa, quando fica pronto, o que eu preciso enviar, o que acontece se eu quiser mudar algo. Toda pergunta não respondida vira hesitação, e hesitação vira "vou pensar".',
      'Por isso o Gerador de Ofertas cobra escopo, prazo, revisões e responsabilidades do cliente: não é burocracia, é o que transforma conversa em decisão.',
    ],
    example:
      '"Faço sites" é serviço. "Site de uma página com cardápio digital, no ar em 10 dias úteis, duas revisões incluídas" é oferta.',
    mistakes: [
      'Mandar preço sem escopo.',
      'Deixar o número de revisões em aberto.',
      'Descrever o processo em vez do resultado.',
    ],
    moduleKey: 'offers',
    moduleLabel: 'Montar uma oferta',
    terms: ['oferta', 'escopo', 'proposta-de-valor'],
  },
  {
    key: 'copy-basico',
    track: 'marketing',
    title: 'Copywriting sem fórmula mágica',
    summary: 'Escrever para vender é organizar informação na ordem em que o leitor decide.',
    body: [
      'Quem lê decide em uma ordem previsível: isto é para mim? entendi o que é? acredito? vale o preço? o que faço agora? Um bom texto comercial responde nessa ordem e não pula etapa.',
      'A matéria-prima não é criatividade, é escuta. As melhores frases de venda costumam ser frases que o próprio cliente disse na entrevista. Anote o que ele fala e devolva com organização.',
      'Promessa exagerada é o atalho que custa caro: ela aumenta a resposta no começo e destrói a confiança na entrega. Prefira a promessa que você consegue cumprir com folga.',
    ],
    example:
      'Em vez de "revolucione sua presença digital", escreva "seu cliente acha o cardápio e o telefone em dois toques, sem precisar te chamar".',
    mistakes: [
      'Começar falando de si mesmo.',
      'Usar superlativo no lugar de prova.',
      'Pedir mais de uma ação na mesma página.',
    ],
    moduleKey: 'library',
    moduleLabel: 'Usar os prompts de copy',
    terms: ['cta', 'proposta-de-valor'],
  },
  {
    key: 'funil',
    track: 'marketing',
    title: 'Funil de vendas: o que realmente significa',
    summary: 'É só o nome dado às etapas entre "nunca ouviu falar" e "comprou".',
    body: [
      'Funil é uma metáfora de contagem: muita gente entra, pouca gente compra. A utilidade dele não é desenhar bonito, é saber em qual etapa você está perdendo gente — porque a solução é diferente em cada uma.',
      'Se poucos conhecem você, o problema é alcance. Se muitos conhecem e poucos pedem orçamento, o problema é oferta ou clareza. Se muitos pedem orçamento e poucos fecham, o problema é preço, confiança ou acompanhamento.',
      'No CRM, os estágios são exatamente isso. Olhar onde as negociações empacam diz mais sobre o seu negócio do que qualquer métrica de rede social.',
    ],
    example: 'Dez abordagens, três respostas, duas propostas, um fechamento — esse é o seu funil real deste mês.',
    mistakes: [
      'Tentar resolver tudo com mais alcance.',
      'Não mover a negociação de estágio, perdendo a leitura do funil.',
      'Comparar o seu funil com número de outra pessoa.',
    ],
    moduleKey: 'crm',
    moduleLabel: 'Ver seu funil',
    terms: ['funil', 'lead', 'crm'],
  },
  {
    key: 'prospeccao-basico',
    track: 'vendas',
    title: 'Prospecção: primeira mensagem que não é spam',
    summary: 'Abordagem boa é curta, específica, verificável e fácil de recusar.',
    body: [
      'Quatro características separam uma abordagem de um spam. Curta: cabe em uma tela. Específica: fala de um ponto que você observou naquele negócio. Verificável: só afirma o que você conferiu. Fácil de recusar: oferece uma saída clara, sem culpa.',
      'A tentação é mandar a mesma mensagem para cem contatos. O resultado conhecido é bloqueio, número queimado e reputação comprometida — além de violar as regras das plataformas. Dez mensagens personalizadas rendem mais que cem iguais.',
      'Nunca afirme o que você não verificou. Dizer "vi que vocês não têm site" para quem tem site encerra a conversa antes dela começar; "não encontrei o site de vocês ao procurar" é verdade e abre espaço.',
    ],
    example:
      '"Olá! Trabalho com cardápio digital para restaurantes. Vi que o cardápio de vocês está em foto no perfil. Posso mostrar como ficaria com link e QR code? Se não fizer sentido, é só me dizer."',
    mistakes: [
      'Mandar texto igual para todo mundo.',
      'Afirmar algo sobre o negócio sem ter conferido.',
      'Insistir depois do terceiro contato sem resposta.',
    ],
    moduleKey: 'prospecting',
    moduleLabel: 'Preparar uma abordagem',
    terms: ['lead', 'follow-up'],
  },
  {
    key: 'o-que-e-crm',
    track: 'vendas',
    title: 'CRM: para que serve esse nome feio',
    summary: 'É o lugar onde você registra com quem falou, o que combinou e o que fazer a seguir.',
    body: [
      'CRM quer dizer gestão de relacionamento com o cliente. Na prática, para quem trabalha sozinho, é uma lista organizada de conversas comerciais com um estágio e uma próxima ação em cada uma.',
      'O valor não está na ferramenta, está em não depender da memória. Memória esquece justamente a negociação que estava quase fechando, e lembra da que já disse não três vezes.',
      'Regra de uso: mova o estágio quando algo acontecer de verdade, e registre a próxima ação com data. Funil cheio de "contatado" de dois meses atrás não é funil, é lista de pendências.',
    ],
    example: 'Depois de cada conversa, duas linhas: o que foi dito e quando você volta a falar. Isso já é um CRM funcionando.',
    mistakes: [
      'Registrar tudo e nunca mais olhar.',
      'Deixar negociação sem próxima ação definida.',
      'Confiar na memória para follow-up.',
    ],
    moduleKey: 'crm',
    moduleLabel: 'Abrir o CRM',
    terms: ['crm', 'lead', 'follow-up'],
  },
  {
    key: 'negociacao',
    track: 'vendas',
    title: 'Negociar sem derrubar o próprio preço',
    summary: 'Quando o cliente acha caro, mexa no escopo, não no valor da sua hora.',
    body: [
      'Baixar o preço mantendo o escopo ensina duas coisas ao cliente: que o preço inicial era inflado e que insistir funciona. Nenhuma das duas ajuda nas próximas conversas.',
      'A alternativa é negociar escopo: entregue menos pelo valor menor, ou divida a entrega em etapas pagas separadamente. O cliente decide o que cabe no bolso dele sem que você trabalhe de graça.',
      '"Achei caro" também pode significar "não entendi o valor". Antes de ceder, verifique se o problema é preço ou clareza — muitas vezes a proposta não explicava o que estava incluído.',
    ],
    example:
      '"Consigo fechar nesse valor entregando a página principal agora e o cardápio digital no mês que vem. Faz sentido assim?"',
    mistakes: [
      'Dar desconto na primeira objeção.',
      'Aceitar escopo aberto para fechar logo.',
      'Negociar sem ter o custo real calculado.',
    ],
    moduleKey: 'pricing',
    moduleLabel: 'Calcular seu custo real',
    terms: ['escopo', 'margem'],
  },
  {
    key: 'briefing',
    track: 'servicos',
    title: 'Briefing: a hora de evitar o retrabalho',
    summary: 'Cada pergunta não feita no começo vira ajuste não pago no fim.',
    body: [
      'Briefing não é formalidade: é a coleta das informações que mudam a execução. Quem aprova, quem envia material, até quando, o que está fora do escopo. Essas quatro perguntas evitam a maioria dos atritos de projeto pequeno.',
      'Cliente responde pouco por escrito e muito falando. Faça por conversa, grave com autorização, transcreva e devolva o resumo por escrito pedindo confirmação. O "confirmo" dele vale muito mais do que a sua anotação.',
      'Pergunta sem resposta não desaparece: ela vira premissa sua. Registre como premissa na proposta, para ficar claro em que base o preço foi feito.',
    ],
    example:
      '"Confirmando o que conversamos: vocês enviam fotos até dia 10, a aprovação é com você, e impressão não está incluída. Pode confirmar?"',
    mistakes: [
      'Começar a executar sem briefing para "ganhar tempo".',
      'Aceitar "faz do seu jeito" como resposta.',
      'Não registrar quem aprova.',
    ],
    moduleKey: 'projects',
    moduleLabel: 'Usar um modelo de briefing',
    terms: ['briefing', 'escopo', 'premissa'],
  },
  {
    key: 'escopo-e-entregaveis',
    track: 'servicos',
    title: 'Escopo e entregáveis: o que separa combinado de confusão',
    summary: 'Entregável é o que o cliente recebe. Escopo é a fronteira do que está incluído.',
    body: [
      'Entregável precisa ser concreto e verificável: "página publicada no domínio do cliente" é entregável; "presença digital fortalecida" não é. Se não dá para marcar como entregue ou não entregue, não é entregável.',
      'A parte mais útil do escopo é a negativa: o que NÃO está incluído. Produção de fotos, redação de textos, impressão, manutenção mensal. É a seção que evita o pedido extra apresentado como "só um ajustezinho".',
      'Pedido fora do escopo não é problema — é oportunidade de orçamento novo. Problema é pedido fora do escopo executado de graça, que ensina que o escopo não vale nada.',
    ],
    example: 'Escopo: site de uma página. Fora do escopo: produção de fotos, textos institucionais, manutenção mensal.',
    mistakes: [
      'Entregável vago.',
      'Não escrever o que está fora.',
      'Executar extras sem registrar.',
    ],
    moduleKey: 'service-builder',
    moduleLabel: 'Estruturar um serviço',
    terms: ['escopo', 'entregavel'],
  },
  {
    key: 'precificacao',
    track: 'servicos',
    title: 'Precificação: comece pelo seu custo, não pelo do concorrente',
    summary: 'Antes de saber quanto cobrar, você precisa saber quanto o trabalho custa.',
    body: [
      'O erro clássico é olhar o preço do concorrente e tirar 20%. Isso ignora que o custo dele é outro, a estrutura é outra e o escopo talvez também. O ponto de partida é o seu: horas, custos e margem.',
      'Horas invisíveis derrubam o cálculo: reunião, briefing, idas e vindas, revisões. Elas acontecem sempre. Se ficarem fora da conta, você trabalha mais horas pelo mesmo valor e conclui que o problema é o mercado.',
      'Margem não é lucro extra — é a reserva para imprevisto, inadimplência e o tempo de orçamento que não vira projeto. Zero de margem significa que qualquer atraso sai do seu bolso.',
    ],
    example: '10 h de execução + 2 revisões de 1 h + 2 h de reunião = 14 h faturáveis. Esse é o número que entra na conta.',
    mistakes: [
      'Cobrar por "tabela do mercado" sem saber o próprio custo.',
      'Esquecer as horas de reunião.',
      'Somar imposto por fora em vez de embutir.',
    ],
    moduleKey: 'pricing',
    moduleLabel: 'Abrir a calculadora',
    terms: ['margem', 'valor-hora'],
  },
  {
    key: 'prazos-e-revisoes',
    track: 'servicos',
    title: 'Prazos e revisões: onde o projeto escorrega',
    summary: 'Prazo que começa na assinatura, e não no recebimento do material, é prazo que você vai estourar.',
    body: [
      'Conte o prazo a partir do recebimento completo do material. Atraso do cliente desloca a entrega na mesma medida — e isso precisa estar escrito, não combinado por áudio.',
      'Revisões precisam de número. "Até o cliente ficar satisfeito" é um contrato sem fim, e o custo dele é sempre seu. Duas rodadas cobrem a maioria dos casos; ajustes além disso viram orçamento adicional.',
      'Pequenos pedidos somados viram um segundo projeto. Registre cada um. A conversa fica mais fácil quando você mostra a lista em vez de reclamar da sensação.',
    ],
    example: '"Prazo de 10 dias úteis a contar do recebimento das fotos e textos. Duas rodadas de ajuste incluídas."',
    mistakes: [
      'Prazo sem condição de início.',
      'Revisão ilimitada.',
      'Não registrar pedidos extras.',
    ],
    moduleKey: 'offers',
    moduleLabel: 'Revisar suas ofertas',
    terms: ['escopo', 'revisao'],
  },
  {
    key: 'automacao',
    track: 'servicos',
    title: 'Automação: quando vale e quando atrapalha',
    summary: 'Automatizar um processo ruim só faz o erro acontecer mais rápido.',
    body: [
      'Automação é ligar ferramentas para que uma tarefa repetitiva aconteça sozinha: o formulário preenchido cai na planilha, a planilha dispara o aviso, o aviso vira tarefa. O ganho não é tecnológico, é de tempo e de erro — ninguém mais copia dado de um lugar para outro à mão.',
      'A regra antes de automatizar é mapear o processo manual com quem executa. Se o processo tem exceções a cada três casos, automatizar vai produzir exceções automáticas. Arrume o processo primeiro; automatize depois.',
      'Automação cobra manutenção: a ferramenta de origem muda, o plano gratuito vira pago, a integração quebra em silêncio. Por isso o serviço se vende em duas partes — implantação e manutenção — e a assinatura das ferramentas é custo do cliente, dito antes da proposta.',
    ],
    example:
      'Formulário de orçamento → linha na planilha → mensagem para o vendedor com os dados → tarefa com prazo de retorno. Três cópias manuais a menos por pedido.',
    mistakes: [
      'Automatizar antes de entender o processo real.',
      'Esquecer de tratar o erro: quando a automação falha, alguém precisa ser avisado.',
      'Embutir o custo das ferramentas no seu preço sem avisar o cliente.',
    ],
    moduleKey: 'radar-servicos',
    moduleLabel: 'Ver o serviço no catálogo',
    terms: ['automacao', 'escopo'],
  },
  {
    key: 'proposta-comercial',
    track: 'vendas',
    title: 'Proposta comercial: o documento que fecha ou afunda a venda',
    summary: 'Uma boa proposta responde antes o que o cliente perguntaria depois.',
    body: [
      'Proposta não é orçamento. Orçamento é um número; proposta é o documento que explica o problema, o que será entregue, em quanto tempo, com quantas revisões, o que o cliente precisa fazer e o que acontece a seguir. O número é só uma das linhas.',
      'A seção mais negligenciada é a do que NÃO está incluído. Ela parece defensiva, mas é o oposto: tira a ambiguidade que vira atrito no meio do projeto, quando o cliente pede "só um ajustezinho" que custa dois dias.',
      'Prazo sempre condicionado ao recebimento do material, e revisões sempre em número. "Até ficar bom" é um contrato sem fim, e quem paga por ele é você.',
    ],
    example:
      '"Prazo de 10 dias úteis a contar do recebimento das fotos e textos. Duas rodadas de ajuste incluídas; ajustes adicionais orçados à parte."',
    mistakes: [
      'Mandar preço por mensagem, sem escopo.',
      'Deixar revisões em aberto.',
      'Prometer algo que depende de terceiros (gráfica, aprovação de plataforma, prazo de domínio).',
    ],
    moduleKey: 'offers',
    moduleLabel: 'Montar uma proposta',
    terms: ['oferta', 'escopo', 'revisao'],
  },
  {
    key: 'portfolio',
    track: 'servicos',
    title: 'Portfólio: o que mostrar quando você está começando',
    summary: 'Trabalho autorizado, resultado verificável e o problema que foi resolvido.',
    body: [
      'Quem começa não tem caso de cliente — mas tem trabalho. Faça para um negócio conhecido, faça um exercício a partir de um negócio real (deixando claro que é exercício) ou faça o seu próprio material. O que não vale é inventar cliente.',
      'Peça autorização antes de publicar qualquer trabalho de cliente, inclusive print. Em contrapartida, peça o depoimento na semana da entrega, quando o resultado está fresco.',
      'Mostre o problema antes da peça bonita. "Cardápio em foto de 2023, sem telefone visível" seguido do depois diz mais do que qualquer tela sem contexto.',
    ],
    example:
      'Um card com três partes: situação encontrada, o que foi feito, o que mudou de concreto (com autorização do cliente).',
    mistakes: [
      'Publicar trabalho de cliente sem autorização.',
      'Mostrar só a tela final, sem o problema.',
      'Apresentar exercício como cliente real.',
    ],
    terms: ['entregavel'],
  },
] as const

export interface GlossaryTerm {
  key: string
  term: string
  definition: string
  example: string
  moduleKey?: string
  moduleLabel?: string
}

export const GLOSSARY: readonly GlossaryTerm[] = [
  {
    key: 'crm',
    term: 'CRM',
    definition:
      'Ferramenta para organizar contatos comerciais, acompanhar negociações e registrar o que já foi conversado.',
    example: 'Depois de cada conversa, você registra o que foi dito e qual é o próximo passo, com data.',
    moduleKey: 'crm',
    moduleLabel: 'Abrir o CRM',
  },
  {
    key: 'lead',
    term: 'Lead',
    definition: 'Contato com alguma chance de virar cliente — alguém que demonstrou interesse ou que você identificou.',
    example: 'Um restaurante que respondeu sua mensagem perguntando o preço é um lead.',
  },
  {
    key: 'funil',
    term: 'Funil de vendas',
    definition: 'As etapas entre conhecer e comprar. Serve para ver onde você perde pessoas.',
    example: 'Dez abordagens, três respostas, duas propostas, um fechamento.',
    moduleKey: 'crm',
    moduleLabel: 'Ver seu funil',
  },
  {
    key: 'follow-up',
    term: 'Follow-up',
    definition: 'O contato de acompanhamento depois de uma conversa ou proposta enviada.',
    example: 'Dois dias depois do envio, confirmar se a proposta chegou.',
    moduleKey: 'prospecting',
    moduleLabel: 'Montar um follow-up',
  },
  {
    key: 'nicho',
    term: 'Nicho',
    definition: 'O recorte de mercado que você escolhe atender.',
    example: 'Restaurantes de bairro de uma cidade, em vez de "qualquer empresa".',
  },
  {
    key: 'publico-alvo',
    term: 'Público-alvo',
    definition: 'A descrição de quem você quer atingir dentro do nicho escolhido.',
    example: 'Donos de restaurante com até 10 funcionários, que cuidam eles mesmos das redes.',
  },
  {
    key: 'oferta',
    term: 'Oferta',
    definition: 'O serviço apresentado como decisão de compra: escopo, prazo, preço e condições.',
    example: 'Site de uma página com cardápio, em 10 dias úteis, duas revisões incluídas.',
    moduleKey: 'offers',
    moduleLabel: 'Criar uma oferta',
  },
  {
    key: 'proposta-de-valor',
    term: 'Proposta de valor',
    definition: 'O que muda na vida do cliente quando ele contrata — na visão dele, não na sua.',
    example: 'Parar de responder "qual o preço?" vinte vezes por dia.',
  },
  {
    key: 'cta',
    term: 'CTA (chamada para ação)',
    definition: 'A ação única e específica que você pede a quem está lendo.',
    example: '"Me chame no WhatsApp com o nome do seu restaurante."',
  },
  {
    key: 'escopo',
    term: 'Escopo',
    definition: 'A fronteira do que está e do que não está incluído no serviço.',
    example: 'Inclui montagem do site. Não inclui produção de fotos nem textos.',
    moduleKey: 'service-builder',
    moduleLabel: 'Definir um escopo',
  },
  {
    key: 'entregavel',
    term: 'Entregável',
    definition: 'Algo concreto que o cliente recebe e que dá para marcar como entregue.',
    example: 'Página publicada, QR code em arquivo, planilha com painel.',
  },
  {
    key: 'briefing',
    term: 'Briefing',
    definition: 'A coleta estruturada das informações necessárias para executar o serviço.',
    example: 'Quem aprova, quem envia material, até quando, o que está fora do escopo.',
    moduleKey: 'projects',
    moduleLabel: 'Preencher um briefing',
  },
  {
    key: 'premissa',
    term: 'Premissa',
    definition: 'Suposição que você assumiu porque a informação não veio — e que o preço considera.',
    example: '"Orçamento considera até 30 produtos no catálogo."',
  },
  {
    key: 'revisao',
    term: 'Revisão',
    definition: 'Rodada de ajuste no trabalho entregue, combinada em número na proposta.',
    example: 'Duas rodadas incluídas; a terceira é orçada à parte.',
  },
  {
    key: 'margem',
    term: 'Margem',
    definition: 'Percentual acrescentado ao custo para cobrir imprevisto, inadimplência e tempo não faturado.',
    example: '20% sobre o custo de trabalho e despesas.',
    moduleKey: 'pricing',
    moduleLabel: 'Calcular com margem',
  },
  {
    key: 'valor-hora',
    term: 'Valor por hora',
    definition: 'Quanto vale uma hora do seu trabalho — base de qualquer orçamento por projeto.',
    example: 'Mesmo cobrando por projeto, o valor sai de horas estimadas × valor por hora.',
    moduleKey: 'pricing',
    moduleLabel: 'Abrir a calculadora',
  },
  {
    key: 'prompt',
    term: 'Prompt',
    definition: 'A instrução que você dá a um modelo de linguagem.',
    example: 'Papel, contexto, objetivo, método, restrições e formato de saída.',
    moduleKey: 'studio',
    moduleLabel: 'Montar no IA Studio',
  },
  {
    key: 'variavel-de-prompt',
    term: 'Variável de prompt',
    definition: 'Trecho marcado com {{chaves}} que você troca a cada uso, reaproveitando a mesma estrutura.',
    example: '"O negócio é {{negocio}}, do segmento {{segmento}}."',
    moduleKey: 'studio',
    moduleLabel: 'Usar variáveis',
  },
  {
    key: 'copywriting',
    term: 'Copywriting',
    definition: 'Escrever com o objetivo de levar alguém a uma decisão — organizar informação na ordem em que o leitor decide.',
    example: 'Trocar "somos uma empresa inovadora" por "seu cliente acha o cardápio em dois toques".',
    moduleKey: 'library',
    moduleLabel: 'Usar os prompts de copy',
  },
  {
    key: 'prospeccao',
    term: 'Prospecção',
    definition: 'Procurar e abordar possíveis clientes de forma ativa, em vez de esperar que eles apareçam.',
    example: 'Listar dez restaurantes do bairro, verificar a presença digital de cada um e enviar uma mensagem personalizada por dia.',
    moduleKey: 'prospecting',
    moduleLabel: 'Preparar uma abordagem',
  },
  {
    key: 'engenharia-de-prompt',
    term: 'Engenharia de prompts',
    definition: 'Estruturar a instrução dada à IA — papel, contexto, objetivo, método, restrições e formato — para obter resposta útil em vez de genérica.',
    example: 'Trocar "faça um texto" por "papel, objetivo, 120 palavras, sem superlativo, formato em tópicos".',
    moduleKey: 'studio',
    moduleLabel: 'Montar no IA Studio',
  },
  {
    key: 'automacao',
    term: 'Automação',
    definition: 'Ligar ferramentas para que uma tarefa repetitiva aconteça sozinha, sem alguém copiando dado de um lugar para outro.',
    example: 'Formulário preenchido vira linha na planilha e aviso para o vendedor, sem digitação.',
  },
  {
    key: 'proposta-comercial',
    term: 'Proposta comercial',
    definition: 'Documento que apresenta problema, solução, escopo, prazo, revisões, preço e próximos passos — diferente de um orçamento, que é só o número.',
    example: 'A proposta diz o que está incluído e, principalmente, o que não está.',
    moduleKey: 'offers',
    moduleLabel: 'Criar uma oferta',
  },
  {
    key: 'alucinacao',
    term: 'Alucinação',
    definition: 'Quando o modelo produz informação plausível e falsa, geralmente onde falta dado.',
    example: 'Inventar o telefone de uma empresa que você não forneceu.',
  },
] as const

export function lessonByKey(key: string): Lesson | undefined {
  return LESSONS.find((lesson) => lesson.key === key)
}

export function termByKey(key: string): GlossaryTerm | undefined {
  return GLOSSARY.find((item) => item.key === key)
}
