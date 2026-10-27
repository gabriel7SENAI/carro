# Chevrolet Celta 2005 / Automotive Studio — carro 3D com Three.js

## Audi de teste: peças separadas
O arquivo `../twin_turbo_6.0__v8_ls_engine_revised.glb` é carregado por `engine.js`, ajustado uniformemente para caber no cofre e exibido ao abrir o capô. A montagem do V8 twin-turbo é fictícia e não representa o motor original ou compatibilidade mecânica do Audi S3. As texturas e os arquivos GLB originais são preservados; o preenchimento preto do cofre é removido apenas da geometria em memória. Se o motor não carregar, a atividade continua com sua representação simples.

Há também uma primeira atividade em `lesson.js`: abrir a tampa da caixa de ar, retirar o filtro, instalar um novo e fechar a tampa. O botão “Começar atividade” abre o capô e aproxima a câmera. A tampa e o filtro podem ser selecionados na cena; os botões oferecem a mesma sequência. A atividade pode ser reiniciada ou encerrada, e fica indisponível no Celta.

As peças do cofre foram criadas como representações didáticas simplificadas. A sequência com presilhas fictícias não é um procedimento de manutenção específico do Audi. Não há pontuação ou persistência nesta primeira versão.

O visualizador também carrega `../audi_s3_limousine_8v_separated.glb`. O arquivo original foi preservado. A cópia contém superfícies de pintura separadas por conectividade, incluindo capô, tampa do porta-malas e painéis de portas.

Os botões de capô e porta-malas animam dobradiças criadas em `audi.js`. As portas ainda não são articuladas: seus vidros, molduras e acabamentos precisam ser agrupados com os painéis. A abertura do capô revela o V8 importado, quando disponível.

Para gerar novamente a cópia, execute `python tools/separate_audi.py` na raiz do projeto. O script preserva os atributos de vértices, materiais e texturas, verificando que todos os triângulos de pintura foram mantidos.

## Como executar
1. Extraia a pasta do ZIP.
2. Abra a pasta no VS Code.
3. Inicie um servidor local. Recomendado: extensão **Live Server** e depois clique em **Go Live** no `index.html`.
4. O navegador precisa de internet para carregar o Three.js pelo CDN e a fonte Google Fonts. O mapa de imports no `index.html` resolve o módulo `three` usado pelo OrbitControls.

> Não abra o `index.html` diretamente com `file://`: módulos JavaScript podem ser bloqueados pelo navegador.

## Controles
- Arraste com o botão esquerdo: orbitar o carro.
- Scroll: zoom.
- Arraste com o botão direito: mover a câmera.
- Seletor de cores: muda a pintura.
- Faróis: liga/desliga as luzes dianteiras.
- Rotação automática: ativa/desativa o giro.
- Reiniciar visão: volta à câmera inicial.

## Estrutura
- `index.html`: estrutura e controles da interface.
- `style.css`: visual responsivo.
- `celta.js`: modelo procedural do Celta de duas portas, com carroceria, vidros, rodas e detalhes.
- `main.js`: cena Three.js, geometria do veículo, materiais, iluminação, câmera e interações.

## Modelo
A cena foi adaptada para um Chevrolet Celta 2005 de duas portas, com base nas imagens da pasta `../celta`. A foto lateral orienta a carroceria; as outras imagens orientam a frente e a traseira.

A geometria inclui caixas de roda abertas, teto alto de hatch, vidros laterais, farois, lanternas verticais, frisos, retrovisores, limpadores, antena e rodas com pneus de perfil alto. A pintura inicial e prata.

O modelo e uma aproximacao estilizada feita com geometrias Three.js, sem arquivo GLB externo. Nao representa uma replica dimensional exata.

## Verificacao
Cena verificada no Microsoft Edge com WebGL, sem erros JavaScript, em telas desktop e mobile. Controles de pintura, farois, rotacao e reinicio verificados no navegador.
