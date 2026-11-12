# Radar de empresas reais — análise de fontes (Marco 3)

Documento de decisão. **O módulo não está implementado**, e a ausência dele não
afeta nenhuma outra parte do aplicativo: os contratos vivem isolados em
`src/integrations/radar/`, e a implementação padrão (`notConfiguredRadar`)
recusa a busca em vez de devolver lista vazia ou dados de exemplo.

Consulta às fontes feita em **14/10/2026**. Termos de serviço mudam: confirme
cada ponto na versão vigente antes de implementar. Isto é análise técnica, não
parecer jurídico.

## 1. O que o módulo precisa entregar

Pesquisar por cidade e segmento; mostrar nome, categoria, endereço, telefone
comercial público e website quando a fonte fornecer; indicar **ausência de
website na fonte** sem afirmar que a empresa não tem site; permitir preparar
abordagem, abrir contato e levar ao CRM quando a licença permitir.

## 2. Comparativo das fontes

| | OpenStreetMap (Overpass) | Google Places API | Base pública de CNPJ |
| --- | --- | --- | --- |
| Cobertura de pequenos negócios | Irregular: ótima em capitais, fraca em cidades menores | A melhor disponível | Universal (cadastro fiscal), mas sem "está aberto" |
| Telefone e website | Tags `phone`/`contact:phone` e `website`/`contact:website`, quando preenchidas | Sim, nos campos de detalhe | Alguns registros trazem telefone e e-mail |
| Segmentação | Tags de categoria (`amenity`, `shop`, `cuisine`) | Categorias próprias, boas | CNAE (atividade econômica) |
| Licença | ODbL | Termos do Maps Platform | Dados abertos da Receita Federal |
| Uso comercial | Permitido | Permitido dentro dos termos | Permitido, com atenção à LGPD |
| Guardar no CRM | Permitido; vira base derivada | **É aqui que mora o problema** (ver 2.2) | Permitido |
| Custo | Zero (endpoint público, com política de uso) ou servidor próprio | Por consulta, após a camada gratuita | Zero (download dos arquivos) |

### 2.1 OpenStreetMap — candidata principal

A licença ODbL permite uso comercial e exige atribuição; o compartilhamento
pela mesma licença vale para **uso público** da base derivada — distribuir para
fora da organização ou disponibilizá-la a terceiros. Uso interno não obriga a
compartilhar nada, o que cobre o caso aqui: cada usuário guarda no próprio
aparelho as empresas que pesquisou.

Pontos de atenção: a cobertura varia muito por cidade e as tags de contato são
preenchidas por voluntários (ou seja, ausência de `website` significa
*ausência de dado*, nunca ausência de site — exatamente a distinção que o
produto já modela). O endpoint público do Overpass tem política de uso que não
comporta aplicação comercial com volume: o caminho correto é instância própria
ou provedor pago, o que recoloca custo de infraestrutura.

### 2.2 Google Places — a melhor cobertura, com a restrição que decide

Cobertura e qualidade de dados são superiores. O impedimento é a retenção: nos
termos do Maps Platform, `place_id` pode ser armazenado conforme as políticas
do Places, enquanto latitude e longitude só podem ser mantidas em cache
temporário por até **30 dias consecutivos**. Montar um catálogo de leads que o
usuário guarda indefinidamente não cabe nessa regra, e as políticas específicas
do Places precisam ser lidas na íntegra antes de qualquer decisão — a página de
termos remete a elas.

Conclusão prática: Places serve bem para **consulta pontual com exibição**, mal
para **base de prospecção persistente**. Se for escolhida, o produto precisa
guardar apenas a referência permitida e reconsultar, nunca copiar o conteúdo
para o IndexedDB do usuário. É por isso que `RadarSource.retention` existe no
contrato: a política de retenção é um dado da fonte, aplicado em código.

### 2.3 Base pública de CNPJ — complemento, não substituta

Cobertura universal e custo zero, mas descreve a situação cadastral, não o
negócio em operação: não diz se a loja existe de fato, não tem website e traz
dados de contato que, quando são de pessoa natural, exigem base legal da LGPD
para tratamento. Útil para enriquecer (CNAE, endereço, situação cadastral) e
péssima como fonte primária de "quem abordar hoje".

## 3. Recomendação

Começar por **OpenStreetMap**, por três motivos: licença compatível com guardar
o lead, custo previsível e ausência de cláusula que impeça a prospecção. Tratar
Places como opção de consulta pontual, se e quando houver demanda — com a
retenção respeitada em código, não na confiança.

## 4. Infraestrutura mínima

```
navegador → POST /api/radar/buscar → servidor → fonte (Overpass própria ou provedor)
```

O servidor precisa: guardar a credencial, validar parâmetros, limitar por
usuário e por período, aplicar teto de custo, cortar requisição por tempo e
tamanho (anti-SSRF), tratar indisponibilidade da fonte e aplicar a política de
retenção antes de devolver qualquer campo.

Custo mensal estimado, em ordem de grandeza: um servidor pequeno para a API
(faixa de poucas dezenas de reais) mais, se for o caminho escolhido, uma
instância própria de Overpass — que é pesada em disco e memória e custa bem
mais do que a API. Alternativa intermediária: provedor pago de consultas sobre
OSM, com custo por chamada. Nenhum desses números deve ir para o material de
venda antes de ser contratado de verdade.

## 5. O que já está pronto no código

- `src/integrations/radar/types.ts` — `RadarQuery`, `RadarResult`, `RadarSource` (com política de retenção), `RadarPort`.
- `src/integrations/radar/notConfigured.ts` — recusa a busca e, na conversão para o CRM, descarta os campos que a licença da fonte não permite guardar.
- Testes cobrindo a recusa e o descarte por retenção.
- `CompanyLead.source` já separa `manual` de `provedor-externo`, e `DigitalPresence` já distingue "não cadastrado na fonte" de "verificado".

Falta, e depende de decisão externa: escolher a fonte, contratar a
infraestrutura, implementar o endpoint e a interface de busca.

Fontes consultadas: [Google Maps Platform Service Specific Terms](https://cloud.google.com/maps-platform/terms/maps-service-terms/index-20240522) · [OSM Foundation — Licence and Legal FAQ](https://osmfoundation.org/wiki/Licence_and_Legal_FAQ)
